import Board from '../models/Board.js';

export const createBoard = async (req, res) => {
  try {
    const { title } = req.body;
    const teacherId = req.teacher.id;

    const board = await Board.create({ teacherId, title });

    res.status(201).json({
      message: 'Board created successfully',
      board: {
        id: board.id,
        title: board.title,
        share_token: board.share_token,
        created_at: board.created_at,
        updated_at: board.updated_at
      }
    });
  } catch (error) {
    console.error('Create board error:', error);
    res.status(500).json({
      error: 'Failed to create board',
      details: error.message
    });
  }
};

export const getBoards = async (req, res) => {
  try {
    const teacherId = req.teacher.id;
    const boards = await Board.findByTeacherId(teacherId);

    res.json({
      boards: boards.map(board => ({
        id: board.id,
        title: board.title,
        thumbnail_url: board.thumbnail_url,
        updated_at: board.updated_at,
        created_at: board.created_at,
        share_token: board.share_token,
        is_active: board.is_active
      }))
    });
  } catch (error) {
    console.error('Get boards error:', error);
    res.status(500).json({
      error: 'Failed to fetch boards'
    });
  }
};

export const getBoard = async (req, res) => {
  try {
    const { id } = req.params;

    const board = await Board.findById(id);

    if (!board) {
      return res.status(404).json({
        error: 'Board not found'
      });
    }

    // If request is from authenticated teacher, check ownership
    if (req.teacher) {
      const isOwner = await Board.checkOwnership(id, req.teacher.id);
      if (!isOwner) {
        return res.status(403).json({
          error: 'Access denied. You do not own this board.'
        });
      }
    }

    res.json({
      board: {
        id: board.id,
        title: board.title,
        background_type: board.background_type,
        background_color: board.background_color,
        canvas_data: board.canvas_data,
        updated_at: board.updated_at,
        created_at: board.created_at
      }
    });
  } catch (error) {
    console.error('Get board error:', error);
    res.status(500).json({
      error: 'Failed to fetch board'
    });
  }
};

export const getBoardByToken = async (req, res) => {
  try {
    const { token } = req.params;

    const board = await Board.findByShareToken(token);

    if (!board) {
      return res.status(404).json({
        error: 'Board not found or inactive'
      });
    }

    res.json({
      board: {
        id: board.id,
        title: board.title,
        background_type: board.background_type,
        background_color: board.background_color,
        canvas_data: board.canvas_data,
        updated_at: board.updated_at
      }
    });
  } catch (error) {
    console.error('Get board by token error:', error);
    res.status(500).json({
      error: 'Failed to fetch board'
    });
  }
};

export const updateBoard = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check ownership
    const isOwner = await Board.checkOwnership(id, req.teacher.id);
    if (!isOwner) {
      return res.status(403).json({
        error: 'Access denied. You do not own this board.'
      });
    }

    const board = await Board.update(id, updates);

    if (!board) {
      return res.status(404).json({
        error: 'Board not found'
      });
    }

    res.json({
      message: 'Board updated successfully',
      board: {
        id: board.id,
        title: board.title,
        updated_at: board.updated_at
      }
    });
  } catch (error) {
    console.error('Update board error:', error);
    res.status(500).json({
      error: 'Failed to update board',
      details: error.message
    });
  }
};

export const deleteBoard = async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership
    const isOwner = await Board.checkOwnership(id, req.teacher.id);
    if (!isOwner) {
      return res.status(403).json({
        error: 'Access denied. You do not own this board.'
      });
    }

    const deletedBoard = await Board.delete(id);

    if (!deletedBoard) {
      return res.status(404).json({
        error: 'Board not found'
      });
    }

    res.json({
      message: 'Board deleted successfully',
      id: deletedBoard.id
    });
  } catch (error) {
    console.error('Delete board error:', error);
    res.status(500).json({
      error: 'Failed to delete board'
    });
  }
};
