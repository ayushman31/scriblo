import React, { createContext, useContext, useState } from 'react';

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
  clearDrawingActions: () => void;
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

export const CanvasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [clearCanvas, setClearCanvas] = useState(false);
  const [drawingActions, setDrawingActions] = useState<DrawingAction[]>([]);

  const addDrawingAction = (action: DrawingAction) => {
    setDrawingActions(prev => [...prev, action]);
  };

  const clearDrawingActions = () => {
    setDrawingActions([]);
  };

  return (
    <CanvasContext.Provider
      value={{
        color,
        setColor,
        brushSize,
        setBrushSize,
        clearCanvas,
        setClearCanvas,
        drawingActions,
        addDrawingAction,
        clearDrawingActions
      }}
    >
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