import { v4 as uuidv4 } from 'uuid';

// Store active users per board
const boardUsers = new Map(); // boardId -> Set of user objects

export const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.id}`);

    // Join board room
    socket.on('join-board', ({ boardId, userName }) => {
      const userId = socket.id;
      const userColor = generateUserColor();

      // Join the room
      socket.join(boardId);

      // Store user info
      const user = {
        id: userId,
        socketId: socket.id,
        name: userName || `User ${socket.id.substring(0, 4)}`,
        color: userColor,
        boardId
      };

      // Add user to board users
      if (!boardUsers.has(boardId)) {
        boardUsers.set(boardId, new Set());
      }
      boardUsers.get(boardId).add(user);

      // Notify others in the room
      socket.to(boardId).emit('user-joined', {
        userId: user.id,
        name: user.name,
        color: user.color
      });

      // Send current users to the new user
      const currentUsers = Array.from(boardUsers.get(boardId) || []).map(u => ({
        userId: u.id,
        name: u.name,
        color: u.color
      }));

      socket.emit('board-joined', {
        userId: user.id,
        activeUsers: currentUsers
      });

      console.log(`User ${user.name} joined board ${boardId}`);
    });

    // Drawing events
    socket.on('draw-start', (data) => {
      socket.to(data.boardId).emit('remote-draw-start', {
        ...data,
        userId: socket.id
      });
    });

    socket.on('draw-move', (data) => {
      socket.to(data.boardId).emit('remote-draw-move', {
        ...data,
        userId: socket.id
      });
    });

    socket.on('draw-end', (data) => {
      socket.to(data.boardId).emit('remote-draw-end', {
        ...data,
        userId: socket.id
      });
    });

    // Object manipulation events
    socket.on('add-object', (data) => {
      socket.to(data.boardId).emit('object-added', {
        ...data,
        userId: socket.id
      });
    });

    socket.on('modify-object', (data) => {
      socket.to(data.boardId).emit('object-modified', {
        ...data,
        userId: socket.id
      });
    });

    socket.on('delete-object', (data) => {
      socket.to(data.boardId).emit('object-deleted', {
        ...data,
        userId: socket.id
      });
    });

    socket.on('clear-board', (data) => {
      socket.to(data.boardId).emit('board-cleared', {
        userId: socket.id
      });
    });

    // Cursor movement
    socket.on('cursor-move', (data) => {
      socket.to(data.boardId).emit('remote-cursor', {
        userId: socket.id,
        x: data.x,
        y: data.y
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.id}`);

      // Find and remove user from all boards
      for (const [boardId, users] of boardUsers.entries()) {
        const user = Array.from(users).find(u => u.socketId === socket.id);
        if (user) {
          users.delete(user);

          // Notify others
          socket.to(boardId).emit('user-left', {
            userId: user.id
          });

          // Clean up empty board
          if (users.size === 0) {
            boardUsers.delete(boardId);
          }

          console.log(`User ${user.name} left board ${boardId}`);
        }
      }
    });
  });
};

// Helper function to generate random user colors
function generateUserColor() {
  const colors = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#FFA07A', // Light Salmon
    '#98D8C8', // Mint
    '#F7DC6F', // Yellow
    '#BB8FCE', // Purple
    '#85C1E2', // Sky Blue
    '#F8B88B', // Peach
    '#ABEBC6'  // Light Green
  ];

  return colors[Math.floor(Math.random() * colors.length)];
}
