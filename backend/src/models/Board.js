import { query } from '../db/connection.js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

class Board {
  static generateShareToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  static async create({ teacherId, title }) {
    const shareToken = this.generateShareToken();

    const result = await query(
      `INSERT INTO boards (teacher_id, title, share_token)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [teacherId, title, shareToken]
    );

    return result.rows[0];
  }

  static async findById(boardId) {
    const result = await query(
      'SELECT * FROM boards WHERE id = $1',
      [boardId]
    );

    return result.rows[0];
  }

  static async findByShareToken(shareToken) {
    const result = await query(
      'SELECT * FROM boards WHERE share_token = $1 AND is_active = true',
      [shareToken]
    );

    return result.rows[0];
  }

  static async findByTeacherId(teacherId) {
    const result = await query(
      `SELECT id, title, thumbnail_url, updated_at, created_at, share_token, is_active
       FROM boards
       WHERE teacher_id = $1
       ORDER BY updated_at DESC`,
      [teacherId]
    );

    return result.rows;
  }

  static async update(boardId, updates) {
    const allowedFields = ['title', 'background_type', 'background_color', 'thumbnail_url', 'canvas_data'];
    const fields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = $${paramCount}`);
        values.push(key === 'canvas_data' ? JSON.stringify(value) : value);
        paramCount++;
      }
    }

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(boardId);

    const result = await query(
      `UPDATE boards
       SET ${fields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    return result.rows[0];
  }

  static async delete(boardId) {
    const result = await query(
      'DELETE FROM boards WHERE id = $1 RETURNING id',
      [boardId]
    );

    return result.rows[0];
  }

  static async setActive(boardId, isActive) {
    const result = await query(
      'UPDATE boards SET is_active = $1 WHERE id = $2 RETURNING *',
      [isActive, boardId]
    );

    return result.rows[0];
  }

  // Check if teacher owns the board
  static async checkOwnership(boardId, teacherId) {
    const result = await query(
      'SELECT id FROM boards WHERE id = $1 AND teacher_id = $2',
      [boardId, teacherId]
    );

    return result.rows.length > 0;
  }
}

export default Board;
