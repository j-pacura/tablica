-- Migration 001: Initial Schema for SQLite
-- Create tables for teachers, boards, and board_files

-- Teachers table
CREATE TABLE IF NOT EXISTS teachers (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_teachers_email ON teachers(email);

-- Boards table
CREATE TABLE IF NOT EXISTS boards (
  id TEXT PRIMARY KEY,
  teacher_id TEXT REFERENCES teachers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  share_token TEXT UNIQUE NOT NULL,
  background_type TEXT DEFAULT 'plain',
  background_color TEXT DEFAULT '#FFFFFF',
  thumbnail_url TEXT,
  canvas_data TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  is_active INTEGER DEFAULT 1
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_boards_teacher_id ON boards(teacher_id);
CREATE INDEX IF NOT EXISTS idx_boards_share_token ON boards(share_token);
CREATE INDEX IF NOT EXISTS idx_boards_updated_at ON boards(updated_at DESC);

-- Board files table (for PDF and images)
CREATE TABLE IF NOT EXISTS board_files (
  id TEXT PRIMARY KEY,
  board_id TEXT REFERENCES boards(id) ON DELETE CASCADE,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT,
  uploaded_at TEXT DEFAULT (datetime('now'))
);

-- Create index on board_id
CREATE INDEX IF NOT EXISTS idx_board_files_board_id ON board_files(board_id);

-- Trigger to automatically update updated_at on boards
CREATE TRIGGER IF NOT EXISTS update_boards_updated_at
  AFTER UPDATE ON boards
  FOR EACH ROW
BEGIN
  UPDATE boards SET updated_at = datetime('now') WHERE id = OLD.id;
END;
