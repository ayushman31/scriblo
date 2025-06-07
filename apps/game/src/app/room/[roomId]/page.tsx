"use client";

import { ModeToggle } from "@/utils/toggle";
import { Chat } from "@/components/ui/Chat";
import { Members } from "@/components/ui/Members";
import { getRandomWord } from "@/utils/random";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useRoomSocket } from "@/hooks/useRoomSocket";
import { Canvas, CanvasProvider, CanvasControls } from '@/components/canvas';

export default function RoomPage() {
  const { roomId } = useParams() as { roomId: string };
  const username = useSearchParams().get("username");
  const [word, setWord] = useState("");

  const { socket, isConnected, members } = useRoomSocket(roomId, username);

  useEffect(() => {
    if (username && roomId) {
      setWord(getRandomWord());
    }
  }, [username, roomId]);

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
          {socket && isConnected && <Members members={members} />}
        </div>

        <div className="w-3/5 rounded-md">
          <CanvasProvider>
            <Canvas className="w-full h-full mb-10"/>
            <div className="tools bg-yellow-500"><CanvasControls /></div>
          </CanvasProvider>
        </div>
        
        <div className="w-1/5">
          <Chat socket={socket} username={username} roomId={roomId} />
        </div>
      </div>
    </div>
  );
}
