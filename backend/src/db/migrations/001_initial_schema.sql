-- Migration 001: Initial Schema
-- Create tables for teachers, boards, and board_files

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Teachers table
CREATE TABLE IF NOT EXISTS teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX idx_teachers_email ON teachers(email);

-- Boards table
CREATE TABLE IF NOT EXISTS boards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  share_token VARCHAR(64) UNIQUE NOT NULL,
  background_type VARCHAR(20) DEFAULT 'plain',
  background_color VARCHAR(7) DEFAULT '#FFFFFF',
  thumbnail_url TEXT,
  canvas_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes for better performance
CREATE INDEX idx_boards_teacher_id ON boards(teacher_id);
CREATE INDEX idx_boards_share_token ON boards(share_token);
CREATE INDEX idx_boards_updated_at ON boards(updated_at DESC);

-- Board files table (for PDF and images)
CREATE TABLE IF NOT EXISTS board_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
  file_type VARCHAR(10) NOT NULL,
  file_url TEXT NOT NULL,
  file_name VARCHAR(255),
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Create index on board_id
CREATE INDEX idx_board_files_board_id ON board_files(board_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on boards
CREATE TRIGGER update_boards_updated_at
  BEFORE UPDATE ON boards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert a test teacher (password is 'test123' hashed with bcrypt)
-- Password hash for 'test123': $2b$10$rKzQ5vJYxkL9M7yXQ5vJYxkL9M7yXQ5vJYxkL9M7yXQ5vJYxkL9M7y
-- This is just for development - remove in production
INSERT INTO teachers (email, password_hash, name)
VALUES ('test@example.com', '$2b$10$rKzQ5vJYxkL9M7yXQ5vJYuOXQ5vJYxkL9M7yXQ5vJYxkL9M7y', 'Test Teacher')
ON CONFLICT (email) DO NOTHING;
