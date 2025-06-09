export interface Player {
    username: string;
    score: number;
    isConnected: boolean;
    hasGuessed: boolean;
}

export enum GamePhase {
    WAITING = 'waiting',
    WORD_SELECTION = 'wordSelection',
    DRAWING = 'drawing',
    ROUND_END = 'roundEnd',
    GAME_END = 'gameEnd',
}

export interface GameState {
    roomId: string;
    players: Map<string, Player>;
    currentWord: string | null;
    currentDrawer: string | null;
    wordOptions: string[] | null;
    gamePhase: GamePhase;
    round: number;
    maxRounds: number;
    roundTimeLeft: number;
    maxRoundTime: number;
    correctGuessors: string[];
    gameStarted: boolean;
}





