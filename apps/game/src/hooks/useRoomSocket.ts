import { useEffect, useState } from "react";

type WebSocketMessage = {
  type: string;
  message: string | string[];
  error?: string;
};

export function useRoomSocket(roomId: string, username: string | null) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [members, setMembers] = useState<string[]>([]);
  const [word, setWord] = useState<string>("");
  useEffect(() => {
    if (!roomId || !username) return;

    const ws = new WebSocket(`ws://localhost:8080`);

    const requestWord = () => {
      ws.send(JSON.stringify({ type: "getWord", room: roomId, username }));
    };

    ws.onopen = () => {
      setIsConnected(true);
      ws.send(JSON.stringify({ type: "join", room: roomId, username }));
      //  request word when joining (server will return existing word for the room)
      requestWord();
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

  return { socket, isConnected, members, word };
}
