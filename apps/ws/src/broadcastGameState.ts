import { GameManager } from "./game-logic/gameManager";
import { User } from "./types/user";

export const broadcastGameState = (roomId: string, gameManager: GameManager, wsConnections: Map<string, User>) => {
    const game = gameManager.getGame(roomId);
    if (!game) return;

    const gameStateMessage = JSON.stringify({
        type: "gameState",
        gameState: {
          players: Object.fromEntries(
            Array.from(game.players.entries()).map(([username, player]) => [
              username,
              {
                username: player.username,
                score: player.score,
                isConnected: player.isConnected,
                hasGuessed: player.hasGuessed
              }
            ])
          ),
          currentDrawer: game.currentDrawer,
          currentWord: null, // Will be handled per-player
          gamePhase: game.gamePhase,
          round: game.round,
          maxRounds: game.maxRounds,
          roundTimeLeft: game.roundTimeLeft,
          correctGuessers: game.correctGuessors,
          gameStarted: game.gameStarted
        }
      });

    // send to all players in room
    game.players.forEach((player, username) => {
        if (player.isConnected) {
            const user = wsConnections.get(username);
            if (user) {
                user.ws.send(gameStateMessage);
                
                //based on the role send the message to the player
                const word = gameManager.getWordForPlayer(roomId, username);
                if (word) {
                    user.ws.send(JSON.stringify({ type: "word", message: word }));
                }
            }
        }
    });
};