import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { GameState, Player } from "@/types/types";

interface MembersProps {
  members: string[];
  gameState?: GameState | null;
}

export const Members = ({ members, gameState }: MembersProps) => {
  // If we have game state, use the players data with scores
  const playersToShow = gameState?.players ? 
    Object.values(gameState.players).sort((a: Player, b: Player) => b.score - a.score) :
    members.map(member => ({ username: member, score: 0, isConnected: true, hasGuessed: false }));

  return (
    <div className="flex flex-col mx-5">
      <h3 className="font-bold mb-2 text-center">Players</h3>
      <ScrollArea className="h-[400px] 2xl:h-[500px] rounded-md border">
        <div className="p-4">
          {playersToShow.map((player: Player, index) => (
            <React.Fragment key={index}>
              <div className="flex justify-between items-center">
                <span className={`text-sm font-bold ${
                  gameState?.currentDrawer === player.username ? 'text-blue-600' : ''
                }`}>
                  {player.username}
                  {gameState?.currentDrawer === player.username && " ✏️"}
                  {player.hasGuessed && gameState?.gamePhase === "drawing" && " ✓"}
                </span>
                {gameState && <span className="text-sm">{player.score}</span>}
              </div>
              <Separator className="my-4" />
            </React.Fragment>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
