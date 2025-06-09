"use client";

import { ModeToggle } from "@/utils/toggle";
import { Chat } from "@/components/ui/Chat";
import { Members } from "@/components/ui/Members";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useRoomSocket } from "@/hooks/useRoomSocket";
import { Canvas, CanvasProvider, CanvasControls } from '@/components/canvas';
import { useCanvas } from '@/components/canvas/CanvasContext';
import { Fredoka } from 'next/font/google';

const fredoka = Fredoka({ subsets: ['latin'], weight: '400' });

const ConnectedCanvas = ({ socket, roomId, username }: { socket: WebSocket | null, roomId: string, username: string | null }) => {
  const { setSocket, setRoomId, setUsername } = useCanvas();

  useEffect(() => {
    setSocket(socket);
    setRoomId(roomId);
    setUsername(username);
  }, [socket, roomId, username, setSocket, setRoomId, setUsername]);

  return <Canvas className="w-full h-full mb-10" />;
};

export default function RoomPage() {
  const { roomId } = useParams() as { roomId: string };
  const username = useSearchParams().get("username");
  // const [word, setWord] = useState("");

  const { socket, isConnected, members, word } = useRoomSocket(roomId, username);

  // useEffect(() => {
  //   if (username && roomId) {
  //     setWord(getRandomWord());
  //   }
  // }, [username, roomId]);

  return (
    <div className={`${fredoka.className} m-10 h-100vh`}>
      <div className="flex w-full justify-between items-center mb-10">
        <h1 className="text-6xl font-bold">Scriblo</h1>
        <ModeToggle />
      </div>

      {/* <div className="flex w-full items-center justify-center mb-8">
        <h1 className="text-2xl font-bold border-2 border-gray-300 rounded-md p-2">{word}</h1>
      </div> */}
      <div className="flex w-full items-center justify-center mb-8">
        <h1 className="text-2xl font-bold border-2 border-gray-300 rounded-md p-2">{word}</h1>
      </div>

      <div className="w-full flex items-center justify-center">
        <div className="w-1/5">
          {socket && isConnected && <Members members={members} />}
        </div>

        <div className="w-3/5 rounded-md">
          <CanvasProvider>
            <ConnectedCanvas socket={socket} roomId={roomId} username={username} />
            <div><CanvasControls /></div>
          </CanvasProvider>
        </div>
        
        <div className="w-1/5">
          <Chat socket={socket} username={username} roomId={roomId} />
        </div>
      </div>
    </div>
  );
}
