import { GameState } from "@/types/types";
import { useEffect, useState, useCallback } from "react";

type WebSocketMessage = {
  type: string;
  message: string | string[];
  error?: string;
  gameState?: GameState;
  words?: string[];
  username?: string;
  points?: number;
};

export function useRoomSocket(roomId: string, username: string | null) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [members, setMembers] = useState<string[]>([]);
  const [word, setWord] = useState<string>("");
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isCurrentDrawer, setIsCurrentDrawer] = useState(false);
  const [wordOptions, setWordOptions] = useState<string[]>([]);

  useEffect(() => {
    if (!roomId || !username) return;

    // const ws = new WebSocket(`ws://ws-scriblo.ayushman.blog`);
    const ws = new WebSocket(`ws://localhost:8080`);

    ws.onopen = () => {
      setIsConnected(true);
      ws.send(JSON.stringify({ type: "join", room: roomId, username }));
    };

    const requestMembers = () => {
      ws.send(JSON.stringify({ type: "getMembers", room: roomId, username }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WebSocketMessage;

        if (data.type === "error") {
          console.error("WebSocket error:", data.error || data.message);
        } else if (data.type === "success" || data.type === "word") {
          if (Array.isArray(data.message)) {
            setMembers(data.message);
          }else if(data.type === "word"){
            setWord(data.message);
          } else {
            requestMembers();       //if new member joined fetch again
          }
        } else if (data.type === "gameState") {
          const newGameState = (data as WebSocketMessage).gameState as GameState;
          setGameState(newGameState);
          setIsCurrentDrawer(newGameState.currentDrawer === username);
        } else if (data.type === "wordOptions") {
          setWordOptions((data as WebSocketMessage).words!);
        } else if (data.type === "correctGuess") {
          // Handle correct guess notification
          const guessData = data as WebSocketMessage;
          console.log(`${guessData.username} guessed correctly! +${guessData.points} points`);
        }
      } catch (error) {
        console.error("Parsing error:", error);
      }
    };

    ws.onerror = () => {
      setIsConnected(false);
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    setSocket(ws);

    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        requestMembers();
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      ws.close();
    };
  }, [roomId, username]);

  const selectWord = useCallback((word: string) => {
    if(socket && isConnected && socket.readyState === WebSocket.OPEN){
      socket.send(JSON.stringify({ type: "selectWord", room: roomId, username, word }));
    }
  }, [socket, isConnected, roomId, username]);

  const getWordOptions = useCallback(() => {
    if(socket && isConnected && socket.readyState === WebSocket.OPEN){
      socket.send(JSON.stringify({ type: "getWordOptions", room: roomId, username }));
    }
  }, [socket, isConnected, roomId, username]);

  const startGame = useCallback(() => {
    if(socket && isConnected && socket.readyState === WebSocket.OPEN){
      socket.send(JSON.stringify({ type: "startGame", room: roomId, username }));
    }
  }, [socket, isConnected, roomId, username]);

  return { socket, isConnected, members, word, gameState, isCurrentDrawer, wordOptions, selectWord, getWordOptions, startGame };
}
