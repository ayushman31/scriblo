"use client"

import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"

interface Message {
  id: string;
  text: string;
  sender: string;
}

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      text: newMessage,
      sender: "You",
    };

    setMessages(prev => [...prev, message]);
    setNewMessage("");
  };

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-slot="scroll-area-viewport"]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  return (
    <div className="flex flex-col items-end justify-center mx-5">
      <ScrollArea className="h-[450px] w-full rounded-md border" ref={scrollRef}>
        <div className="p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{message.sender}</span>
              </div>
              <p className="text-sm">{message.text}</p>
              <Separator className="my-2" />
            </div>
          ))}
        </div>
      </ScrollArea>
      <form onSubmit={handleSendMessage} className="w-full p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
        </div>
      </form>
    </div>
  );
}
