import { WebSocket } from "ws";
import { HEARTBEAT_INTERVAL } from "./constants";
import { ExtendedWebSocket } from "./types/websocket";  

  
export function startHeartbeat(ws: ExtendedWebSocket) {
    ws.isAlive = true;

    ws.on("pong", () => {
        ws.isAlive = true;
    });

    const interval = setInterval(() => {
        if (!ws.isAlive) {
            ws.terminate();
            clearInterval(interval);
        } else {
            ws.isAlive = false;
            ws.ping();
        }
    }, HEARTBEAT_INTERVAL);

    ws.on("close", () => clearInterval(interval));
    ws.on("error", () => clearInterval(interval));
}