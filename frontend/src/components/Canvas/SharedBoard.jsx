import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fabric } from 'fabric';
import { boardsAPI } from '../../services/api';

const SharedBoard = () => {
  const { token } = useParams();
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTool, setCurrentTool] = useState('pencil');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);

  useEffect(() => {
    loadBoard();
  }, [token]);

  const loadBoard = async () => {
    try {
      const response = await boardsAPI.getByToken(token);
      setBoard(response.data.board);
    } catch (error) {
      console.error('Failed to load board:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || fabricCanvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 1400,
      height: 800,
      backgroundColor: '#FFFFFF',
      isDrawingMode: true
    });

    // Add grid
    const gridSize = 20;
    for (let i = 0; i < (1400 / gridSize); i++) {
      canvas.add(new fabric.Line([i * gridSize, 0, i * gridSize, 800], {
        stroke: '#e0e0e0',
        selectable: false,
        evented: false
      }));
    }
    for (let i = 0; i < (800 / gridSize); i++) {
      canvas.add(new fabric.Line([0, i * gridSize, 1400, i * gridSize], {
        stroke: '#e0e0e0',
        selectable: false,
        evented: false
      }));
    }

    canvas.freeDrawingBrush.color = currentColor;
    canvas.freeDrawingBrush.width = strokeWidth;

    fabricCanvasRef.current = canvas;

    return () => {
      canvas.dispose();
    };
  }, []);

  // Update tool
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    if (currentTool === 'select') {
      canvas.isDrawingMode = false;
    } else if (currentTool === 'eraser') {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush.color = '#FFFFFF';
      canvas.freeDrawingBrush.width = strokeWidth * 2;
    } else {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush.color = currentColor;
      canvas.freeDrawingBrush.width = strokeWidth;
    }
  }, [currentTool, currentColor, strokeWidth]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  if (!board) {
    return <div className="min-h-screen flex items-center justify-center">
      <p className="text-red-600">Tablica nie znaleziona</p>
    </div>;
  }

  return (
    <div className="h-screen flex flex-col bg-neutral-100">
      <header className="bg-white border-b px-4 py-3">
        <h1 className="text-lg font-semibold">{board.title}</h1>
        <p className="text-xs text-gray-500">Tryb ucznia - możesz rysować!</p>
      </header>

      <div className="flex-1 flex">
        <div className="w-16 bg-white border-r flex flex-col items-center py-4 gap-2">
          <button
            onClick={() => setCurrentTool('select')}
            className={`w-12 h-12 rounded ${currentTool === 'select' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            ↖️
          </button>
          <button
            onClick={() => setCurrentTool('pencil')}
            className={`w-12 h-12 rounded ${currentTool === 'pencil' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            ✏️
          </button>
          <button
            onClick={() => setCurrentTool('eraser')}
            className={`w-12 h-12 rounded ${currentTool === 'eraser' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            🧹
          </button>
        </div>

        <div className="flex-1 p-4 overflow-auto">
          <canvas ref={canvasRef} className="border border-gray-300 shadow-lg" />
        </div>

        <div className="w-64 bg-white border-l p-4">
          <h3 className="font-semibold mb-4">Ustawienia</h3>
          <div className="mb-4">
            <label className="block text-sm mb-2">Kolor</label>
            <input
              type="color"
              value={currentColor}
              onChange={(e) => setCurrentColor(e.target.value)}
              className="w-full h-10 rounded"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm mb-2">Grubość: {strokeWidth}px</label>
            <input
              type="range"
              min="1"
              max="20"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedBoard;
