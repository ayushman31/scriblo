import { WebSocket, WebSocketServer } from "ws";
import { checkUser } from "./checkUser";

const wss = new WebSocketServer({ port: 8080 });

interface User {
    ws: WebSocket;
    room: string;
    userId: string;
}

const users: User[] = [];

wss.on("connection", (ws) => {
    let userId : string | null = null;

    ws.on("message", (message) => {
        let data;
        try {
            data = JSON.parse(message.toString());
        } catch (err) {
            ws.send(JSON.stringify({ type: "error", message: "Invalid JSON" }));
            return;
        }

        try{
            if(data.type == "auth"){
                const token = data.token;
                userId = checkUser(token);

                if(!userId || typeof userId !== "string"){
                    ws.close();
                    return;
                }

                users.push({
                    ws,
                    room : "",
                    userId : userId
                });
                console.log("Authenticated: ", userId);
                ws.send(JSON.stringify({ type: "success", message: "Authenticated" }));
                console.log(users);
                return
            }

            if(data.type == "join"){
                if(!userId){
                    ws.send(JSON.stringify({
                        type : "error",
                        message : "Not authenticated"
                    }));
                    return;
                }

                const room = data.room;
                const user = users.find(u => u.userId == userId);
                if(user){
                    user.room = room;
                }
                console.log(users);
            }

            if(data.type == "chat"){
                if(!userId){
                    ws.send(JSON.stringify({
                        type : "error",
                        message : "Not authenticated"
                    }));
                    return;
                }

                const room = data.room;
                const message = data.message;
                if (typeof room !== "string" || typeof message !== "string") return;

                // Check if user is in the room they're trying to send a message to
                const user = users.find(u => u.userId === userId);
                if (!user || user.room !== room) {
                    ws.send(JSON.stringify({
                        type: "error",
                        message: "You must join the room before sending messages"
                    }));
                    return;
                }

                users.forEach(u => {
                    if(u.room == room){
                        u.ws.send(JSON.stringify({
                            type : "chat",
                            message : message,
                            room
                        }));
                    }
                });
                console.log(users);
                
            }

            if(data.type == "leave"){
                if(!userId){
                    ws.send(JSON.stringify({
                        type : "error",
                        message : "Not authenticated"
                    }));
                    return;
                }

                const user = users.find(u => u.userId == userId);
                if(user){   
                    user.room = "";
                }
                console.log(users);
            }
        } catch (err) {
            ws.send(JSON.stringify({ type: "error", message: "Internal server error" }));
            return;
        }
    });

    ws.on("close", () => {
        const index = users.findIndex(u => u.ws === ws);
        if (index !== -1) {
            users.splice(index, 1);
        }
    });

    ws.on("error", (error) => {
        console.error("WebSocket error:", error);
    });
});
