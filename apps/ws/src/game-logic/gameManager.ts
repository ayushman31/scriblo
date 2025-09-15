import { getRandomWord } from "../getRandomWord";
import { GamePhase, GameState, GuessResult } from "./gameState";
import { RedisClientType } from "redis";

export class GameManager {

    private games = new Map<string, GameState>();
    private redis : RedisClientType<{}, {}>;
    private timers = new Map<string, NodeJS.Timeout>();


    constructor(redis: RedisClientType<{}, {}>) {
        this.redis = redis;
    }

    async createOrGetGame(roomId: string): Promise<GameState> {
        if(this.games.has(roomId)){
            return this.games.get(roomId)!;
        }

        const gameState: GameState = {
            roomId,
            players: new Map(),
            currentDrawer: null,
            currentWord: null,
            wordOptions: null,
            gamePhase: GamePhase.WAITING,
            round: 0,
            maxRounds: 3,
            roundTimeLeft: 0,
            maxRoundTime: 80,
            correctGuessors: [],
            gameStarted: false,
        }

        this.games.set(roomId, gameState);
        return gameState;
    }

    async addPlayer(roomId: string, username: string) : Promise<GameState>{
        const game = await this.createOrGetGame(roomId);

        if(!game.players.has(username)){
            game.players.set(username, {
                username,
                score: 0,
                isConnected: true,
                hasGuessed: false,
            });
        }else {
            game.players.get(username)!.isConnected = true;   //player rejoining
        }

        return game;
    }

    async removePlayer(roomId: string, username: string) : Promise<GameState | null>{
        const game = this.games.get(roomId);
        if(!game){
            return null;
        }

        //remove player from the game
        const player = game.players.get(username);
        if(player){
            player.isConnected = false;
        }

        //if there are less than 2 connected players, we will end the game
        const connectedPlayers = Array.from(game.players.values()).filter(p => p.isConnected);
        if(connectedPlayers.length < 2){
            this.endGame(roomId);
            return null;
        }

        //if the player is the current drawer, we will assign a new drawer
        if(game.currentDrawer === username && game.gamePhase !== GamePhase.WAITING){
            this.nextRound(roomId);
        }

        return game;
    }

    async startGame(roomId: string): Promise<boolean>{
        const game = this.games.get(roomId);
        if(!game){
            return false;
        }

        // check if game can be started
        if(game.gameStarted){
            return false; // game already started
        }

        const connectedPlayers = Array.from(game.players.values()).filter(p => p.isConnected);
        if(connectedPlayers.length < 2){
            return false; // need at least 2 players
        }

        game.round = 1;
        game.gameStarted = true;
        game.gamePhase = GamePhase.WORD_SELECTION;

        //select a random drawer
        const players = Array.from(game.players.keys()).filter(p => game.players.get(p)?.isConnected);
        
        game.currentDrawer = players[0] || null;

        this.startWordSelection(roomId);
        return true;
    }

    async startWordSelection(roomId: string){
        const game = this.games.get(roomId);
        if(!game || !game.currentDrawer){
            return;
        }

        game.gamePhase = GamePhase.WORD_SELECTION;
        game.wordOptions = [getRandomWord()!, getRandomWord()!, getRandomWord()!];
        game.roundTimeLeft = 15;

        game.correctGuessors = []; //clearing the previous correct guessors
        game.currentWord = null; // Clear the current word from previous round
        game.players.forEach(player => {
            player.hasGuessed = false;
        });

        // clear previous word from Redis
        await this.redis.del(`room:${roomId}:word`);

        this.startTimer(roomId, 15, () => {
            if(game.wordOptions){
                this.selectWord(roomId, game.currentDrawer!, game.wordOptions[0]!);
            }
        });

    }

    async selectWord(roomId: string, username: string, word: string): Promise<boolean> {
        const game = this.games.get(roomId);
        if(!game || game.currentDrawer !== username || game.gamePhase !== GamePhase.WORD_SELECTION){
            return false;
        }

        if(!game.wordOptions?.includes(word)){
            return false;
        }

        game.currentWord = word;
        game.wordOptions = null;
        game.gamePhase = GamePhase.DRAWING;
        game.roundTimeLeft = game.maxRoundTime;
        
        await this.redis.set(`room:${roomId}:word`, word);
        this.clearTimer(roomId);
        this.startTimer(roomId, game.maxRoundTime, () => {
            this.nextRound(roomId);
        });

        return true;
    }

    async processGuess(roomId: string, username: string, guess: string) : Promise<GuessResult> {
        const game = this.games.get(roomId);
        if(!game || game.currentDrawer === username || game.gamePhase !== GamePhase.DRAWING || !game.currentWord){
            return {username, guess, isCorrect: false};
        }

        const player = game.players.get(username);
        if(!player || player.hasGuessed){
            return {username, guess, isCorrect: false};
        }

        const isCorrect = guess.toLowerCase().trim() === game.currentWord.toLowerCase().trim();

        if(isCorrect){
            player.hasGuessed = true;
            game.correctGuessors.push(username);

            //point system for the correct guessors
            const position = game.correctGuessors.length;
            const timeBonus = Math.max(0, Math.floor(game.roundTimeLeft/10));
            const points = Math.max(1, 10-position*2 + timeBonus);

            player.score += points;

            //point system for the drawer
            const drawer = game.players.get(game.currentDrawer!);
            if(drawer){
                drawer.score += Math.floor(points/2);
            }

            //check if all players have guessed or the time is up
            const guessers = Array.from(game.players.values()).filter(p => p.isConnected && p.username !== game.currentDrawer);
            const allGuessed = guessers.every(p => p.hasGuessed);

            if(allGuessed){
                setTimeout(() => {
                    this.nextRound(roomId);
                }, 3000);
            }

            return {username, guess, isCorrect: true, points};
        }

        return {username, guess, isCorrect: false};
    }

    private nextRound(roomId: string): void {
        const game = this.games.get(roomId);
        if(!game || game.gamePhase !== GamePhase.DRAWING){
            return;
        }

        this.clearTimer(roomId);
        if(game.round >= game.maxRounds){
            this.endGame(roomId);
            return;
        }

        //find the next drawer
        const connectedPlayers = Array.from(game.players.keys()).filter(username => game.players.get(username)?.isConnected);

        const currentDrawer = connectedPlayers.indexOf(game.currentDrawer!);
        const nextDrawer = (currentDrawer + 1) % connectedPlayers.length;

        // If we've gone through all players, increment round
        if(nextDrawer === 0){
            game.round++;
        }

        game.currentDrawer = connectedPlayers[nextDrawer] || null;
        
        game.gamePhase = GamePhase.ROUND_END;
        setTimeout(() => {
            // Clear the word after round end display
            game.currentWord = null;
            
            if(game.round <= game.maxRounds){
                this.startWordSelection(roomId);
            }else{
                this.endGame(roomId);
            }
        }, 5000);
    }

    private endGame(roomId: string): void {
        const game = this.games.get(roomId);
        if(!game){
            return;
        }

        game.gamePhase = GamePhase.GAME_END;
        this.clearTimer(roomId);

        // Show final results for 10 seconds, then restart the game
        setTimeout(() => {
            this.restartGame(roomId);
        }, 10000);
    }

    private restartGame(roomId: string): void {
        const game = this.games.get(roomId);
        if(!game) return;

        // Reset game state for new game
        game.round = 0;
        game.gameStarted = false;
        game.gamePhase = GamePhase.WAITING;
        game.currentDrawer = null;
        game.currentWord = null;
        game.wordOptions = null;
        game.correctGuessors = [];
        game.roundTimeLeft = 0;

        // Reset all player scores and states
        game.players.forEach(player => {
            player.score = 0;
            player.hasGuessed = false;
        });

        // Check if we still have enough players to restart
        const connectedPlayers = Array.from(game.players.values()).filter(p => p.isConnected);
        if (connectedPlayers.length >= 2) {
            // Restart the game
            this.startGame(roomId);
        }
    }

    private startTimer(roomId: string, seconds: number, onComplete: () => void): void {
        this.clearTimer(roomId);

        const timer = setInterval(() => {
            const game = this.games.get(roomId);
            if(!game){
                clearInterval(timer);
                return;
            }

            game.roundTimeLeft--;

            if(game.roundTimeLeft <= 0){
                clearInterval(timer);
                onComplete();
            }
        }, 1000);

        this.timers.set(roomId, timer);
    }

    private clearTimer(roomId: string): void {
        const timer = this.timers.get(roomId);
        if(timer){
            clearInterval(timer);
            this.timers.delete(roomId);
        }
    }

    getGame(roomId: string): GameState | undefined {
        return this.games.get(roomId);
    }

    isPlayerDrawer(roomId: string, username: string): boolean {
        const game = this.games.get(roomId);
        return game?.currentDrawer === username;
    }

    getWordForPlayer(roomId: string, username: string): string | null {
        const game = this.games.get(roomId);
        if(!game || !game.currentWord){
            return null;
        }

        //current drawer can see the word
        if(game.currentDrawer === username && game.gamePhase === GamePhase.DRAWING){
            return game.currentWord;
        }

        //round end or game end, everyone can see the word
        if(game.gamePhase === GamePhase.ROUND_END || game.gamePhase === GamePhase.GAME_END){
            return game.currentWord;
        }

        return null;
    }

    canPlayerDraw(roomId: string, username: string): boolean {
        const game = this.games.get(roomId);
        return game?.currentDrawer === username && game?.gamePhase === GamePhase.DRAWING;
    }

    getWordOptions(roomId: string, username: string): string[] | null {
        const game = this.games.get(roomId);
        if (!game || game.currentDrawer !== username || game.gamePhase !== GamePhase.WORD_SELECTION) {
            return null;
        }
        return game.wordOptions;
    }

    canStartGame(roomId: string): boolean {
        const game = this.games.get(roomId);
        if(!game || game.gameStarted){
            return false;
        }

        const connectedPlayers = Array.from(game.players.values()).filter(p => p.isConnected);
        return connectedPlayers.length >= 2;
    }

}