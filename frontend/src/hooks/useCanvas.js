import { useEffect, useRef, useState, useCallback } from 'react';
import { fabric } from 'fabric';

export const useCanvas = ({
  boardId,
  initialData = null,
  onCanvasUpdate
}) => {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const [canvas, setCanvas] = useState(null);
  const [currentTool, setCurrentTool] = useState('pencil');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [history, setHistory] = useState({ past: [], present: null, future: [] });

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (!canvasRef.current) return;

      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        width: window.innerWidth - 350, // Account for toolbar and sidebar
        height: window.innerHeight - 120, // Account for header and footer
        backgroundColor: '#FFFFFF',
        isDrawingMode: false,
      });

      fabricCanvasRef.current = fabricCanvas;
      setCanvas(fabricCanvas);

      // Load initial data if provided
      if (initialData && initialData.objects) {
        try {
          fabricCanvas.loadFromJSON(initialData, () => {
            fabricCanvas.renderAll();
          });
        } catch (error) {
          console.error('Failed to load canvas data:', error);
        }
      }

      // Handle window resize
      const handleResize = () => {
        fabricCanvas.setWidth(window.innerWidth - 350);
        fabricCanvas.setHeight(window.innerHeight - 120);
        fabricCanvas.renderAll();
      };

      window.addEventListener('resize', handleResize);
    }, 100);

    return () => {
      clearTimeout(timer);
      if (fabricCanvasRef.current) {
        window.removeEventListener('resize', () => {});
        fabricCanvasRef.current.dispose();
      }
    };
  }, []);

  // Load initial data when canvas is ready
  useEffect(() => {
    if (!canvas || !initialData || !initialData.objects) return;

    try {
      canvas.loadFromJSON(initialData, () => {
        canvas.renderAll();
      });
    } catch (error) {
      console.error('Failed to load initial canvas data:', error);
    }
  }, [canvas, initialData]);

  // Setup drawing tool
  useEffect(() => {
    if (!canvas) return;

    // Disable drawing mode for all tools first
    canvas.isDrawingMode = false;

    switch (currentTool) {
      case 'pencil':
      case 'pen':
      case 'brush':
      case 'marker':
      case 'highlighter':
        canvas.isDrawingMode = true;
        const brush = new fabric.PencilBrush(canvas);
        brush.color = currentColor;
        brush.width = strokeWidth;

        // Different opacity for highlighter
        if (currentTool === 'highlighter') {
          brush.color = currentColor;
          brush.width = strokeWidth * 3;
          const ctx = canvas.getContext('2d');
          ctx.globalAlpha = 0.3;
        }

        canvas.freeDrawingBrush = brush;
        break;

      case 'eraser':
        canvas.isDrawingMode = true;
        const eraser = new fabric.PencilBrush(canvas);
        eraser.color = '#FFFFFF'; // White eraser
        eraser.width = strokeWidth * 2;
        canvas.freeDrawingBrush = eraser;
        break;

      case 'select':
        canvas.isDrawingMode = false;
        canvas.selection = true;
        break;

      default:
        canvas.isDrawingMode = false;
    }

    canvas.renderAll();
  }, [canvas, currentTool, currentColor, strokeWidth]);

  // Save state for undo/redo
  const saveState = useCallback(() => {
    if (!canvas) return;

    const json = canvas.toJSON();
    setHistory(prev => ({
      past: [...prev.past, prev.present],
      present: json,
      future: []
    }));

    // Notify parent component
    if (onCanvasUpdate) {
      onCanvasUpdate(json);
    }
  }, [canvas, onCanvasUpdate]);

  // Listen to canvas events
  useEffect(() => {
    if (!canvas) return;

    const handleObjectAdded = () => saveState();
    const handleObjectModified = () => saveState();
    const handleObjectRemoved = () => saveState();

    canvas.on('object:added', handleObjectAdded);
    canvas.on('object:modified', handleObjectModified);
    canvas.on('object:removed', handleObjectRemoved);

    return () => {
      canvas.off('object:added', handleObjectAdded);
      canvas.off('object:modified', handleObjectModified);
      canvas.off('object:removed', handleObjectRemoved);
    };
  }, [canvas, saveState]);

  // Undo function
  const undo = useCallback(() => {
    if (!canvas || history.past.length === 0) return;

    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, history.past.length - 1);

    setHistory({
      past: newPast,
      present: previous,
      future: [history.present, ...history.future]
    });

    canvas.loadFromJSON(previous, () => {
      canvas.renderAll();
    });
  }, [canvas, history]);

  // Redo function
  const redo = useCallback(() => {
    if (!canvas || history.future.length === 0) return;

    const next = history.future[0];
    const newFuture = history.future.slice(1);

    setHistory({
      past: [...history.past, history.present],
      present: next,
      future: newFuture
    });

    canvas.loadFromJSON(next, () => {
      canvas.renderAll();
    });
  }, [canvas, history]);

  // Clear canvas
  const clearCanvas = useCallback(() => {
    if (!canvas) return;
    canvas.clear();
    canvas.backgroundColor = '#FFFFFF';
    saveState();
  }, [canvas, saveState]);

  // Add shape
  const addShape = useCallback((shapeType) => {
    if (!canvas) return;

    let shape;
    const options = {
      left: 100,
      top: 100,
      fill: 'transparent',
      stroke: currentColor,
      strokeWidth: strokeWidth
    };

    switch (shapeType) {
      case 'rectangle':
        shape = new fabric.Rect({ ...options, width: 100, height: 100 });
        break;
      case 'circle':
        shape = new fabric.Circle({ ...options, radius: 50 });
        break;
      case 'line':
        shape = new fabric.Line([50, 50, 200, 50], { ...options });
        break;
      default:
        return;
    }

    canvas.add(shape);
    canvas.setActiveObject(shape);
    canvas.renderAll();
  }, [canvas, currentColor, strokeWidth]);

  // Delete selected object
  const deleteSelected = useCallback(() => {
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length) {
      canvas.remove(...activeObjects);
      canvas.discardActiveObject();
      canvas.renderAll();
    }
  }, [canvas]);

  // Export canvas as JSON
  const exportJSON = useCallback(() => {
    if (!canvas) return null;
    return canvas.toJSON();
  }, [canvas]);

  // Export canvas as image
  const exportImage = useCallback(() => {
    if (!canvas) return null;
    return canvas.toDataURL({ format: 'png' });
  }, [canvas]);

  return {
    canvasRef,
    canvas,
    currentTool,
    setCurrentTool,
    currentColor,
    setCurrentColor,
    strokeWidth,
    setStrokeWidth,
    undo,
    redo,
    clearCanvas,
    addShape,
    deleteSelected,
    exportJSON,
    exportImage,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0
  };
};

export default useCanvas;
