import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface MembersProps {
  members: string[];
}

export const Members = ({ members }: MembersProps) => {
  return (
    <div className="flex flex-col mx-5">
    <ScrollArea className="h-[400px]  rounded-md border">
      <div className="p-4">
        {members.map((member, index) => (
          <React.Fragment key={index}>
            <h1 className="text-sm font-bold">{member}</h1>            
            <Separator className="my-4" />
          </React.Fragment>
        ))}
        </div>
      </ScrollArea>
    </div>
  )
}
