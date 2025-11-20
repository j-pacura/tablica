import express from 'express';
import { upload, uploadPdf, uploadImage, uploadPdfFile } from '../controllers/uploadController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All upload routes require authentication
router.post('/image', authenticateToken, upload.single('image'), uploadImage);
router.post('/pdf', authenticateToken, uploadPdf.single('pdf'), uploadPdfFile);

export default router;
