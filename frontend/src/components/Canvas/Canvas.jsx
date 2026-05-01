import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fabric } from 'fabric';
import { boardsAPI } from '../../services/api';
import Button from '../UI/Button';

const Canvas = () => {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const canvasContainerRef = useRef(null);
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
    loadBoard();
  }, [boardId]);

  // Initialize Fabric.js canvas - AFTER board loads
  useEffect(() => {
    if (!board || !canvasContainerRef.current || fabricCanvasRef.current) return;

    console.log('Initializing Fabric.js canvas...');

    // Create canvas element
    const canvasEl = document.createElement('canvas');
    canvasEl.id = 'fabric-canvas';
    canvasContainerRef.current.appendChild(canvasEl);

    // Initialize Fabric
    const canvas = new fabric.Canvas('fabric-canvas', {
      width: 1400,
      height: 800,
      backgroundColor: '#FFFFFF',
      isDrawingMode: true
    });

    console.log('Fabric canvas created:', canvas);

    // Add grid
    const gridSize = 20;
    for (let i = 0; i <= 1400 / gridSize; i++) {
      canvas.add(new fabric.Line([i * gridSize, 0, i * gridSize, 800], {
        stroke: '#e0e0e0',
        strokeWidth: 1,
        selectable: false,
        evented: false,
        objectCaching: false
      }));
    }
    for (let i = 0; i <= 800 / gridSize; i++) {
      canvas.add(new fabric.Line([0, i * gridSize, 1400, i * gridSize], {
        stroke: '#e0e0e0',
        strokeWidth: 1,
        selectable: false,
        evented: false,
        objectCaching: false
      }));
    }

    // Setup brush
    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    canvas.freeDrawingBrush.color = currentColor;
    canvas.freeDrawingBrush.width = strokeWidth;

    fabricCanvasRef.current = canvas;

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, [board]);

  // Update tool
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    if (currentTool === 'select') {
      canvas.isDrawingMode = false;
      canvas.selection = true;
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
    const options = {
      left: 200,
      top: 200,
      fill: 'transparent',
      stroke: currentColor,
      strokeWidth: strokeWidth
    };

    if (type === 'rectangle') {
      shape = new fabric.Rect({ ...options, width: 100, height: 100 });
    } else if (type === 'circle') {
      shape = new fabric.Circle({ ...options, radius: 50 });
    } else if (type === 'triangle') {
      shape = new fabric.Triangle({ ...options, width: 100, height: 100 });
    } else if (type === 'line') {
      shape = new fabric.Line([100, 100, 200, 100], {
        stroke: currentColor,
        strokeWidth: strokeWidth
      });
    }

    if (shape) {
      canvas.add(shape);
      canvas.setActiveObject(shape);
      canvas.renderAll();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Button onClick={() => navigate('/dashboard')}>Powrót</Button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-neutral-100">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => navigate('/dashboard')}>
            ← Powrót
          </Button>
          <h1 className="text-lg font-semibold">{board.title}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleCopyLink}>
            {copied ? '✓ Skopiowano' : '🔗 Udostępnij'}
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Toolbar */}
        <div className="w-16 bg-white border-r flex flex-col items-center py-4 gap-2">
          <button
            onClick={() => setCurrentTool('select')}
            className={`w-12 h-12 rounded flex items-center justify-center text-xl ${
              currentTool === 'select' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
            }`}
            title="Zaznacz (S)"
          >
            ↖️
          </button>
          <button
            onClick={() => setCurrentTool('pencil')}
            className={`w-12 h-12 rounded flex items-center justify-center text-xl ${
              currentTool === 'pencil' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
            }`}
            title="Ołówek (P)"
          >
            ✏️
          </button>
          <button
            onClick={() => setCurrentTool('eraser')}
            className={`w-12 h-12 rounded flex items-center justify-center text-xl ${
              currentTool === 'eraser' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
            }`}
            title="Gumka (E)"
          >
            🧹
          </button>

          <div className="w-10 h-px bg-gray-300 my-2"></div>

          <button
            onClick={() => addShape('line')}
            className="w-12 h-12 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-xl"
            title="Linia"
          >
            📏
          </button>
          <button
            onClick={() => addShape('rectangle')}
            className="w-12 h-12 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-xl"
            title="Prostokąt"
          >
            ⬜
          </button>
          <button
            onClick={() => addShape('circle')}
            className="w-12 h-12 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-xl"
            title="Koło"
          >
            ⭕
          </button>
          <button
            onClick={() => addShape('triangle')}
            className="w-12 h-12 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-xl"
            title="Trójkąt"
          >
            🔺
          </button>
        </div>

        {/* Canvas Container */}
        <div className="flex-1 p-4 overflow-auto bg-neutral-100">
          <div
            ref={canvasContainerRef}
            className="inline-block border-2 border-gray-300 shadow-lg"
            style={{ backgroundColor: 'white' }}
          />
        </div>

        {/* Sidebar */}
        <div className="w-64 bg-white border-l p-4 overflow-y-auto">
          <h3 className="font-semibold mb-4">Ustawienia narzędzia</h3>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Kolor
            </label>
            <input
              type="color"
              value={currentColor}
              onChange={(e) => setCurrentColor(e.target.value)}
              className="w-full h-12 rounded border cursor-pointer"
            />
            <p className="text-xs text-gray-500 mt-1 text-center">{currentColor}</p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Grubość: {strokeWidth}px
            </label>
            <input
              type="range"
              min="1"
              max="50"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="mt-8 p-3 bg-blue-50 rounded text-sm">
            <p className="font-semibold mb-2">💡 Skróty:</p>
            <ul className="text-xs space-y-1">
              <li>S - Zaznacz</li>
              <li>P - Ołówek</li>
              <li>E - Gumka</li>
              <li>Siatka: 20px</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white border-t px-4 py-2 text-sm text-gray-600">
        Fabric.js Canvas - Siatka 20px - Wersja z zaawansowanymi funkcjami
      </div>
    </div>
  );
};

export default Canvas;
