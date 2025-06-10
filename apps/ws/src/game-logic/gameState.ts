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

export interface GuessResult {
    username: string;
    guess: string;
    isCorrect: boolean;
    points?: number;
}

export interface WordSelectionData {
    words: string[];
    timeLeft: number;
  }
  
  export interface GameStateUpdate {
    type: "gameState";
    gameState: {
      players: { [username: string]: Player };
      currentDrawer: string | null;
      currentWord: string | null;
      gamePhase: GamePhase;
      round: number;
      maxRounds: number;
      roundTimeLeft: number;
      correctGuessers: string[];
      gameStarted: boolean;
    };
  }
  

  export interface GuessResult {
    username: string;
    guess: string;
    isCorrect: boolean;
    points?: number;
  }



