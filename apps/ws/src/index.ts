import { WebSocket, WebSocketServer } from "ws";
import { createClient } from "redis";
import { checkUser } from "./checkUser";

const wss = new WebSocketServer({ port: 8080 });
const redis = createClient();

redis.connect().catch(console.error);

interface User {
    ws: WebSocket;
    userId: string;
}

const wsConnections = new Map<string, User>();

wss.on("connection", (ws) => {
    let userId: string | null = null;

    ws.on("message", async (message) => {
        let data;
        try {
            data = JSON.parse(message.toString());
        } catch (err) {
            ws.send(JSON.stringify({ type: "error", message: "Invalid JSON" }));
            return;
        }

        try {
            if (data.type === "auth") {
                const token = data.token;
                userId = checkUser(token);

                if (!userId || typeof userId !== "string") {
                    ws.close();
                    return;
                }

                wsConnections.set(userId, { ws, userId });
                console.log("Authenticated: ", userId);
                ws.send(JSON.stringify({ type: "success", message: "Authenticated" }));
                return;
            }

            if (data.type === "join") {
                if (!userId) {
                    ws.send(JSON.stringify({
                        type: "error",
                        message: "Not authenticated"
                    }));
                    return;
                }

                const room = data.room;
                // add user to room in redis
                await redis.sAdd(`room:${room}`, userId);
                console.log(`User ${userId} joined room ${room}`);
            }

            if (data.type === "chat") {
                if (!userId) {
                    ws.send(JSON.stringify({
                        type: "error",
                        message: "Not authenticated"
                    }));
                    return;
                }

                const room = data.room;
                const message = data.message;
                
                // check if user is in the room
                const isInRoom = await redis.sIsMember(`room:${room}`, userId);
                if (!isInRoom) {
                    ws.send(JSON.stringify({
                        type: "error",
                        message: "You must join the room before sending messages"
                    }));
                    return;
                }

                // get all users in the room
                const roomUsers = await redis.sMembers(`room:${room}`);
                
                // send message to all users in the room
                const messageData = JSON.stringify({
                    type: "chat",
                    message,
                    room
                });

                roomUsers.forEach(userId => {
                    const user = wsConnections.get(userId);
                    if (user) {
                        user.ws.send(messageData);
                    }
                });
            }

            if (data.type === "leave") {
                if (!userId) {
                    ws.send(JSON.stringify({
                        type: "error",
                        message: "Not authenticated"
                    }));
                    return;
                }

                const room = data.room;
                await redis.sRem(`room:${room}`, userId);
                console.log(`User ${userId} left room ${room}`);
            }
        } catch (err) {
            console.error("Error processing message:", err);
            ws.send(JSON.stringify({ type: "error", message: "Internal server error" }));
        }
    });

    ws.on("close", async () => {
        if (userId) {
            // remove user from all rooms
            const rooms = await redis.keys("room:*");
            for (const room of rooms) {
                await redis.sRem(room, userId);
            }
            wsConnections.delete(userId);
        }
    });

    ws.on("error", (error) => {
        console.error("WebSocket error:", error);
    });
});
