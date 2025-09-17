import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

interface DrawingAction {
  type: 'start' | 'draw';
  x: number;
  y: number;
  color: string;
  brushSize: number;
}

interface CanvasContextType {
  color: string;
  setColor: (color: string) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  clearCanvas: boolean;
  setClearCanvas: (clear: boolean) => void;
  drawingActions: DrawingAction[];
  addDrawingAction: (action: DrawingAction) => void;
  addRemoteDrawingAction: (action: DrawingAction) => void;
  clearDrawingActions: () => void;
  clearCanvasRemote: () => void;
  socket: WebSocket | null;
  setSocket: (socket: WebSocket | null) => void;
  roomId: string | null;
  setRoomId: (roomId: string | null) => void;
  username: string | null;
  setUsername: (username: string | null) => void;
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

export const CanvasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [clearCanvas, setClearCanvas] = useState(false);
  const [drawingActions, setDrawingActions] = useState<DrawingAction[]>([]);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  const addDrawingAction = useCallback((action: DrawingAction) => {
    setDrawingActions(prev => [...prev, action]);
    
    // Send drawing action via websocket if connected
    if (socket && socket.readyState === WebSocket.OPEN && roomId && username) {
      socket.send(JSON.stringify({
        type: "draw",
        room: roomId,
        username,
        drawingAction: action
      }));
    }
  }, [socket, roomId, username]);

  const addRemoteDrawingAction = useCallback((action: DrawingAction) => {
    setDrawingActions(prev => [...prev, action]);
  }, []);

  const clearDrawingActions = useCallback(() => {
    setDrawingActions([]);
  }, []);

  const clearCanvasRemote = useCallback(() => {
    console.log('clearCanvasRemote called', { 
      hasSocket: !!socket, 
      socketReady: socket?.readyState === WebSocket.OPEN, 
      roomId, 
      username 
    });
    if (socket && socket.readyState === WebSocket.OPEN && roomId && username) {
      console.log('sending clearCanvas WebSocket message');
      socket.send(JSON.stringify({
        type: "clearCanvas",
        room: roomId,
        username
      }));
    } else {
      console.log('cannot send clearCanvas');
    }
  }, [socket, roomId, username]);

  const contextValue = useMemo(() => ({
    color,
    setColor,
    brushSize,
    setBrushSize,
    clearCanvas,
    setClearCanvas,
    drawingActions,
    addDrawingAction,
    addRemoteDrawingAction,
    clearDrawingActions,
    clearCanvasRemote,
    socket,
    setSocket,
    roomId,
    setRoomId,
    username,
    setUsername
  }), [
    color,
    brushSize,
    clearCanvas,
    drawingActions,
    addDrawingAction,
    addRemoteDrawingAction,
    clearDrawingActions,
    clearCanvasRemote,
    socket,
    roomId,
    username
  ]);

  return (
    <CanvasContext.Provider value={contextValue}>
      {children}
    </CanvasContext.Provider>
  );
};

export const useCanvas = () => {
  const context = useContext(CanvasContext);
  if (context === undefined) {
    throw new Error('useCanvas must be used within a CanvasProvider');
  }
  return context;
};