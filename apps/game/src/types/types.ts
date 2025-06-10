export type GamePhase = "waiting" | "wordSelection" | "drawing" | "roundEnd" | "gameEnd";

export interface Player {
    username: string;
    score: number;
    isConnected: boolean;
    hasGuessed: boolean;
}

export interface GameState {
    players: { [username: string]: Player };
    currentDrawer: string | null;
    gamePhase: GamePhase;
    round: number;
    maxRounds: number;
    roundTimeLeft: number;
    correctGuessers: string[];
    gameStarted: boolean;
  }
  