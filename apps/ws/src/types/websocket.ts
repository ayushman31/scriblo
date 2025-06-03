import { WebSocket } from "ws";

export interface ExtendedWebSocket extends WebSocket {
  isAlive: boolean;
  username?: string;
}
