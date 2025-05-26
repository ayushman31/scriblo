import { WebSocket, WebSocketServer } from "ws";
import { createClient, RedisClientType } from "redis";
import { checkUser } from "./checkUser";
import { cleanupStaleData } from "./cleanupStaleData";
import { startHeartbeat } from "./startHeartbeat";
import { HEARTBEAT_INTERVAL, CONNECTION_TIMEOUT } from "./constants";
const wss = new WebSocketServer({ port: 8080 });
const redis: RedisClientType<{}, {}> = createClient();

interface User {
    ws: WebSocket;
    userId: string;
    lastSeen: number;
}

const wsConnections = new Map<string, User>();

// connect to redis and clean up stale data
redis.connect()
    .then(() => cleanupStaleData(redis))
    .catch(console.error);

wss.on("connection", (ws) => {
    let userId: string | null = null;
    let heartbeatInterval: NodeJS.Timeout | null = null;

    ws.on("message", async (message) => {
        let data;
        try {
            data = JSON.parse(message.toString());
        } catch (err) {
            ws.send(JSON.stringify({ type: "error", message: "invalid JSON" }));
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

                // clean up any existing connection
                const existingUser = wsConnections.get(userId);
                if (existingUser) {
                    existingUser.ws.close();
                }

                wsConnections.set(userId, {
                    ws,
                    userId,
                    lastSeen: Date.now()
                });

                heartbeatInterval = startHeartbeat(ws, userId, wsConnections);

                console.log("authenticated:", userId);
                ws.send(JSON.stringify({ type: "success", message: "authenticated" }));
                return;
            }

            if (data.type === "pong") {
                // update last seen timestamp
                if (userId) {
                    const user = wsConnections.get(userId);
                    if (user) {
                        user.lastSeen = Date.now();
                    }
                }
                return;
            }

            if (data.type === "join") {
                if (!userId) {
                    ws.send(JSON.stringify({ type: "error", message: "not authenticated" }));
                    return;
                }
                console.log(userId , "joined room", data.room);
                console.log(wsConnections);

                const room = data.room;
                
                await redis.sAdd(`room:${room}`, userId);
                console.log(`User ${userId} joined room ${room}`);
                ws.send(JSON.stringify({ type: "success", message: "joined room" }));
                return;
            }

            if (data.type === "chat") {
                if (!userId) {
                    ws.send(JSON.stringify({ type: "error", message: "not authenticated" }));
                    return;
                }

                const room = data.room;
                const messageText = data.message;
                console.log(userId , "sent message", messageText, "to room", room);

                const isInRoom = await redis.sIsMember(`room:${room}`, userId);
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
                    room
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
                if (!userId) {
                    ws.send(JSON.stringify({ type: "error", message: "not authenticated" }));
                    return;
                }

                const room = data.room;
                await redis.sRem(`room:${room}`, userId);
                console.log(`User ${userId} left room ${room}`);
                return;
            }
        } catch (err) {
            console.error("error processing message:", err);
            ws.send(JSON.stringify({ type: "error", message: "internal server error" }));
        }
    });

    ws.on("close", async () => {
        if (heartbeatInterval) clearInterval(heartbeatInterval);

        if (userId) {
             // remove user from all rooms
            const rooms = await redis.keys("room:*");
            for (const room of rooms) {
                await redis.sRem(room, userId);
            }
            wsConnections.delete(userId);
        }
    });

    ws.on("error", (err) => {
        console.error("websocket error:", err);
        if (heartbeatInterval) clearInterval(heartbeatInterval);
    });
});

// periodic cleanup of stale connections
setInterval(() => {
    const now = Date.now();
    for (const [userId, user] of wsConnections.entries()) {
        if (now - user.lastSeen > CONNECTION_TIMEOUT) {
            console.log(`cleaning up stale connection for user ${userId}`);
            user.ws.close();
            wsConnections.delete(userId);
        }
    }
}, HEARTBEAT_INTERVAL);
