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
import { GameState } from "@/types/types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const fredoka = Fredoka({ subsets: ['latin'], weight: '400' });

const ConnectedCanvas = ({ 
  socket, 
  roomId, 
  username, 
  canDraw = false 
}: { 
  socket: WebSocket | null, 
  roomId: string, 
  username: string | null,
  canDraw?: boolean
}) => {
  const { setSocket, setRoomId, setUsername } = useCanvas();

  useEffect(() => {
    setSocket(socket);
    setRoomId(roomId);
    setUsername(username);
  }, [socket, roomId, username, setSocket, setRoomId, setUsername]);

  return <Canvas className="w-full h-full mb-10" canDraw={canDraw} />;
};

// Add new components for game UI
const WordSelection = ({ wordOptions, onSelectWord, timeLeft }: {
  wordOptions: string[];
  onSelectWord: (word: string) => void;
  timeLeft: number;
}) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Choose a word to draw! ({timeLeft}s)</h2>
      <div className="space-y-2">
        {wordOptions.map((word, index) => (
          <button
            key={index}
            onClick={() => onSelectWord(word)}
            className="block w-full p-3 border rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {word}
          </button>
        ))}
      </div>
    </div>
  </div>
);

const GameStatus = ({ gameState, username }: {
  gameState: GameState;
  username: string | null;
}) => {
  if (!gameState) return null;

  const getPhaseText = () => {
    switch (gameState.gamePhase) {
      case "waiting":
        return "Waiting for players...";
      case "wordSelection":
        return gameState.currentDrawer === username 
          ? "Choose your word!" 
          : `${gameState.currentDrawer} is choosing a word...`;
      case "drawing":
        return gameState.currentDrawer === username
          ? "Draw your word!"
          : `${gameState.currentDrawer} is drawing...`;
      case "roundEnd":
        return "Round finished!";
      case "gameEnd":
        return "Game finished!";
      default:
        return "";
    }
  };

  return (
    <div className="text-center mb-4">
      <div className="text-lg font-semibold">{getPhaseText()}</div>
      {gameState.gameStarted && (
        <div className="text-sm text-gray-600">
          Round {gameState.round}/{gameState.maxRounds} • Time: {gameState.roundTimeLeft}s
        </div>
      )}
    </div>
  );
};



export default function RoomPage() {
  const { roomId } = useParams() as { roomId: string };
  const username = useSearchParams().get("username");

  const { 
    socket, 
    isConnected, 
    members, 
    word, 
    gameState, 
    wordOptions, 
    isCurrentDrawer,
    selectWord,
    getWordOptions
  } = useRoomSocket(roomId, username);

  // request word options when becoming drawer
  useEffect(() => {
    if (isCurrentDrawer && gameState?.gamePhase === "wordSelection") {
      getWordOptions();
    }
  }, [isCurrentDrawer, gameState?.gamePhase, getWordOptions]);

  // determine if the current user can draw
  const canDraw = isCurrentDrawer && gameState?.gamePhase === "drawing";

  return (
    <div className={`${fredoka.className} m-10 h-100vh`}>
      <div className="flex w-full justify-between items-center mb-10">
        <h1 className="text-6xl font-bold">Scriblo</h1>
        <Button variant={"default"} className="cursor-pointer font-bold" onClick={() => {
          navigator.clipboard.writeText(roomId);
          toast.success("Room code copied to clipboard");
        }}>
          Copy Room Code
        </Button>
        <ModeToggle />
      </div>

      <GameStatus gameState ={gameState!} username={username} />

      {/* Show word only to drawer during drawing phase */}
      {word && isCurrentDrawer && gameState?.gamePhase === "drawing" && (
        <div className="flex w-full items-center justify-center mb-8">
          <h1 className="text-2xl font-bold border-2 border-gray-300 rounded-md p-2">{word}</h1>
        </div>
      )}

      {/* Show revealed word to everyone during round end */}
      {word && gameState?.gamePhase === "roundEnd" && (
        <div className="flex w-full items-center justify-center mb-8">
          <h1 className="text-2xl font-bold border-2 border-green-500 rounded-md p-2">
            The word was: {word}
          </h1>
        </div>
      )}

      <div className="w-full flex items-center justify-center">
        <div className="w-1/5">
          {socket && isConnected && <Members members={members} gameState={gameState} />}
        </div>

        <div className="w-3/5 rounded-md">
          <CanvasProvider>
            <ConnectedCanvas 
              socket={socket} 
              roomId={roomId} 
              username={username} 
              canDraw={canDraw}
            />
            <div><CanvasControls /></div>
          </CanvasProvider>
        </div>
        
        <div className="w-1/5">
          <Chat socket={socket} username={username} roomId={roomId} />
        </div>
      </div>

      {/* Word selection modal */}
      {wordOptions.length > 0 && isCurrentDrawer && gameState?.gamePhase === "wordSelection" && (
        <WordSelection
          wordOptions={wordOptions}
          onSelectWord={selectWord}
          timeLeft={gameState.roundTimeLeft}
        />
      )}
    </div>
  );
}
