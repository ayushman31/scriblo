"use client"

import React, { useState } from 'react';
import { useCanvas } from './CanvasContext';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CheckIcon, ChevronsUpDownIcon, PaletteIcon, BrushIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const basicColors = [
  { value: '#000000', label: 'Black' },
  { value: '#ffffff', label: 'White' },
  { value: '#ff0000', label: 'Red' },
  { value: '#00ff00', label: 'Green' },
  { value: '#0000ff', label: 'Blue' },
  { value: '#ffff00', label: 'Yellow' },
  { value: '#ff00ff', label: 'Magenta' },
  { value: '#00ffff', label: 'Cyan' },
  { value: '#ffa500', label: 'Orange' },
  { value: '#800080', label: 'Purple' },
];

const brushSizes = Array.from({ length: 25 }, (_, i) => (i + 1) * 2); // 2px to 50px in steps of 2

interface CanvasControlsProps {
  canDraw?: boolean;
  onClearCanvas?: () => void;
}

export const CanvasControls: React.FC<CanvasControlsProps> = ({ canDraw = true, onClearCanvas }) => {
  const [colorOpen, setColorOpen] = useState(false);
  const [brushOpen, setBrushOpen] = useState(false);
  const {
    color,
    setColor,
    brushSize,
    setBrushSize
  } = useCanvas();

  const handleClear = () => {
    if (onClearCanvas) {
      onClearCanvas();
    }
  };

  const selectedColor = basicColors.find(c => c.value === color);
  const currentColorLabel = selectedColor ? selectedColor.label : 'Custom';

  return (
    <div className={`flex items-center justify-between p-2 bg-card rounded-lg border ${!canDraw ? 'opacity-50' : ''}`}>
      {/* Color Picker Popover */}
      <Popover open={canDraw ? colorOpen : false} onOpenChange={canDraw ? setColorOpen : () => {}}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={colorOpen}
            className="w-[140px] justify-between"
            disabled={!canDraw}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded border"
                style={{ backgroundColor: color }}
              />
              <PaletteIcon className="h-4 w-4" />
              {currentColorLabel}
            </div>
            <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <div className="p-2">
            <div className="grid grid-cols-5 gap-2">
              {basicColors.map((colorOption) => (
                <button
                  key={colorOption.value}
                  onClick={() => {
                    setColor(colorOption.value);
                    setColorOpen(false);
                  }}
                  className={cn(
                    "w-8 h-8 rounded border-2 hover:scale-110 transition-transform",
                    color === colorOption.value ? "border-primary" : "border-border"
                  )}
                  style={{ backgroundColor: colorOption.value }}
                  title={colorOption.label}
                />
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Brush Size Popover */}
      <Popover open={canDraw ? brushOpen : false} onOpenChange={canDraw ? setBrushOpen : () => {}}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={brushOpen}
            className="w-[120px] justify-between"
            disabled={!canDraw}
          >
            <div className="flex items-center gap-2">
              <BrushIcon className="h-4 w-4" />
              {brushSize}px
            </div>
            <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[150px] p-0">
          <div className="max-h-[200px] overflow-y-auto">
            {brushSizes.map((size) => (
              <button
                key={size}
                onClick={() => {
                  setBrushSize(size);
                  setBrushOpen(false);
                }}
                className={cn(
                  "w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground flex items-center justify-between",
                  brushSize === size && "bg-accent text-accent-foreground"
                )}
              >
                <span>{size}px</span>
                {brushSize === size && (
                  <CheckIcon className="h-4 w-4" />
                )}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Clear Canvas Button */}
      <Button
        onClick={handleClear}
        variant="outline"
        size="sm"
        disabled={!canDraw}
      >
        Clear Canvas
      </Button>
    </div>
  );
};