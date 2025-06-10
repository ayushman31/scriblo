import { ExtendedWebSocket } from "./websocket";

export interface User {
    ws: ExtendedWebSocket;
    username: string;
    lastSeen: number;
}