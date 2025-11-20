import React, { useState } from 'react';
import Button from '../UI/Button';

const BoardCard = ({ board, onDelete, onOpen }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/shared/${board.share_token}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card hover:shadow-lg transition-shadow duration-200 relative">
      {/* Thumbnail or placeholder */}
      <div className="aspect-video bg-neutral-100 rounded-lg mb-4 flex items-center justify-center">
        {board.thumbnail_url ? (
          <img
            src={board.thumbnail_url}
            alt={board.title}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <svg
            className="h-16 w-16 text-neutral-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        )}
      </div>

      {/* Board Info */}
      <h3 className="text-lg font-semibold text-neutral-800 mb-2 truncate">
        {board.title}
      </h3>
      <p className="text-xs text-neutral-500 mb-4">
        Aktualizacja: {formatDate(board.updated_at)}
      </p>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          onClick={() => onOpen(board.id)}
          className="flex-1"
        >
          Otwórz
        </Button>
        <Button
          variant="secondary"
          onClick={handleCopyLink}
          className="flex-1"
        >
          {copied ? 'Skopiowano!' : 'Kopiuj link'}
        </Button>
      </div>

      {/* Delete button */}
      <button
        onClick={() => onDelete(board.id)}
        className="absolute top-2 right-2 p-2 text-neutral-400 hover:text-red-500 transition-colors"
        title="Usuń tablicę"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>
    </div>
  );
};

export default BoardCard;
