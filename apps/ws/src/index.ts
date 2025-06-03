import {  WebSocketServer } from "ws";
import { createClient, RedisClientType } from "redis";
import { cleanupStaleData } from "./cleanupStaleData";
import { startHeartbeat } from "./startHeartbeat";
import { ExtendedWebSocket } from "./types/websocket";

const wss = new WebSocketServer({ port: 8080 });
const redis: RedisClientType<{}, {}> = createClient();

interface User {
    ws: ExtendedWebSocket;
    username: string;
    lastSeen: number;
}

const wsConnections = new Map<string, User>();

// connect to redis and clean up stale data
redis.connect()
    .then(() => cleanupStaleData(redis))
    .catch(console.error);

wss.on("connection", (ws : ExtendedWebSocket) => {
    let username: string | null = null;
    startHeartbeat(ws);
    
    ws.on("message", async (message) => {
        let data;
        try {
            data = JSON.parse(message.toString());
        } catch (err) {
            ws.send(JSON.stringify({ type: "error", message: "invalid JSON" }));
            return;
        }
        
        if (!data.type || typeof data.type !== 'string') {
            ws.send(JSON.stringify({ type: "error", message: "invalid message type" }));
            return;
        }

        if (data.username && typeof data.username !== 'string') {
            ws.send(JSON.stringify({ type: "error", message: "invalid username" }));
            return;
        }

        if (data.room && typeof data.room !== 'string') {
            ws.send(JSON.stringify({ type: "error", message: "invalid room" }));
            return;
        }

        if (data.message && typeof data.message !== 'string') {
            ws.send(JSON.stringify({ type: "error", message: "invalid message" }));
            return;
        }
        
        username = data.username;
        const room = data.room;

        try {
            
            if (data.type === "pong") {
                // update last seen timestamp
                if (username) {
                    const user = wsConnections.get(username);
                    if (user) {
                        user.lastSeen = Date.now();
                    }
                }
                return;
            }

            if (data.type === "join") {
                if (!username) {
                    ws.send(JSON.stringify({ type: "error", message: "not authenticated" }));
                    return;
                }
                console.log(username , "joined room", data.room);
                console.log(wsConnections);


                const roomKey = `room:${room}`;
                const existingUsernames = await redis.sMembers(roomKey);
                
                if (existingUsernames.includes(username)) {
                    ws.send(JSON.stringify({ type: "error", message: "Username already taken in this room" }));
                    ws.close();
                    return;
                }

                wsConnections.set(username, {
                    ws,
                    username,
                    lastSeen: Date.now()
                });
                
                try {
                    await redis.sAdd(`room:${room}`, username);
                } catch (err) {
                    console.error("Redis error:", err);
                    ws.send(JSON.stringify({ type: "error", message: "internal server error" }));
                    return;
                }
                console.log(`User ${username} joined room ${room}`);
                ws.send(JSON.stringify({ type: "success", message: "joined room" }));
                return;
            }

            if (data.type === "chat") {
                if (!username || !wsConnections.has(username)) {
                    ws.send(JSON.stringify({ type: "error", message: "not authenticated" }));
                    return;
                }

                const room = data.room;
                const messageText = data.message;
                console.log(username , "sent message", messageText, "to room", room);

                const isInRoom = await redis.sIsMember(`room:${room}`, username);
                if (!isInRoom) {
                    ws.send(JSON.stringify({
                        type: "error",
                        message: "you must join the room before sending messages"
                    }));
                    return;
                }
                console.log("is in room: ", isInRoom);

                const roomUsers = await redis.sMembers(`room:${room}`);
                const messageData = JSON.stringify({
                    type: "chat",
                    message: messageText,
                    room,
                    username
                });

                roomUsers.forEach((id: string) => {
                    const user = wsConnections.get(id);
                    if (user) {
                        user.ws.send(messageData);
                    }
                });

                return;
            }

            if (data.type === "leave") {
                if (!username) {
                    ws.send(JSON.stringify({ type: "error", message: "not authenticated" }));
                    return;
                }

                const room = data.room;
                await redis.sRem(`room:${room}`, username);
                console.log(`User ${username} left room ${room}`);
                return;
            }
        } catch (err) {
            console.error("error processing message:", err);
            ws.send(JSON.stringify({ type: "error", message: "internal server error" }));
        }
    });

    ws.on("close", async () => {

        if (username) {
             // remove user from all rooms
            const rooms = await redis.keys("room:*");
            for (const room of rooms) {
                await redis.sRem(room, username);
                const remaining = await redis.sMembers(room);
                if (remaining.length === 0) await redis.del(room);
            }
            wsConnections.delete(username);
        }
    });

    ws.on("error", (err) => {
        console.error("websocket error:", err);
    });
});
