import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fabric } from 'fabric';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { boardsAPI } from '../../services/api';
import Button from '../UI/Button';

// Configure PDF.js worker - using local worker from node_modules
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

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

  // PDF pages state (variant A - slide navigation)
  const [pdfPages, setPdfPages] = useState([]); // Array of {pageNum, imageData, canvasData}
  const [currentPage, setCurrentPage] = useState(0); // Current page index
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfPreview, setPdfPreview] = useState([]); // For page selection modal
  const pdfFileRef = useRef(null);

  // Background settings
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  const [gridColor, setGridColor] = useState('#e0e0e0');
  const [showBackgroundSettings, setShowBackgroundSettings] = useState(false);

  // Background presets
  const backgroundPresets = [
    { name: 'Jasne', bg: '#FFFFFF', grid: '#e0e0e0' },
    { name: 'Ciemne', bg: '#1a1a1a', grid: '#404040' },
    { name: 'Szafir', bg: '#0f4c81', grid: '#6ba3d0' },
    { name: 'Morskie', bg: '#2c5f6f', grid: '#7fb3c4' },
    { name: 'Beż', bg: '#f5f5dc', grid: '#d3d3b5' },
  ];

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

    // Add adaptive grid (changes with zoom) - marked as background
    const drawGrid = (zoomLevel, currentGridColor = gridColor) => {
      // Remove old grid
      const objects = canvas.getObjects();
      objects.forEach(obj => {
        if (obj.isGrid) {
          canvas.remove(obj);
        }
      });

      // Determine grid size based on zoom - FIXED logic
      let gridSize = 20;
      if (zoomLevel >= 4) {
        gridSize = 5;  // Very fine grid when very zoomed in
      } else if (zoomLevel >= 2) {
        gridSize = 10; // Fine grid when zoomed in
      }

      // Draw grid lines covering ENTIRE canvas
      const numVertical = Math.ceil(canvasWidth / gridSize) + 1;
      const numHorizontal = Math.ceil(canvasHeight / gridSize) + 1;

      for (let i = 0; i < numVertical; i++) {
        const line = new fabric.Line([i * gridSize, 0, i * gridSize, canvasHeight], {
          stroke: currentGridColor,
          strokeWidth: 1,
          selectable: false,
          evented: false,
          objectCaching: false,
          isGrid: true,
          excludeFromExport: true
        });
        canvas.add(line);
        canvas.sendToBack(line);
      }

      for (let i = 0; i < numHorizontal; i++) {
        const line = new fabric.Line([0, i * gridSize, canvasWidth, i * gridSize], {
          stroke: currentGridColor,
          strokeWidth: 1,
          selectable: false,
          evented: false,
          objectCaching: false,
          isGrid: true,
          excludeFromExport: true
        });
        canvas.add(line);
        canvas.sendToBack(line);
      }
    };

    drawGrid(1, gridColor); // Initial grid at 100% zoom
    canvas.drawGrid = drawGrid; // Expose for zoom updates

    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    canvas.freeDrawingBrush.color = currentColor;
    canvas.freeDrawingBrush.width = strokeWidth;

    // Zoom with mouse wheel (Ctrl+scroll)
    canvas.on('mouse:wheel', (opt) => {
      const delta = opt.e.deltaY;
      let newZoom = canvas.getZoom();
      const oldZoom = newZoom;
      newZoom *= 0.999 ** delta;

      // Limit zoom range
      if (newZoom > 5) newZoom = 5;
      if (newZoom < 0.1) newZoom = 0.1;

      canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, newZoom);
      setZoom(newZoom);

      // Redraw grid if zoom crossed threshold
      if ((oldZoom < 2 && newZoom >= 2) || (oldZoom >= 2 && newZoom < 2) ||
          (oldZoom < 4 && newZoom >= 4) || (oldZoom >= 4 && newZoom < 4)) {
        if (canvas.drawGrid) canvas.drawGrid(newZoom, gridColor);
      }

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

  // Update canvas background when color changes
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.setBackgroundColor(backgroundColor, canvas.renderAll.bind(canvas));

    // Redraw grid with new color
    if (canvas.drawGrid) {
      canvas.drawGrid(zoom, gridColor);
    }
  }, [backgroundColor, gridColor]);

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
      // Use EraserBrush if available (Fabric.js 5.x+), otherwise use object removal
      if (fabric.EraserBrush) {
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush = new fabric.EraserBrush(canvas);
        canvas.freeDrawingBrush.width = strokeWidth * 2;
      } else {
        // Fallback: manual erasing by detecting and removing objects
        canvas.isDrawingMode = false;
        canvas.selection = false;

        let isErasing = false;
        const eraseObject = (opt) => {
          if (!isErasing) return;
          const pointer = canvas.getPointer(opt.e);
          const objects = canvas.getObjects();

          for (let i = objects.length - 1; i >= 0; i--) {
            const obj = objects[i];
            // Don't erase grid lines
            if (obj.isGrid) continue;

            if (obj.containsPoint(pointer)) {
              canvas.remove(obj);
              break;
            }
          }
        };

        canvas.on('mouse:down', () => { isErasing = true; });
        canvas.on('mouse:move', eraseObject);
        canvas.on('mouse:up', () => { isErasing = false; });
      }
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

  // PDF Import Functions
  const handlePdfUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      return; // User cancelled
    }

    if (file.type !== 'application/pdf') {
      alert('Proszę wybrać plik PDF (wybrany plik: ' + file.type + ')');
      return;
    }

    console.log('Ładowanie PDF:', file.name, 'Rozmiar:', file.size, 'bytes');

    try {
      const arrayBuffer = await file.arrayBuffer();
      console.log('ArrayBuffer załadowany, rozmiar:', arrayBuffer.byteLength);

      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      console.log('PDF.js loading task utworzony');

      const pdf = await loadingTask.promise;
      console.log('PDF załadowany, liczba stron:', pdf.numPages);

      const numPages = pdf.numPages;

      // Render all pages as thumbnails for selection
      const previews = [];
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        console.log('Renderowanie miniaturki strony', pageNum);
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 0.3 }); // Small preview

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: context, viewport }).promise;

        previews.push({
          pageNum,
          thumbnail: canvas.toDataURL(),
          selected: true // Default: all pages selected
        });
      }

      console.log('Wszystkie miniaturki wyrenderowane');
      setPdfPreview(previews);
      setShowPdfModal(true);
      pdfFileRef.current = { pdf, arrayBuffer };
    } catch (error) {
      console.error('BŁĄD ładowania PDF:', error);
      console.error('Szczegóły błędu:', error.message);
      console.error('Stack trace:', error.stack);
      alert('Nie udało się załadować PDF\n\nBłąd: ' + error.message + '\n\nSprawdź konsolę (F12) aby zobaczyć szczegóły.');
    }
  };

  const handlePdfPageSelection = async () => {
    const selectedPages = pdfPreview.filter(p => p.selected);
    if (selectedPages.length === 0) {
      alert('Wybierz przynajmniej jedną stronę');
      return;
    }

    try {
      const { pdf } = pdfFileRef.current;
      const pages = [];

      for (const pageInfo of selectedPages) {
        const page = await pdf.getPage(pageInfo.pageNum);
        const viewport = page.getViewport({ scale: 2 }); // High quality

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: context, viewport }).promise;

        pages.push({
          pageNum: pageInfo.pageNum,
          imageData: canvas.toDataURL(),
          canvasData: null // Will store drawings for this page
        });
      }

      setPdfPages(pages);
      setCurrentPage(0);
      setShowPdfModal(false);

      // Set first page as background
      if (pages.length > 0) {
        setPageBackground(0, pages);
      }
    } catch (error) {
      console.error('Błąd renderowania stron PDF:', error);
      alert('Nie udało się załadować wybranych stron');
    }
  };

  const setPageBackground = (pageIndex, pages = pdfPages) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !pages[pageIndex]) return;

    // Save current page canvas data before switching
    if (pdfPages.length > 0 && currentPage >= 0) {
      const updatedPages = [...pdfPages];
      updatedPages[currentPage] = {
        ...updatedPages[currentPage],
        canvasData: canvas.toJSON(['isGrid', 'excludeFromExport'])
      };
      setPdfPages(updatedPages);
    }

    // Load new page
    const pageData = pages[pageIndex];

    // Clear canvas (keep grid)
    const objects = canvas.getObjects();
    objects.forEach(obj => {
      if (!obj.isGrid) {
        canvas.remove(obj);
      }
    });

    // Set PDF page as background image
    fabric.Image.fromURL(pageData.imageData, (img) => {
      canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
        scaleX: canvas.width / img.width,
        scaleY: canvas.height / img.height
      });

      // Load saved drawings for this page
      if (pageData.canvasData) {
        canvas.loadFromJSON(pageData.canvasData, () => {
          // Re-add grid after loading
          if (canvas.drawGrid) canvas.drawGrid(zoom);
          canvas.renderAll();
        });
      }
    });
  };

  const handlePageNavigation = (direction) => {
    if (pdfPages.length === 0) return;

    const newPage = currentPage + direction;
    if (newPage < 0 || newPage >= pdfPages.length) return;

    setCurrentPage(newPage);
    setPageBackground(newPage);
  };

  // Zoom controls
  const handleZoomIn = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const oldZoom = canvas.getZoom();
    let newZoom = oldZoom * 1.2;
    if (newZoom > 5) newZoom = 5;
    canvas.setZoom(newZoom);
    setZoom(newZoom);

    // Redraw grid if crossed threshold
    if ((oldZoom < 2 && newZoom >= 2) || (oldZoom < 4 && newZoom >= 4)) {
      if (canvas.drawGrid) canvas.drawGrid(newZoom, gridColor);
    }
  };

  const handleZoomOut = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const oldZoom = canvas.getZoom();
    let newZoom = oldZoom / 1.2;
    if (newZoom < 0.1) newZoom = 0.1;
    canvas.setZoom(newZoom);
    setZoom(newZoom);

    // Redraw grid if crossed threshold
    if ((oldZoom >= 2 && newZoom < 2) || (oldZoom >= 4 && newZoom < 4)) {
      if (canvas.drawGrid) canvas.drawGrid(newZoom, gridColor);
    }
  };

  const handleZoomReset = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const oldZoom = canvas.getZoom();
    canvas.setZoom(1);
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    setZoom(1);

    // Redraw grid
    if (oldZoom !== 1 && canvas.drawGrid) {
      canvas.drawGrid(1, gridColor);
    }
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
          {/* PDF Page Navigation */}
          {pdfPages.length > 0 && (
            <div className="flex items-center gap-1 bg-blue-50 rounded px-3 py-1 border border-blue-200">
              <button
                onClick={() => handlePageNavigation(-1)}
                disabled={currentPage === 0}
                className="w-7 h-7 rounded hover:bg-blue-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                title="Poprzednia strona"
              >
                ←
              </button>
              <span className="text-sm font-medium px-2">
                {currentPage + 1} / {pdfPages.length}
              </span>
              <button
                onClick={() => handlePageNavigation(1)}
                disabled={currentPage === pdfPages.length - 1}
                className="w-7 h-7 rounded hover:bg-blue-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                title="Następna strona"
              >
                →
              </button>
            </div>
          )}

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

          {/* PDF Import Button */}
          <input
            type="file"
            accept="application/pdf"
            onChange={handlePdfUpload}
            className="hidden"
            id="pdf-upload"
          />
          <label
            htmlFor="pdf-upload"
            className="font-medium py-2 px-4 rounded-lg transition-colors duration-200 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 cursor-pointer inline-block"
          >
            📄 Import PDF
          </label>

          <Button variant="secondary" onClick={() => setShowBackgroundSettings(true)}>
            🎨 Tło
          </Button>

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
              <div className="text-green-600 mt-2">✨ Siatka adaptacyjna - więcej kratek przy zbliżeniu!</div>
              <div className="text-gray-600 mt-1">Canvas 5600x3200px (4x ekran)</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-t px-4 py-2 text-sm text-gray-600">
        {currentTool} | Zoom: {Math.round(zoom * 100)}% | Scroll: zoom | Shift+przeciągnij: pan | Skróty 1-9
        {pdfPages.length > 0 && ` | PDF: Strona ${currentPage + 1}/${pdfPages.length}`}
      </div>

      {/* PDF Page Selection Modal */}
      {showPdfModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-auto">
            <h2 className="text-xl font-bold mb-4">Wybierz strony PDF do importu</h2>
            <p className="text-sm text-gray-600 mb-4">
              Odznacz niepotrzebne strony (np. strony tytułowe). Wybrane strony zostaną dodane jako slajdy.
            </p>

            <div className="grid grid-cols-4 gap-4 mb-6">
              {pdfPreview.map((page, idx) => (
                <div
                  key={idx}
                  className={`border-2 rounded p-2 cursor-pointer transition ${
                    page.selected ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                  onClick={() => {
                    const updated = [...pdfPreview];
                    updated[idx].selected = !updated[idx].selected;
                    setPdfPreview(updated);
                  }}
                >
                  <img
                    src={page.thumbnail}
                    alt={`Strona ${page.pageNum}`}
                    className="w-full h-auto mb-2"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Str. {page.pageNum}</span>
                    <input
                      type="checkbox"
                      checked={page.selected}
                      onChange={() => {}}
                      className="w-4 h-4"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={() => {
                  const allSelected = pdfPreview.every(p => p.selected);
                  setPdfPreview(pdfPreview.map(p => ({ ...p, selected: !allSelected })));
                }}
                className="text-sm text-blue-600 hover:underline"
              >
                {pdfPreview.every(p => p.selected) ? 'Odznacz wszystkie' : 'Zaznacz wszystkie'}
              </button>

              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setShowPdfModal(false)}>
                  Anuluj
                </Button>
                <Button onClick={handlePdfPageSelection}>
                  Importuj wybrane ({pdfPreview.filter(p => p.selected).length})
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Background Settings Modal */}
      {showBackgroundSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl">
            <h2 className="text-xl font-bold mb-4">Ustawienia tła</h2>
            <p className="text-sm text-gray-600 mb-6">
              Wybierz preset kolorystyczny lub ustaw własne kolory tła i siatki
            </p>

            {/* Color Presets */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-3">Presety kolorów:</label>
              <div className="grid grid-cols-5 gap-3">
                {backgroundPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setBackgroundColor(preset.bg);
                      setGridColor(preset.grid);
                    }}
                    className="flex flex-col items-center p-3 border-2 rounded-lg hover:border-blue-500 transition"
                    style={{
                      borderColor: backgroundColor === preset.bg ? '#3b82f6' : '#d1d5db'
                    }}
                  >
                    <div
                      className="w-16 h-16 rounded mb-2 border border-gray-300 relative"
                      style={{ backgroundColor: preset.bg }}
                    >
                      <div
                        className="absolute inset-0 opacity-50"
                        style={{
                          backgroundImage: `linear-gradient(${preset.grid} 1px, transparent 1px), linear-gradient(90deg, ${preset.grid} 1px, transparent 1px)`,
                          backgroundSize: '20px 20px'
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Colors */}
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Kolor tła:</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-16 h-10 rounded border cursor-pointer"
                  />
                  <span className="text-sm font-mono">{backgroundColor}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Kolor siatki:</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={gridColor}
                    onChange={(e) => setGridColor(e.target.value)}
                    className="w-16 h-10 rounded border cursor-pointer"
                  />
                  <span className="text-sm font-mono">{gridColor}</span>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">Podgląd:</label>
              <div
                className="w-full h-32 rounded border-2 border-gray-300 relative"
                style={{ backgroundColor }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `linear-gradient(${gridColor} 1px, transparent 1px), linear-gradient(90deg, ${gridColor} 1px, transparent 1px)`,
                    backgroundSize: '20px 20px'
                  }}
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowBackgroundSettings(false)}>
                Zamknij
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Canvas;
