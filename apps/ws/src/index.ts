import {  WebSocketServer } from "ws";
import { createClient, RedisClientType } from "redis";
import { cleanupStaleData } from "./cleanupStaleData";
import { startHeartbeat } from "./startHeartbeat";
import { ExtendedWebSocket } from "./types/websocket";
import { getRandomWord } from "./getRandomWord";
import { User } from "./types/user";
import { GameManager } from "./game-logic/gameManager";
import { broadcastGameState } from "./broadcastGameState";
import { GamePhase, GameState } from "./game-logic/gameState";

const wss = new WebSocketServer({ port: 8080 });
// const wss = new WebSocketServer({ host: '0.0.0.0', port: 8080 });

const redis: RedisClientType<{}, {}> = createClient();


const wsConnections = new Map<string, User>();

// connect to redis and clean up stale data
redis.connect()
    .then(() => cleanupStaleData(redis))
    .catch(console.error);

const gameManager = new GameManager(redis);

// broadcast game state updates every 3 seconds for active games
setInterval(async () => {
  try {
    const rooms = await redis.keys("room:*");
    const activeRooms = rooms.filter(room => !room.includes(":word"));
    
    for (const roomKey of activeRooms) {
      const roomId = roomKey.replace("room:", "");
      const game = gameManager.getGame(roomId);
      
      if (game && game.gameStarted) {
        broadcastGameState(roomId, gameManager, wsConnections);
      }
    }
  } catch (error) {
    console.error("Error in periodic broadcast:", error);
  }
}, 3000);


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
        let room = data.room;

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
                //console.log(username , "joined room", data.room);
                //console.log(wsConnections);
               
                if(!room) {
                    const rooms = await redis.keys("room:*");
                    if (rooms.length > 0) {
                        const randomRoomIndex = Math.floor(Math.random() * rooms.length);
                        room = rooms[randomRoomIndex]?.replace("room:", "");
                        
                    } else {
                        ws.send(JSON.stringify({ type: "error", message: "no rooms available" }));
                        return;
                    }
                }

                const roomKey = `room:${room}`;
                const existingUsernames = await redis.sMembers(roomKey);
                //TODO : we should already check if the username is already taken in this room if we are joining rooms randomly because it should not be like it searches a random room for you and then shows that username is already taken in this room.
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

                //add player to game
                await gameManager.addPlayer(room, username);
                //broadcast the game state to all players
                broadcastGameState(room, gameManager, wsConnections);
                //console.log(`User ${username} joined room ${room}`);
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
                //console.log(username , "sent message", messageText, "to room", room);

                const isInRoom = await redis.sIsMember(`room:${room}`, username);
                if (!isInRoom) {
                    ws.send(JSON.stringify({
                        type: "error",
                        message: "you must join the room before sending messages"
                    }));
                    return;
                }
                //console.log("is in room: ", isInRoom);

                const roomUsers = await redis.sMembers(`room:${room}`);
                const game = gameManager.getGame(room);

                // check if this is a guess during drawing phase (and user is NOT the drawer)
                if (game && game.gamePhase === GamePhase.DRAWING && game.currentDrawer !== username) {
                    console.log(`Processing guess: "${messageText}" from ${username}, word: "${game.currentWord}"`);
                    const result = await gameManager.processGuess(room, username, messageText);
                    console.log(`Guess result:`, result);

                    if(result.isCorrect){
                        // Send correct guess notification
                        const correctGuessMessage = JSON.stringify({
                            type: "correctGuess",
                            username: result.username,
                            guess: result.guess,
                            points: result.points
                        });

                        roomUsers.forEach((id: string) => {
                            const user = wsConnections.get(id);
                            if (user) {
                                user.ws.send(correctGuessMessage);
                            }
                        });

                        // Also send as special chat message so drawer can see it
                        const specialChatMessage = JSON.stringify({
                            type: "chat",
                            message: `✅ ${messageText}`,
                            room,
                            username,
                            isCorrectGuess: true
                        });

                        roomUsers.forEach((id: string) => {
                            const user = wsConnections.get(id);
                            if (user) {
                                user.ws.send(specialChatMessage);
                            }
                        });

                        // update game state after correct guess
                        broadcastGameState(room, gameManager, wsConnections);
                        return;
                    }
                }

                // Send as regular chat message
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
                
                // check if room is empty after user leaves
                const remaining = await redis.sMembers(`room:${room}`);
                if (remaining.length === 0) {
                    await redis.del(`room:${room}`);
                    // also delete the word associated with this room
                    await redis.del(`room:${room}:word`);
                }
                
                // console.log(`User ${username} left room ${room}`);
                return;
            }

            if (data.type === "getMembers") {
                if (!username) {
                    ws.send(JSON.stringify({ type: "error", message: "not authenticated" }));
                    return;
                }
                
                const room = data.room;
                const members = await redis.sMembers(`room:${room}`);
                ws.send(JSON.stringify({ type: "success", message: members }));
                return;
            }

            if (data.type === "draw") {
                if (!username || !wsConnections.has(username)) {
                    ws.send(JSON.stringify({ type: "error", message: "not authenticated" }));
                    return;
                }

                const room = data.room;
                const drawingAction = data.drawingAction;

                const isInRoom = await redis.sIsMember(`room:${room}`, username);
                if (!isInRoom) {
                    ws.send(JSON.stringify({
                        type: "error",
                        message: "you must join the room before drawing"
                    }));
                    return;
                }

                const roomUsers = await redis.sMembers(`room:${room}`);
                const drawingData = JSON.stringify({
                    type: "draw",
                    drawingAction,
                    room,
                    username
                });

                if(!gameManager.canPlayerDraw(room, username)){
                    ws.send(JSON.stringify({
                        type: "error",
                        message: "you are not the current drawer"
                    }));
                    return;
                }

                // Send drawing action to all users in the room except the sender
                roomUsers.forEach((id: string) => {
                    if (id !== username) {
                        const user = wsConnections.get(id);
                        if (user) {
                            user.ws.send(drawingData);
                        }
                    }
                });

                return;
            }

            if(data.type === "selectWord"){
                if(!username || !wsConnections.has(username) || !room){
                    ws.send(JSON.stringify({
                        type: "error",
                        message: "not authenticated or room not found"
                    }));
                    return;
                }

                const word = data.word;
                if(!word || typeof word !== "string"){
                    ws.send(JSON.stringify({
                        type: "error",
                        message: "invalid word"
                    }));
                    return;
                }

                const success = await gameManager.selectWord(room, username, word);
                if(success){
                    broadcastGameState(room, gameManager, wsConnections);
                } else {
                    ws.send(JSON.stringify({
                        type: "error",
                        message: "failed to select word"
                    }));
                    return;
                }

            }

            if(data.type === "getWordOptions"){
                if(!username || !wsConnections.has(username) || !room){
                    ws.send(JSON.stringify({
                        type: "error",
                        message: "not authenticated or room not found"
                    }));
                    return;
                }

                const game = gameManager.getGame(room);

                const wordOptions = gameManager.getWordOptions(room, username);
                if (wordOptions) {
                    ws.send(JSON.stringify({
                        type: "wordOptions",
                        words: wordOptions,
                        timeLeft: gameManager.getGame(room)?.roundTimeLeft || 0
                    }));
                } else {
                    ws.send(JSON.stringify({
                        type: "error",
                        message: "not in word selection phase"
                    }));
                }
                return;
            }

            // Disabled old getWord handler - now using game manager for word handling
            if (data.type === "getWord") {
                ws.send(JSON.stringify({ type: "error", message: "getWord deprecated - use game state" }));
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
             //console.log("username: ", username, "'s connection closed");
             
            const rooms = await redis.keys("room:*");
            for (const room of rooms) {
                // Skip word keys as they are not room member sets
                if (room.includes(":word")) continue;
                
                await redis.sRem(room, username);
                const remaining = await redis.sMembers(room);
                if (remaining.length === 0) {
                    await redis.del(room);
                    // Also delete the word associated with this room
                    const roomId = room.replace("room:", "");
                    await redis.del(`room:${roomId}:word`);
                }

                const roomId = room.replace("room:", "");
                await gameManager.removePlayer(roomId, username);
                broadcastGameState(roomId, gameManager, wsConnections);
            }
            wsConnections.delete(username);
        }
    });

    ws.on("error", (err) => {
        console.error("websocket error:", err);
    });
});
