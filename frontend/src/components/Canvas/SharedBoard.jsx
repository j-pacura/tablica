import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { boardsAPI } from '../../services/api';

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

      {/* Canvas Area - Placeholder */}
      <div className="flex-1 flex">
        {/* Toolbar */}
        <div className="w-16 bg-neutral-100 border-r border-neutral-200 flex flex-col items-center py-4 gap-2">
          <div className="w-10 h-10 bg-neutral-300 rounded flex items-center justify-center cursor-pointer hover:bg-neutral-400">
            ✏️
          </div>
          <div className="w-10 h-10 bg-neutral-300 rounded flex items-center justify-center cursor-pointer hover:bg-neutral-400">
            🖊️
          </div>
          <div className="w-10 h-10 bg-neutral-300 rounded flex items-center justify-center cursor-pointer hover:bg-neutral-400">
            ⬜
          </div>
          <div className="w-10 h-10 bg-neutral-300 rounded flex items-center justify-center cursor-pointer hover:bg-neutral-400">
            ⭕
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 bg-white relative">
          <div className="absolute inset-0 flex items-center justify-center text-neutral-400">
            <div className="text-center">
              <p className="text-lg">Wspólna tablica</p>
              <p className="text-sm mt-2">Canvas z Fabric.js zostanie zintegrowany wkrótce</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-white border-t border-neutral-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button className="px-2 py-1 text-sm hover:bg-neutral-100 rounded">Cofnij</button>
          <button className="px-2 py-1 text-sm hover:bg-neutral-100 rounded">Ponów</button>
        </div>
        <div className="text-sm text-neutral-600">
          Aktywni użytkownicy: 1
        </div>
      </div>
    </div>
  );
};

export default SharedBoard;
