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

  // Pan and Zoom state (infinite canvas)
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });

  // Keyboard shortcuts - customizable presets (like Idroo)
  const [toolPresets, setToolPresets] = useState({
    '1': { tool: 'pen', color: '#000000', width: 2, opacity: 1 },
    '2': { tool: 'pen', color: '#0000FF', width: 2, opacity: 1 },
    '3': { tool: 'pen', color: '#FF0000', width: 2, opacity: 1 },
    '4': { tool: 'pen', color: '#00FF00', width: 2, opacity: 1 },
    '5': { tool: 'highlighter', color: '#FFFF00', width: 20, opacity: 0.3 },
    '6': { tool: 'pencil', color: '#000000', width: 1, opacity: 1 },
    '7': { tool: 'marker', color: '#FF00FF', width: 5, opacity: 1 },
    '8': { tool: 'eraser', color: '#FFFFFF', width: 10, opacity: 1 },
    '9': { tool: 'select', color: '#000000', width: 2, opacity: 1 }
  });

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

  // Initialize Fabric.js canvas (infinite canvas)
  useEffect(() => {
    if (!board || !canvasContainerRef.current || fabricCanvasRef.current) return;

    const canvasEl = document.createElement('canvas');
    canvasEl.id = 'fabric-canvas';
    canvasContainerRef.current.appendChild(canvasEl);

    // Larger canvas for "infinite" effect (4x viewport)
    const canvasWidth = 5600;  // 4x 1400
    const canvasHeight = 3200; // 4x 800

    const canvas = new fabric.Canvas('fabric-canvas', {
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: '#FFFFFF',
      isDrawingMode: true
    });

    // Add grid across entire canvas
    const gridSize = 20;
    for (let i = 0; i <= canvasWidth / gridSize; i++) {
      canvas.add(new fabric.Line([i * gridSize, 0, i * gridSize, canvasHeight], {
        stroke: '#e0e0e0',
        strokeWidth: 1,
        selectable: false,
        evented: false,
        objectCaching: false
      }));
    }
    for (let i = 0; i <= canvasHeight / gridSize; i++) {
      canvas.add(new fabric.Line([0, i * gridSize, canvasWidth, i * gridSize], {
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

    // Zoom with mouse wheel (Ctrl+scroll)
    canvas.on('mouse:wheel', (opt) => {
      const delta = opt.e.deltaY;
      let newZoom = canvas.getZoom();
      newZoom *= 0.999 ** delta;

      // Limit zoom range
      if (newZoom > 5) newZoom = 5;
      if (newZoom < 0.1) newZoom = 0.1;

      canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, newZoom);
      setZoom(newZoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    // Pan with Space+drag or middle mouse button
    canvas.on('mouse:down', (opt) => {
      const evt = opt.e;

      // Middle mouse button or Space key
      if (evt.button === 1 || (evt.button === 0 && evt.shiftKey)) {
        setIsPanning(true);
        canvas.selection = false;
        canvas.isDrawingMode = false;
        panStart.current = { x: evt.clientX, y: evt.clientY };
      }
    });

    canvas.on('mouse:move', (opt) => {
      if (isPanning) {
        const evt = opt.e;
        const vpt = canvas.viewportTransform;
        vpt[4] += evt.clientX - panStart.current.x;
        vpt[5] += evt.clientY - panStart.current.y;
        canvas.requestRenderAll();
        panStart.current = { x: evt.clientX, y: evt.clientY };
      }
    });

    canvas.on('mouse:up', () => {
      if (isPanning) {
        setIsPanning(false);
        canvas.setViewportTransform(canvas.viewportTransform);
      }
    });

    fabricCanvasRef.current = canvas;

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, [board, isPanning]);

  // Helper function to convert hex color to RGBA with opacity
  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

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
      canvas.freeDrawingBrush.color = hexToRgba(currentColor, opacity);
      canvas.freeDrawingBrush.width = strokeWidth;
      canvas.freeDrawingBrush.strokeLineCap = 'round';
    } else if (currentTool === 'pen') {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = hexToRgba(currentColor, opacity);
      canvas.freeDrawingBrush.width = strokeWidth;
      canvas.freeDrawingBrush.strokeLineCap = 'round';
    } else if (currentTool === 'marker') {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = hexToRgba(currentColor, opacity);
      canvas.freeDrawingBrush.width = strokeWidth * 1.5;
      canvas.freeDrawingBrush.strokeLineCap = 'round';
    } else if (currentTool === 'highlighter') {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = hexToRgba(currentColor, 0.3);
      canvas.freeDrawingBrush.width = strokeWidth * 3;
      canvas.freeDrawingBrush.strokeLineCap = 'square';
    } else {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = hexToRgba(currentColor, opacity);
      canvas.freeDrawingBrush.width = strokeWidth;
    }
  }, [currentTool, currentColor, strokeWidth, opacity]);

  // Keyboard shortcuts (like Idroo: number=load, Ctrl+number=save)
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Number keys 1-9
      if (e.key >= '1' && e.key <= '9') {
        e.preventDefault();

        if (e.ctrlKey || e.metaKey) {
          // Ctrl+Number: SAVE current settings to this slot
          setToolPresets(prev => ({
            ...prev,
            [e.key]: {
              tool: currentTool,
              color: currentColor,
              width: strokeWidth,
              opacity: opacity
            }
          }));
          console.log(`Zapisano preset ${e.key}: ${currentTool}, ${currentColor}, ${strokeWidth}px, ${Math.round(opacity * 100)}%`);
        } else {
          // Number: LOAD preset from this slot
          const preset = toolPresets[e.key];
          if (preset) {
            setCurrentTool(preset.tool);
            setCurrentColor(preset.color);
            setStrokeWidth(preset.width);
            setOpacity(preset.opacity);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentTool, currentColor, strokeWidth, opacity, toolPresets]);

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

  // Zoom controls
  const handleZoomIn = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    let newZoom = canvas.getZoom() * 1.2;
    if (newZoom > 5) newZoom = 5;
    canvas.setZoom(newZoom);
    setZoom(newZoom);
  };

  const handleZoomOut = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    let newZoom = canvas.getZoom() / 1.2;
    if (newZoom < 0.1) newZoom = 0.1;
    canvas.setZoom(newZoom);
    setZoom(newZoom);
  };

  const handleZoomReset = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    canvas.setZoom(1);
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    setZoom(1);
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
        <div className="flex gap-2 items-center">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-gray-100 rounded px-2 py-1">
            <button
              onClick={handleZoomOut}
              className="w-8 h-8 rounded hover:bg-gray-200 flex items-center justify-center text-lg font-bold"
              title="Zoom out"
            >
              −
            </button>
            <button
              onClick={handleZoomReset}
              className="px-2 h-8 rounded hover:bg-gray-200 flex items-center justify-center text-sm font-medium min-w-[60px]"
              title="Reset zoom (100%)"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={handleZoomIn}
              className="w-8 h-8 rounded hover:bg-gray-200 flex items-center justify-center text-lg font-bold"
              title="Zoom in"
            >
              +
            </button>
          </div>

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
            <p className="font-semibold mb-2">⌨️ Skróty klawiszowe (jak Idroo):</p>
            <div className="text-xs space-y-2">
              <div className="p-2 bg-white rounded">
                <p className="font-semibold mb-1">1-9: Załaduj preset</p>
                <p className="text-gray-600">Przywołuje zapisane ustawienia</p>
              </div>
              <div className="p-2 bg-white rounded">
                <p className="font-semibold mb-1">Ctrl+1-9: Zapisz preset</p>
                <p className="text-gray-600">Zapisuje aktualne ustawienia (kolor, grubość, opacity)</p>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-600">
              <p className="font-semibold mb-1">Domyślne presety:</p>
              <div className="space-y-0.5">
                <div>1-4: Kolorowe pióra</div>
                <div>5: Żółty zakreślacz</div>
                <div>6: Ołówek</div>
                <div>7: Marker</div>
                <div>8: Gumka</div>
                <div>9: Zaznacz</div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-green-50 rounded text-sm">
            <p className="font-semibold mb-2">✨ Kształty:</p>
            <p className="text-xs">Kliknij kształt, potem <b>kliknij i przeciągnij</b> na tablicy!</p>
          </div>

          <div className="mt-4 p-3 bg-purple-50 rounded text-sm">
            <p className="font-semibold mb-2">🔍 Nieskończony canvas:</p>
            <div className="text-xs space-y-1">
              <div><b>Scroll myszką:</b> Zoom in/out</div>
              <div><b>Shift + przeciągnij:</b> Przesuwanie (pan)</div>
              <div><b>Przyciski +/−:</b> Zoom</div>
              <div className="text-gray-600 mt-1">Canvas 5600x3200px (4x ekran)</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-t px-4 py-2 text-sm text-gray-600">
        {currentTool} | Zoom: {Math.round(zoom * 100)}% | Scroll: zoom | Shift+przeciągnij: pan | Skróty 1-9
      </div>
    </div>
  );
};

export default Canvas;
