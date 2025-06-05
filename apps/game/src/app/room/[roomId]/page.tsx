"use client";

import { ModeToggle } from "@/utils/toggle";
import { Chat } from "@/components/ui/Chat";
import { Members } from "@/components/ui/Members";
import { getRandomWord } from "@/utils/random";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type WebSocketMessage = {
  type: string;
  message: string;
  error?: string;
};

export default function RoomPage() {
    const {roomId} = useParams() as {roomId: string};
    const username = useSearchParams().get("username");
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [word, setWord] = useState("");
    const [members, setMembers] = useState<string[]>([]);

    useEffect(() => {
        if (!username || !roomId) {
            console.log("username or roomId is not found");
            return;
        }
        setWord(getRandomWord());

        const ws = new WebSocket(`ws://localhost:8080`);

        ws.onopen = () => {
            console.log("WebSocket connected");
            setIsConnected(true);
            ws.send(JSON.stringify({
                type: "join",
                room: roomId,
                username: username
            }));
        }

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data) as WebSocketMessage;
                
                if (data.type === "error") {
                    console.error('Error:', data.error || data.message);
                }

                if (data.type === "success") {
                    if(Array.isArray(data.message)) {
                        setMembers(data.message);
                    }else{
                        console.log("Success:", data.message);
                        getMembers();
                    }
                }
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        }

        ws.onerror = (event) => {
            console.error("WebSocket error:", event);
            setIsConnected(false);
        }

        ws.onclose = () => {
            console.log("WebSocket disconnected");
            setIsConnected(false);
        }

        setSocket(ws);

        function getMembers() {
            ws.send(JSON.stringify({
                type: "getMembers",
                room: roomId,
                username: username
            }));
        }

        const interval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              getMembers();
            }
          }, 1000);

        return () => {
            clearInterval(interval);
            ws.close();
        }
    }, [roomId, username]);

    return (
        <div className="m-10 h-100vh">
            <div className="flex w-full justify-between items-center mb-10">
                <h1 className="text-6xl font-bold">Scriblo</h1>
                <ModeToggle />
            </div>

            <div className="flex w-full items-center justify-center mb-8">
                <h1 className="text-2xl font-bold border-2 border-gray-300 rounded-md p-2">{word}</h1>
            </div>

            <div className="w-full flex items-center justify-center">
                <div className="w-1/5">
                    {socket && isConnected && <Members  members={members} />}
                </div>

                <div className="w-3/5 border-1 border-gray-300 rounded-md">
                    <canvas id="canvas" className="w-full h-full mb-10"></canvas>
                    <div className="tools bg-yellow-500">
                        tools
                    </div>
                </div>

                <div className="w-1/5">
                    <Chat />
                </div>
            </div>
        </div>
    )
}
