// api utility functions for room operations using websocket
//used only when user is trying to join a room with a wrong room id


export interface RoomValidationResponse {
  exists: boolean;
  message?: string;
  roomId?: string;
  playerCount?: number;
}

// validate room if it exists

export async function validateRoom(roomId: string): Promise<RoomValidationResponse> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket('ws://localhost:8080');
    
    const timeout = setTimeout(() => {
      ws.close();
      resolve({
        exists: false,
        message: "Connection timeout while validating room"
      });
    }, 5000);

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: "validate_room",
        room: roomId
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "room_validation_result") {
          clearTimeout(timeout);
          ws.close();
          resolve({
            exists: data.exists,
            message: data.message,
            roomId: data.roomId,
            playerCount: data.playerCount
          });
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
        clearTimeout(timeout);
        ws.close();
        resolve({
          exists: false,
          message: "Error parsing validation response"
        });
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      clearTimeout(timeout);
      resolve({
        exists: false,
        message: "WebSocket connection error"
      });
    };

    ws.onclose = () => {
      clearTimeout(timeout);
    };
  });
}

export async function getRoomInfo(roomId: string): Promise<RoomValidationResponse> {
  try {
    return await validateRoom(roomId);
  } catch (error) {
    console.error("Error fetching room info:", error);
    return {
      exists: false,
      message: "Error fetching room information"
    };
  }
}
