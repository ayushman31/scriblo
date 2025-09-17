'use client'

import React, { useEffect, useRef, useState } from 'react';
import { useCanvas } from '@/components/canvas/CanvasContext';

interface CanvasProps {
  className?: string;
  canDraw?: boolean;
}

export const Canvas: React.FC<CanvasProps> = ({ className = '', canDraw = true }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const { color, brushSize, clearCanvas, setClearCanvas, addDrawingAction, drawingActions, socket, addRemoteDrawingAction, clearDrawingActions } = useCanvas();
  const [lastProcessedIndex, setLastProcessedIndex] = useState(0);

  // Set canvas dimensions to match its display size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    updateCanvasSize();

    const resizeObserver = new ResizeObserver(updateCanvasSize);
    resizeObserver.observe(canvas);

    return () => resizeObserver.disconnect();
  }, []);

  // Update canvas properties when color, brush size, or clearCanvas changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;

    if (clearCanvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      clearDrawingActions();
      setLastProcessedIndex(0);
    }
  }, [color, brushSize, clearCanvas, clearDrawingActions]);

  // set canvas background to always be white
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.style.backgroundColor = '#ffffff';
  }, []);

  // Listen for remote drawing actions via websocket
  useEffect(() => {
    if (!socket) return;

    const handleWebSocketMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === "draw" && data.drawingAction) {
          addRemoteDrawingAction(data.drawingAction);
        } else if (data.type === "clearCanvas") {
          // clear the canvas when receiving clearCanvas message
          setClearCanvas(true);
          clearDrawingActions();
          setTimeout(() => setClearCanvas(false), 100);
        }
      } catch (error) {
        console.error("Error parsing websocket message:", error);
      }
    };

    socket.addEventListener("message", handleWebSocketMessage);

    return () => {
      socket.removeEventListener("message", handleWebSocketMessage);
    };
  }, [socket, addRemoteDrawingAction, setClearCanvas, clearDrawingActions]);

  // Process drawing actions (both local and remote)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Only process if there are new actions
    if (drawingActions.length > lastProcessedIndex) {
      // Process new drawing actions
      for (let i = lastProcessedIndex; i < drawingActions.length; i++) {
        const action = drawingActions[i];
        
        ctx.strokeStyle = action.color;
        ctx.lineWidth = action.brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (action.type === 'start') {
          ctx.beginPath();
          ctx.moveTo(action.x, action.y);
        } else if (action.type === 'draw') {
          ctx.lineTo(action.x, action.y);
          ctx.stroke();
        }
      }

      setLastProcessedIndex(drawingActions.length);
    }
  }, [drawingActions]); // Remove lastProcessedIndex from dependencies

  const getMousePosition = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canDraw) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getMousePosition(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);

    addDrawingAction({ type: 'start', x, y, color, brushSize });
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canDraw) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getMousePosition(e);

    ctx.lineTo(x, y);
    ctx.stroke();

    addDrawingAction({ type: 'draw', x, y, color, brushSize });
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${className}`}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseOut={stopDrawing}
      style={{
        border: '1px solid var(--border)',
        borderRadius: '4px',
        cursor: canDraw ? 'crosshair' : 'not-allowed'
        // backgroundColor moved to useEffect
      }}
    />
  );
};
