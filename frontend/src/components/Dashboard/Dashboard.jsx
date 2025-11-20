import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../context/AuthContext';
import { boardsAPI } from '../../services/api';
import BoardList from './BoardList';
import Button from '../UI/Button';
import Modal from '../UI/Modal';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadBoards();
  }, []);

  const loadBoards = async () => {
    try {
      setLoading(true);
      const response = await boardsAPI.getAll();
      setBoards(response.data.boards);
    } catch (error) {
      console.error('Failed to load boards:', error);
      setError('Nie udało się załadować tablic');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!newBoardTitle.trim()) return;

    try {
      const response = await boardsAPI.create({ title: newBoardTitle });
      const newBoard = response.data.board;

      setBoards([newBoard, ...boards]);
      setIsCreateModalOpen(false);
      setNewBoardTitle('');

      // Navigate to the new board
      navigate(`/board/${newBoard.id}`);
    } catch (error) {
      console.error('Failed to create board:', error);
      setError('Nie udało się utworzyć tablicy');
    }
  };

  const handleDeleteBoard = async (boardId) => {
    if (!window.confirm('Czy na pewno chcesz usunąć tę tablicę?')) return;

    try {
      await boardsAPI.delete(boardId);
      setBoards(boards.filter((b) => b.id !== boardId));
    } catch (error) {
      console.error('Failed to delete board:', error);
      setError('Nie udało się usunąć tablicy');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-800">Tablica Matematyczna</h1>
              <p className="text-sm text-neutral-600">Witaj, {user?.name || user?.email}</p>
            </div>
            <Button variant="secondary" onClick={handleLogout}>
              Wyloguj się
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-neutral-800">Moje tablice</h2>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            + Nowa tablica
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-neutral-600">Ładowanie tablic...</p>
          </div>
        ) : (
          <BoardList
            boards={boards}
            onDelete={handleDeleteBoard}
            onOpen={(boardId) => navigate(`/board/${boardId}`)}
          />
        )}
      </main>

      {/* Create Board Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setNewBoardTitle('');
        }}
        title="Utwórz nową tablicę"
      >
        <form onSubmit={handleCreateBoard} className="space-y-4">
          <div>
            <label htmlFor="boardTitle" className="block text-sm font-medium text-neutral-700 mb-1">
              Nazwa tablicy
            </label>
            <input
              type="text"
              id="boardTitle"
              value={newBoardTitle}
              onChange={(e) => setNewBoardTitle(e.target.value)}
              className="input-field"
              placeholder="np. Lekcja 1 - Trygonometria"
              required
              autoFocus
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setIsCreateModalOpen(false);
                setNewBoardTitle('');
              }}
            >
              Anuluj
            </Button>
            <Button type="submit">
              Utwórz tablicę
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Dashboard;
