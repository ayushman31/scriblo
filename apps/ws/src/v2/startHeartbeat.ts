import { WebSocket } from "ws";
import { HEARTBEAT_INTERVAL } from "../constants";
interface User {
    ws: WebSocket;
    userId: string;
    lastSeen: number;
}

export function startHeartbeat(
    ws: WebSocket,
    userId: string,
    wsConnections: Map<string, User>
) {

    const interval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
        } else {
            clearInterval(interval);
        }
    }, HEARTBEAT_INTERVAL);

    const user = wsConnections.get(userId);
    if (user) {
        user.lastSeen = Date.now();
    }

    return interval;
}
