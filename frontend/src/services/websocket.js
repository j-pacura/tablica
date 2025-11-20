import { io } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.boardId = null;
    this.listeners = new Map();
  }

  connect(boardId, userName) {
    if (this.socket?.connected) {
      this.disconnect();
    }

    this.boardId = boardId;
    this.socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.socket.emit('join-board', { boardId, userName });
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    // Board events
    this.socket.on('board-joined', (data) => {
      this.emit('board-joined', data);
    });

    this.socket.on('user-joined', (data) => {
      this.emit('user-joined', data);
    });

    this.socket.on('user-left', (data) => {
      this.emit('user-left', data);
    });

    // Drawing events
    this.socket.on('remote-draw-start', (data) => {
      this.emit('remote-draw-start', data);
    });

    this.socket.on('remote-draw-move', (data) => {
      this.emit('remote-draw-move', data);
    });

    this.socket.on('remote-draw-end', (data) => {
      this.emit('remote-draw-end', data);
    });

    // Object events
    this.socket.on('object-added', (data) => {
      this.emit('object-added', data);
    });

    this.socket.on('object-modified', (data) => {
      this.emit('object-modified', data);
    });

    this.socket.on('object-deleted', (data) => {
      this.emit('object-deleted', data);
    });

    this.socket.on('board-cleared', (data) => {
      this.emit('board-cleared', data);
    });

    // Cursor events
    this.socket.on('remote-cursor', (data) => {
      this.emit('remote-cursor', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.boardId = null;
      this.listeners.clear();
    }
  }

  // Event emitter pattern
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((callback) => callback(data));
    }
  }

  // Send events to server
  sendDrawStart(data) {
    this.socket?.emit('draw-start', { ...data, boardId: this.boardId });
  }

  sendDrawMove(data) {
    this.socket?.emit('draw-move', { ...data, boardId: this.boardId });
  }

  sendDrawEnd(data) {
    this.socket?.emit('draw-end', { ...data, boardId: this.boardId });
  }

  sendAddObject(data) {
    this.socket?.emit('add-object', { ...data, boardId: this.boardId });
  }

  sendModifyObject(data) {
    this.socket?.emit('modify-object', { ...data, boardId: this.boardId });
  }

  sendDeleteObject(data) {
    this.socket?.emit('delete-object', { ...data, boardId: this.boardId });
  }

  sendClearBoard() {
    this.socket?.emit('clear-board', { boardId: this.boardId });
  }

  sendCursorMove(x, y) {
    this.socket?.emit('cursor-move', { boardId: this.boardId, x, y });
  }
}

// Singleton instance
const wsService = new WebSocketService();
export default wsService;
