import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { boardsAPI } from '../../services/api';
import wsService from '../../services/websocket';
import useCanvas from '../../hooks/useCanvas';
import Toolbar from './Toolbar';
import Sidebar from './Sidebar';
import Button from '../UI/Button';

const Canvas = () => {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);

  // Load board data
  useEffect(() => {
    loadBoard();
  }, [boardId]);

  const loadBoard = async () => {
    try {
      setLoading(true);
      const response = await boardsAPI.getById(boardId);
      setBoard(response.data.board);

      // Generate share link
      const token = response.data.board.share_token || '';
      setShareLink(`${window.location.origin}/shared/${token}`);
    } catch (error) {
      console.error('Failed to load board:', error);
      setError('Nie udało się załadować tablicy');
    } finally {
      setLoading(false);
    }
  };

  // Auto-save canvas to database
  const handleCanvasUpdate = useCallback(async (canvasData) => {
    if (!boardId || saving) return;

    try {
      setSaving(true);
      await boardsAPI.update(boardId, {
        canvas_data: canvasData
      });
    } catch (error) {
      console.error('Failed to save canvas:', error);
    } finally {
      setSaving(false);
    }
  }, [boardId, saving]);

  // Initialize canvas hook
  const {
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
    canUndo,
    canRedo
  } = useCanvas({
    boardId,
    initialData: board?.canvas_data,
    onCanvasUpdate: handleCanvasUpdate
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
          case 'y':
            e.preventDefault();
            redo();
            break;
          default:
            break;
        }
        return;
      }

      // Tool shortcuts
      switch (e.key.toLowerCase()) {
        case 's':
          setCurrentTool('select');
          break;
        case 'p':
          setCurrentTool('pencil');
          break;
        case 'b':
          setCurrentTool('pen');
          break;
        case 'm':
          setCurrentTool('marker');
          break;
        case 'h':
          setCurrentTool('highlighter');
          break;
        case 'e':
          setCurrentTool('eraser');
          break;
        case 'l':
          addShape('line');
          break;
        case 'r':
          addShape('rectangle');
          break;
        case 'c':
          addShape('circle');
          break;
        case 'delete':
        case 'backspace':
          deleteSelected();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setCurrentTool, undo, redo, addShape, deleteSelected]);

  // Copy share link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export to PDF (placeholder)
  const handleExportPDF = () => {
    alert('Export do PDF będzie dostępny wkrótce!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Tablica nie istnieje'}</p>
          <Button onClick={() => navigate('/dashboard')}>
            Powrót do dashboardu
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            onClick={() => navigate('/dashboard')}
          >
            ← Powrót
          </Button>
          <h1 className="text-lg font-semibold">{board.title}</h1>
          {saving && (
            <span className="text-sm text-neutral-500 animate-pulse">
              Zapisywanie...
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleCopyLink}>
            {copied ? '✓ Skopiowano!' : '🔗 Udostępnij'}
          </Button>
          <Button variant="secondary" onClick={handleExportPDF}>
            📥 Eksportuj PDF
          </Button>
        </div>
      </header>

      {/* Canvas Area */}
      <div className="flex-1 flex">
        {/* Toolbar */}
        <Toolbar
          currentTool={currentTool}
          onToolChange={setCurrentTool}
          onAddShape={addShape}
        />

        {/* Canvas */}
        <div className="flex-1 bg-white relative overflow-hidden">
          <canvas ref={canvasRef} />
        </div>

        {/* Sidebar */}
        <Sidebar
          currentColor={currentColor}
          onColorChange={setCurrentColor}
          strokeWidth={strokeWidth}
          onStrokeWidthChange={setStrokeWidth}
          currentTool={currentTool}
        />
      </div>

      {/* Bottom Bar */}
      <div className="bg-white border-t border-neutral-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="px-3 py-1 text-sm hover:bg-neutral-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ↶ Cofnij (Ctrl+Z)
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="px-3 py-1 text-sm hover:bg-neutral-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ↷ Ponów (Ctrl+Y)
          </button>
          <button
            onClick={clearCanvas}
            className="px-3 py-1 text-sm hover:bg-neutral-100 rounded text-red-600"
          >
            🗑️ Wyczyść
          </button>
        </div>
        <div className="text-sm text-neutral-600">
          Aktywni użytkownicy: 1
        </div>
      </div>
    </div>
  );
};

export default Canvas;
