import { WebSocket, WebSocketServer } from "ws";
import { createClient } from "redis";
import { checkUser } from "./checkUser";

const wss = new WebSocketServer({ port: 8080 });
const redis = createClient();

// clean up stale data on startup
async function cleanupStaleData() {
    try {
        const roomKeys = await redis.keys("room:*");
        
        // delete all the rooms if they exist already
        if (roomKeys.length > 0) {
            await redis.del(roomKeys);
        }
        
        console.log("cleaned up stale room data on startup");
    } catch (error) {
        console.error("error cleaning up stale data:", error);
    }
}

// connect to redis and cleaning the stale data
redis.connect()
    .then(cleanupStaleData)
    .catch(console.error);

interface User {
    ws: WebSocket;
    userId: string;
    lastSeen: number;
}

const wsConnections = new Map<string, User>();

// heartbeat interval and connection timeout
const HEARTBEAT_INTERVAL = 30000;
const CONNECTION_TIMEOUT = 60000; 

function startHeartbeat(ws: WebSocket, userId: string) {
    const interval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
        } else {
            clearInterval(interval);
        }
    }, HEARTBEAT_INTERVAL);

    // store the interval id in the user object for cleanup
    const user = wsConnections.get(userId);
    if (user) {
        user.lastSeen = Date.now();
    }

    return interval;
}

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

                // clean up any existing connection for this user
                const existingUser = wsConnections.get(userId);
                if (existingUser) {
                    existingUser.ws.close();
                }

                wsConnections.set(userId, { 
                    ws, 
                    userId,
                    lastSeen: Date.now()
                });

                heartbeatInterval = startHeartbeat(ws, userId);

                console.log("authenticated: ", userId);
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
                    ws.send(JSON.stringify({
                        type: "error",
                        message: "not authenticated"
                    }));
                    return;
                }
                console.log(userId , "joined room", data.room);
                console.log(wsConnections);

                const room = data.room;
                // add user to room in redis
                console.log(`User ${userId} joined room ${room}`);
                await redis.sAdd(`room:${room}`, userId);
                ws.send(JSON.stringify({ type: "success", message: "joined room" }));
            }

            if (data.type === "chat") {
                if (!userId) {
                    ws.send(JSON.stringify({
                        type: "error",
                        message: "not authenticated"
                    }));
                    return;
                }

                const room = data.room;
                const message = data.message;
                console.log(userId , "sent message to", room , "with message", message);
                
                
                // check if user is in the room
                const isInRoom = await redis.sIsMember(`room:${room}`, userId);
                if (!isInRoom) {
                    ws.send(JSON.stringify({
                        type: "error",
                        message: "you must join the room before sending messages"
                    }));
                    return;
                }
                console.log(isInRoom);
                

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
                        message: "not authenticated"
                    }));
                    return;
                }

                const room = data.room;
                await redis.sRem(`room:${room}`, userId);
                console.log(`User ${userId} left room ${room}`);
            }
        } catch (err) {
            console.error("error processing message:", err);
            ws.send(JSON.stringify({ type: "error", message: "internal server error" }));
        }
    });

    ws.on("close", async () => {
        if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
        }

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
        console.error("websocket error:", error);
        if (heartbeatInterval) {
            clearInterval(heartbeatInterval);   
        }
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
