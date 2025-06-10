import { getRandomWord } from "../getRandomWord";
import { GamePhase, GameState, GuessResult } from "./gameState";
import { RedisClientType } from "redis";

export class GameManager {

    private games = new Map<string, GameState>();
    private redis : RedisClientType;
    private timers = new Map<string, NodeJS.Timeout>();


    constructor(redis: RedisClientType) {
        this.redis = redis;
    }

    async createGame(roomId: string): Promise<GameState> {
        if(this.games.has(roomId)){
            return this.games.get(roomId)!;
        }

        const gameState: GameState = {
            roomId,
            players: new Map(),
            currentWord: null,
            currentDrawer: null,
            wordOptions: null,
            gamePhase: GamePhase.WAITING,
            round: 0,
            maxRounds: 3,
            roundTimeLeft: 0,
            maxRoundTime: 60,
            correctGuessors: [],
            gameStarted: false,
        }

        this.games.set(roomId, gameState);
        return gameState;
    }

    async addPlayer(roomId:string, username: string) : Promise<GameState>{
        const game = await this.createGame(roomId);

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

        //we will start the game if there are 2 or more players
        if(game.players.size >= 2 && !game.gameStarted){
            this.startGame(roomId);
        }

        return game;
    }

    async removePlayer(roomId:string, username: string) : Promise<GameState | null>{
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

    async startGame(roomId: string){
        const game = this.games.get(roomId);
        if(!game){
            return;
        }

        game.round = 1;
        game.gameStarted = true;
        game.gamePhase = GamePhase.WORD_SELECTION;

        //we will select a random drawer
        const players = Array.from(game.players.keys()).filter(p => game.players.get(p)?.isConnected);
        
        game.currentDrawer = players[Math.floor(Math.random() * players.length)] || null;

        this.startWordSelection(roomId);
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
        game.players.forEach(player => {
            player.hasGuessed = false;
        });

        this.startRoundTimer(roomId, 15, () => {
            if(game.wordOptions){
                this.selectWord(roomId, game.currentDrawer!, game.wordOptions[Math.floor(Math.random() * game.wordOptions.length)]!);
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
        
        await this.redis.set(`game:${roomId}:word`, word);
        this.clearRoundTimer(roomId);
        this.startRoundTimer(roomId, game.maxRoundTime, () => {
            this.nextRound(roomId);
        });

        return true;
    }

    async processGuess(roomId: string, username: string, guess: string) : Promise<GuessResult> {
        const game = this.games.get(roomId);
        if(!game || game.currentDrawer !== username || game.gamePhase !== GamePhase.DRAWING || !game.currentWord){
            return {username, guess, isCorrect: false};
        }

        const player = game.players.get(username);
        if(!player || !player.hasGuessed){
            return {username, guess, isCorrect: false};
        }

        const isCorrect = guess.toLowerCase() === game.currentWord.toLowerCase().trim();

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

        this.clearRoundTimer(roomId);
        if(game.round >= game.maxRounds){
            this.endGame(roomId);
            return;
        }

        //find the next drawer
        const connectedPlayers = Array.from(game.players.keys()).filter(username => game.players.get(username)?.isConnected);

        const currentDrawer = connectedPlayers.indexOf(game.currentDrawer!);

        const nextDrawer = (currentDrawer + 1) % connectedPlayers.length;

        if(nextDrawer === 0){
            game.round++;
        }

        game.currentDrawer = connectedPlayers[nextDrawer]!;
        game.currentWord = null;

        game.gamePhase = GamePhase.ROUND_END;
        setTimeout(() => {
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
        this.clearRoundTimer(roomId);

        //clear the game round
        setTimeout(() => {
            this.games.delete(roomId);
        }, 30000);
    }

    private startRoundTimer(roomId: string, seconds: number, onComplete: () => void): void {
        this.clearRoundTimer(roomId);

        const timer = setInterval(() => {
            const game = this.games.get(roomId);
            if(!game || game.gamePhase !== GamePhase.DRAWING){
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

    private clearRoundTimer(roomId: string): void {
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
        return game?.currentDrawer === username && game?.gamePhase === GamePhase.DRAWING;
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

}