import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { boardsAPI } from '../../services/api';
import Button from '../UI/Button';

const Canvas = () => {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadBoard();
  }, [boardId]);

  const loadBoard = async () => {
    try {
      setLoading(true);
      const response = await boardsAPI.getById(boardId);
      setBoard(response.data.board);
    } catch (error) {
      console.error('Failed to load board:', error);
      setError('Nie udało się załadować tablicy');
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
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary">Udostępnij</Button>
          <Button variant="secondary">Eksportuj PDF</Button>
        </div>
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
              <p className="text-lg">Canvas będzie tutaj</p>
              <p className="text-sm mt-2">Fabric.js zostanie zintegrowany w następnym kroku</p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-64 bg-neutral-50 border-l border-neutral-200 p-4">
          <h3 className="font-semibold mb-2">Ustawienia</h3>
          <p className="text-sm text-neutral-600">Panel narzędzi będzie tutaj</p>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-white border-t border-neutral-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button className="px-2 py-1 text-sm hover:bg-neutral-100 rounded">Cofnij</button>
          <button className="px-2 py-1 text-sm hover:bg-neutral-100 rounded">Ponów</button>
        </div>
        <div className="text-sm text-neutral-600">
          Użytkownicy: 1
        </div>
      </div>
    </div>
  );
};

export default Canvas;
