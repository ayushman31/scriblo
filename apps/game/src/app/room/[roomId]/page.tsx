"use client";

import { ModeToggle } from "@/utils/toggle";
import { Chat } from "@/components/ui/Chat";
import { Members } from "@/components/ui/Members";
import { getRandomWord } from "@/utils/random";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default async function RoomPage() {

    const {roomId} = useParams() as {roomId: string};
    const username = useSearchParams().get("username");

    useEffect(() => {
        if (!username || !roomId) {
            console.log("username or roomId is not found");
            return;
        }

        const socket = new WebSocket(`ws://localhost:8080`);

        socket.onopen = () => {
            socket.send(JSON.stringify({
                type: "join",
                room: roomId,
                username: username
            }));
        }

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === "error") {
                console.log(data.message);
            }

            if (data.type === "success") {
                console.log("joined the room: ", data.message);
            }
        }

        socket.onerror = (event) => {
            console.log("error: ", event);
        }

        return () => {
            socket.close();
        }
        
    }, [roomId, username]);

    return (
        <div className="m-10 h-100vh">
            <div className="  flex w-full justify-between items-center mb-10">
                <h1 className="text-6xl font-bold">Scriblo</h1>
                <ModeToggle />
            </div>

            <div className=" flex w-full items-center justify-center mb-8">
                    <h1 className="text-2xl font-bold border-2 border-gray-300 rounded-md p-2">{getRandomWord()}</h1>
            </div>

            <div className="w-full flex items-center justify-center">
                <div className="w-1/5">
                    <Members />
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