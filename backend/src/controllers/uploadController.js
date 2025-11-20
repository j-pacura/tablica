import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
  const allowedPdfTypes = /pdf/;

  const extname = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype.toLowerCase();

  if (file.fieldname === 'image') {
    const isValidImage = allowedImageTypes.test(extname.substring(1)) &&
                         allowedImageTypes.test(mimetype.split('/')[1]);
    if (isValidImage) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'));
    }
  } else if (file.fieldname === 'pdf') {
    const isValidPdf = allowedPdfTypes.test(extname.substring(1)) &&
                       mimetype === 'application/pdf';
    if (isValidPdf) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  } else {
    cb(new Error('Invalid field name'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB for images
  }
});

export const uploadPdf = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB for PDFs
  }
});

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded'
      });
    }

    const fileUrl = process.env.STORAGE_TYPE === 'local'
      ? `/uploads/${req.file.filename}`
      : req.file.path; // For S3, this would be the S3 URL

    res.status(200).json({
      message: 'Image uploaded successfully',
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size
    });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({
      error: 'Failed to upload image',
      details: error.message
    });
  }
};

export const uploadPdfFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No PDF file uploaded'
      });
    }

    // TODO: Implement PDF page extraction using pdf-lib or pdf.js
    // For now, just return the PDF URL
    // In the future, this should:
    // 1. Parse PDF
    // 2. Extract each page as an image
    // 3. Upload images to storage
    // 4. Return array of page URLs

    const fileUrl = process.env.STORAGE_TYPE === 'local'
      ? `/uploads/${req.file.filename}`
      : req.file.path;

    res.status(200).json({
      message: 'PDF uploaded successfully',
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size,
      // TODO: Add pages array once PDF processing is implemented
      pages: []
    });
  } catch (error) {
    console.error('Upload PDF error:', error);
    res.status(500).json({
      error: 'Failed to upload PDF',
      details: error.message
    });
  }
};
