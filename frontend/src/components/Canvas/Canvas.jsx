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
  const [currentTool, setCurrentTool] = useState('pen');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [opacity, setOpacity] = useState(1);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [drawingShape, setDrawingShape] = useState(null);
  const shapeStartPoint = useRef(null);

  // Keyboard shortcuts preset (1-9)
  const toolPresets = {
    '1': { tool: 'pen', color: '#000000', width: 2 },
    '2': { tool: 'pen', color: '#0000FF', width: 2 },
    '3': { tool: 'pen', color: '#FF0000', width: 2 },
    '4': { tool: 'pen', color: '#00FF00', width: 2 },
    '5': { tool: 'highlighter', color: '#FFFF00', width: 20 },
    '6': { tool: 'pencil', color: '#000000', width: 1 },
    '7': { tool: 'marker', color: '#FF00FF', width: 5 },
    '8': { tool: 'eraser', color: '#FFFFFF', width: 10 },
    '9': { tool: 'select', color: '#000000', width: 2 }
  };

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

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!board || !canvasContainerRef.current || fabricCanvasRef.current) return;

    const canvasEl = document.createElement('canvas');
    canvasEl.id = 'fabric-canvas';
    canvasContainerRef.current.appendChild(canvasEl);

    const canvas = new fabric.Canvas('fabric-canvas', {
      width: 1400,
      height: 800,
      backgroundColor: '#FFFFFF',
      isDrawingMode: true
    });

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

    // Clear any drawing shape mode
    setDrawingShape(null);
    canvas.off('mouse:down');
    canvas.off('mouse:move');
    canvas.off('mouse:up');

    if (currentTool === 'select') {
      canvas.isDrawingMode = false;
      canvas.selection = true;
    } else if (currentTool === 'eraser') {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = '#FFFFFF';
      canvas.freeDrawingBrush.width = strokeWidth * 2;
    } else if (currentTool === 'pencil') {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = currentColor;
      canvas.freeDrawingBrush.width = strokeWidth;
      canvas.freeDrawingBrush.strokeLineCap = 'round';
      canvas.freeDrawingBrush.opacity = opacity;
    } else if (currentTool === 'pen') {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = currentColor;
      canvas.freeDrawingBrush.width = strokeWidth;
      canvas.freeDrawingBrush.strokeLineCap = 'round';
      canvas.freeDrawingBrush.opacity = opacity;
    } else if (currentTool === 'marker') {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = currentColor;
      canvas.freeDrawingBrush.width = strokeWidth * 1.5;
      canvas.freeDrawingBrush.strokeLineCap = 'round';
      canvas.freeDrawingBrush.opacity = opacity;
    } else if (currentTool === 'highlighter') {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = currentColor;
      canvas.freeDrawingBrush.width = strokeWidth * 3;
      canvas.freeDrawingBrush.strokeLineCap = 'square';
      canvas.freeDrawingBrush.opacity = 0.3;
    } else {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = currentColor;
      canvas.freeDrawingBrush.width = strokeWidth;
      canvas.freeDrawingBrush.opacity = opacity;
    }
  }, [currentTool, currentColor, strokeWidth, opacity]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Number keys 1-9
      if (e.key >= '1' && e.key <= '9') {
        const preset = toolPresets[e.key];
        if (preset) {
          setCurrentTool(preset.tool);
          setCurrentColor(preset.color);
          setStrokeWidth(preset.width);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Start drawing shape (click-drag-release)
  const startDrawingShape = (shapeType) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.isDrawingMode = false;
    canvas.selection = false;
    setDrawingShape(shapeType);

    let shape = null;
    let isDown = false;
    let origX, origY;

    canvas.on('mouse:down', (o) => {
      isDown = true;
      const pointer = canvas.getPointer(o.e);
      origX = pointer.x;
      origY = pointer.y;

      const options = {
        left: origX,
        top: origY,
        fill: 'transparent',
        stroke: currentColor,
        strokeWidth: strokeWidth,
        opacity: opacity
      };

      if (shapeType === 'rectangle') {
        shape = new fabric.Rect({ ...options, width: 0, height: 0 });
      } else if (shapeType === 'circle') {
        shape = new fabric.Circle({ ...options, radius: 0 });
      } else if (shapeType === 'triangle') {
        shape = new fabric.Triangle({ ...options, width: 0, height: 0 });
      } else if (shapeType === 'line') {
        shape = new fabric.Line([origX, origY, origX, origY], {
          stroke: currentColor,
          strokeWidth: strokeWidth,
          opacity: opacity
        });
      }

      if (shape) {
        canvas.add(shape);
      }
    });

    canvas.on('mouse:move', (o) => {
      if (!isDown || !shape) return;

      const pointer = canvas.getPointer(o.e);

      if (shapeType === 'rectangle') {
        const width = pointer.x - origX;
        const height = pointer.y - origY;
        shape.set({ width: Math.abs(width), height: Math.abs(height) });
        if (width < 0) shape.set({ left: pointer.x });
        if (height < 0) shape.set({ top: pointer.y });
      } else if (shapeType === 'circle') {
        const radius = Math.sqrt(Math.pow(pointer.x - origX, 2) + Math.pow(pointer.y - origY, 2)) / 2;
        shape.set({ radius: radius });
      } else if (shapeType === 'triangle') {
        const width = pointer.x - origX;
        const height = pointer.y - origY;
        shape.set({ width: Math.abs(width), height: Math.abs(height) });
        if (width < 0) shape.set({ left: pointer.x });
        if (height < 0) shape.set({ top: pointer.y });
      } else if (shapeType === 'line') {
        shape.set({ x2: pointer.x, y2: pointer.y });
      }

      canvas.renderAll();
    });

    canvas.on('mouse:up', () => {
      isDown = false;
      setDrawingShape(null);
      setCurrentTool('pen');
      canvas.off('mouse:down');
      canvas.off('mouse:move');
      canvas.off('mouse:up');
    });
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
        <div className="w-20 bg-white border-r flex flex-col items-center py-4 gap-1 overflow-y-auto">
          <div className="text-xs text-gray-500 mb-2">Narzędzia</div>

          <button
            onClick={() => setCurrentTool('select')}
            className={`w-14 h-14 rounded flex flex-col items-center justify-center text-lg ${
              currentTool === 'select' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
            title="Zaznacz (9)"
          >
            <span>↖️</span>
            <span className="text-[10px]">9</span>
          </button>

          <button
            onClick={() => setCurrentTool('pencil')}
            className={`w-14 h-14 rounded flex flex-col items-center justify-center text-lg ${
              currentTool === 'pencil' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
            title="Ołówek (6)"
          >
            <span>✏️</span>
            <span className="text-[10px]">6</span>
          </button>

          <button
            onClick={() => setCurrentTool('pen')}
            className={`w-14 h-14 rounded flex flex-col items-center justify-center text-lg ${
              currentTool === 'pen' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
            title="Pióro (1-4)"
          >
            <span>🖊️</span>
            <span className="text-[10px]">1</span>
          </button>

          <button
            onClick={() => setCurrentTool('marker')}
            className={`w-14 h-14 rounded flex flex-col items-center justify-center text-lg ${
              currentTool === 'marker' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
            title="Marker (7)"
          >
            <span>🖍️</span>
            <span className="text-[10px]">7</span>
          </button>

          <button
            onClick={() => setCurrentTool('highlighter')}
            className={`w-14 h-14 rounded flex flex-col items-center justify-center text-lg ${
              currentTool === 'highlighter' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
            title="Zakreślacz (5)"
          >
            <span>🖍</span>
            <span className="text-[10px]">5</span>
          </button>

          <button
            onClick={() => setCurrentTool('eraser')}
            className={`w-14 h-14 rounded flex flex-col items-center justify-center text-lg ${
              currentTool === 'eraser' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
            title="Gumka (8)"
          >
            <span>🧹</span>
            <span className="text-[10px]">8</span>
          </button>

          <div className="w-12 h-px bg-gray-300 my-2"></div>
          <div className="text-xs text-gray-500 mb-1">Kształty</div>

          <button
            onClick={() => startDrawingShape('line')}
            className="w-14 h-14 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl"
            title="Linia (przeciągnij)"
          >
            📏
          </button>

          <button
            onClick={() => startDrawingShape('rectangle')}
            className="w-14 h-14 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl"
            title="Prostokąt (przeciągnij)"
          >
            ⬜
          </button>

          <button
            onClick={() => startDrawingShape('circle')}
            className="w-14 h-14 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl"
            title="Koło (przeciągnij)"
          >
            ⭕
          </button>

          <button
            onClick={() => startDrawingShape('triangle')}
            className="w-14 h-14 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl"
            title="Trójkąt (przeciągnij)"
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
        <div className="w-72 bg-white border-l p-4 overflow-y-auto">
          <h3 className="font-semibold mb-4">Ustawienia narzędzia</h3>

          {drawingShape && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm font-medium">🎨 Tryb rysowania kształtu</p>
              <p className="text-xs text-gray-600 mt-1">
                Kliknij, przeciągnij i puść na tablicy
              </p>
            </div>
          )}

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

          {currentTool !== 'highlighter' && (
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Przezroczystość: {Math.round(opacity * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          )}

          <div className="mt-8 p-3 bg-blue-50 rounded text-sm">
            <p className="font-semibold mb-2">⌨️ Skróty klawiszowe:</p>
            <div className="text-xs space-y-1">
              <div className="flex justify-between"><span>1</span><span>Czarne pióro</span></div>
              <div className="flex justify-between"><span>2</span><span>Niebieskie pióro</span></div>
              <div className="flex justify-between"><span>3</span><span>Czerwone pióro</span></div>
              <div className="flex justify-between"><span>4</span><span>Zielone pióro</span></div>
              <div className="flex justify-between"><span>5</span><span>Żółty zakreślacz</span></div>
              <div className="flex justify-between"><span>6</span><span>Ołówek</span></div>
              <div className="flex justify-between"><span>7</span><span>Marker</span></div>
              <div className="flex justify-between"><span>8</span><span>Gumka</span></div>
              <div className="flex justify-between"><span>9</span><span>Zaznacz</span></div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-green-50 rounded text-sm">
            <p className="font-semibold mb-2">✨ Kształty:</p>
            <p className="text-xs">Kliknij kształt, potem <b>kliknij i przeciągnij</b> na tablicy!</p>
          </div>
        </div>
      </div>

      <div className="bg-white border-t px-4 py-2 text-sm text-gray-600">
        Fabric.js Canvas - Siatka 20px - {currentTool} - Skróty 1-9
      </div>
    </div>
  );
};

export default Canvas;
