'use client'

import React, { useEffect, useRef, useState } from 'react';
import { useCanvas } from '@/components/canvas/CanvasContext';
import { useTheme } from 'next-themes';

interface CanvasProps {
  className?: string;
}

export const Canvas: React.FC<CanvasProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const { theme } = useTheme();
  const { color, brushSize, clearCanvas, addDrawingAction } = useCanvas();

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
    }
  }, [color, brushSize, clearCanvas]);

  // Set background color after mount (avoids hydration error)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.style.backgroundColor = theme === 'dark' ? 'var(--card)' : 'var(--background)';
  }, [theme]);

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
    if (!isDrawing) return;

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
        cursor: 'crosshair'
        // backgroundColor moved to useEffect
      }}
    />
  );
};
