import express from 'express';
import {
  createBoard,
  getBoards,
  getBoard,
  getBoardByToken,
  updateBoard,
  deleteBoard
} from '../controllers/boardController.js';
import { authenticateToken } from '../middleware/auth.js';
import {
  createBoardValidation,
  updateBoardValidation,
  uuidValidation
} from '../middleware/validation.js';

const router = express.Router();

// Public route - access board by share token
router.get('/shared/:token', getBoardByToken);

// Protected routes - require authentication
router.post('/', authenticateToken, createBoardValidation, createBoard);
router.get('/', authenticateToken, getBoards);
router.get('/:id', authenticateToken, uuidValidation, getBoard);
router.patch('/:id', authenticateToken, uuidValidation, updateBoardValidation, updateBoard);
router.delete('/:id', authenticateToken, uuidValidation, deleteBoard);

export default router;
