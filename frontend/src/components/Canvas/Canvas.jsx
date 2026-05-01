import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fabric } from 'fabric';
import { boardsAPI } from '../../services/api';
import Button from '../UI/Button';

const Canvas = () => {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTool, setCurrentTool] = useState('pencil');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);

  // Load board
  useEffect(() => {
    loadBoard();
  }, [boardId]);

  const loadBoard = async () => {
    try {
      const response = await boardsAPI.getById(boardId);
      setBoard(response.data.board);
      setShareLink(`${window.location.origin}/shared/${response.data.board.share_token}`);
    } catch (error) {
      console.error('Failed to load board:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize canvas - SIMPLE VERSION
  useEffect(() => {
    if (!canvasRef.current || fabricCanvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 1400,
      height: 800,
      backgroundColor: '#FFFFFF',
      isDrawingMode: true
    });

    // Add grid pattern
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

    // Setup brush
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

  // Add shape
  const addShape = (type) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    let shape;
    if (type === 'rectangle') {
      shape = new fabric.Rect({
        left: 100,
        top: 100,
        width: 100,
        height: 100,
        fill: 'transparent',
        stroke: currentColor,
        strokeWidth: strokeWidth
      });
    } else if (type === 'circle') {
      shape = new fabric.Circle({
        left: 100,
        top: 100,
        radius: 50,
        fill: 'transparent',
        stroke: currentColor,
        strokeWidth: strokeWidth
      });
    }

    if (shape) {
      canvas.add(shape);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  if (!board) {
    return <div className="min-h-screen flex items-center justify-center">
      <Button onClick={() => navigate('/dashboard')}>Powrót</Button>
    </div>;
  }

  return (
    <div className="h-screen flex flex-col bg-neutral-100">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => navigate('/dashboard')}>← Powrót</Button>
          <h1 className="text-lg font-semibold">{board.title}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleCopyLink}>
            {copied ? '✓ Skopiowano' : '🔗 Udostępnij'}
          </Button>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Simple Toolbar */}
        <div className="w-16 bg-white border-r flex flex-col items-center py-4 gap-2">
          <button
            onClick={() => setCurrentTool('select')}
            className={`w-12 h-12 rounded flex items-center justify-center ${currentTool === 'select' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            title="Zaznacz"
          >
            ↖️
          </button>
          <button
            onClick={() => setCurrentTool('pencil')}
            className={`w-12 h-12 rounded flex items-center justify-center ${currentTool === 'pencil' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            title="Ołówek"
          >
            ✏️
          </button>
          <button
            onClick={() => setCurrentTool('eraser')}
            className={`w-12 h-12 rounded flex items-center justify-center ${currentTool === 'eraser' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            title="Gumka"
          >
            🧹
          </button>
          <div className="w-10 h-px bg-gray-300 my-2"></div>
          <button
            onClick={() => addShape('rectangle')}
            className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center"
            title="Prostokąt"
          >
            ⬜
          </button>
          <button
            onClick={() => addShape('circle')}
            className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center"
            title="Koło"
          >
            ⭕
          </button>
        </div>

        {/* Canvas */}
        <div className="flex-1 p-4 overflow-auto">
          <canvas ref={canvasRef} className="border border-gray-300 shadow-lg" />
        </div>

        {/* Simple Sidebar */}
        <div className="w-64 bg-white border-l p-4">
          <h3 className="font-semibold mb-4">Ustawienia</h3>

          <div className="mb-4">
            <label className="block text-sm mb-2">Kolor</label>
            <input
              type="color"
              value={currentColor}
              onChange={(e) => setCurrentColor(e.target.value)}
              className="w-full h-10 rounded cursor-pointer"
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

          <div className="mt-6 p-3 bg-blue-50 rounded text-sm">
            <p className="font-semibold mb-2">💡 Jak używać:</p>
            <ul className="text-xs space-y-1">
              <li>1. Wybierz narzędzie</li>
              <li>2. Wybierz kolor</li>
              <li>3. Rysuj na białym obszarze!</li>
              <li>4. Siatka pomaga w rysowaniu</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white border-t px-4 py-2 text-sm text-gray-600">
        Prosty tryb rysowania - siatka 20px
      </div>
    </div>
  );
};

export default Canvas;
