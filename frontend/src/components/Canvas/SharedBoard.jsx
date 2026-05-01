import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { boardsAPI } from '../../services/api';
import useCanvas from '../../hooks/useCanvas';
import Toolbar from './Toolbar';
import Sidebar from './Sidebar';

const SharedBoard = () => {
  const { token } = useParams();
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadBoard();
  }, [token]);

  const loadBoard = async () => {
    try {
      setLoading(true);
      const response = await boardsAPI.getByToken(token);
      setBoard(response.data.board);
    } catch (error) {
      console.error('Failed to load board:', error);
      setError('Nie udało się załadować tablicy. Link może być nieprawidłowy lub tablica została usunięta.');
    } finally {
      setLoading(false);
    }
  };

  // Note: Students can't save directly, but we can add real-time sync later
  const handleCanvasUpdate = useCallback(async (canvasData) => {
    // This will be used for real-time sync via WebSocket
    console.log('Canvas updated:', canvasData);
  }, []);

  const {
    canvasRef,
    currentTool,
    setCurrentTool,
    currentColor,
    setCurrentColor,
    strokeWidth,
    setStrokeWidth,
    undo,
    redo,
    addShape,
    deleteSelected,
    canUndo,
    canRedo
  } = useCanvas({
    boardId: board?.id,
    initialData: board?.canvas_data,
    onCanvasUpdate: handleCanvasUpdate
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
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
        case 'e':
          setCurrentTool('eraser');
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
  }, [setCurrentTool, undo, redo, deleteSelected]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="card max-w-md text-center">
          <svg
            className="mx-auto h-12 w-12 text-red-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="text-xl font-semibold mb-2">Nie znaleziono tablicy</h2>
          <p className="text-neutral-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 px-4 py-3">
        <h1 className="text-lg font-semibold">{board.title}</h1>
        <p className="text-xs text-neutral-500">Tryb ucznia - możesz rysować i współpracować</p>
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
          <canvas
            ref={canvasRef}
            id="fabric-canvas"
            style={{ display: 'block' }}
          />
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
            className="px-3 py-1 text-sm hover:bg-neutral-100 rounded disabled:opacity-50"
          >
            ↶ Cofnij
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="px-3 py-1 text-sm hover:bg-neutral-100 rounded disabled:opacity-50"
          >
            ↷ Ponów
          </button>
        </div>
        <div className="text-sm text-neutral-600">
          Aktywni użytkownicy: 1
        </div>
      </div>
    </div>
  );
};

export default SharedBoard;
