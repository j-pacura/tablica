import { query } from '../db/connection.js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

class Board {
  static generateShareToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  static async create({ teacherId, title }) {
    const id = uuidv4();
    const shareToken = this.generateShareToken();

    await query(
      `INSERT INTO boards (id, teacher_id, title, share_token)
       VALUES ($1, $2, $3, $4)`,
      [id, teacherId, title, shareToken]
    );

    return {
      id,
      teacher_id: teacherId,
      title,
      share_token: shareToken,
      background_type: 'plain',
      background_color: '#FFFFFF',
      canvas_data: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true
    };
  }

  static async findById(boardId) {
    const result = await query(
      'SELECT * FROM boards WHERE id = $1',
      [boardId]
    );

    if (result.rows[0] && result.rows[0].canvas_data) {
      result.rows[0].canvas_data = JSON.parse(result.rows[0].canvas_data);
      result.rows[0].is_active = Boolean(result.rows[0].is_active);
    }

    return result.rows[0];
  }

  static async findByShareToken(shareToken) {
    const result = await query(
      'SELECT * FROM boards WHERE share_token = $1 AND is_active = 1',
      [shareToken]
    );

    if (result.rows[0] && result.rows[0].canvas_data) {
      result.rows[0].canvas_data = JSON.parse(result.rows[0].canvas_data);
      result.rows[0].is_active = Boolean(result.rows[0].is_active);
    }

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

    return result.rows.map(board => ({
      ...board,
      is_active: Boolean(board.is_active)
    }));
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

    await query(
      `UPDATE boards
       SET ${fields.join(', ')}
       WHERE id = $${paramCount}`,
      values
    );

    return await this.findById(boardId);
  }

  static async delete(boardId) {
    await query(
      'DELETE FROM boards WHERE id = $1',
      [boardId]
    );

    return { id: boardId };
  }

  static async setActive(boardId, isActive) {
    await query(
      'UPDATE boards SET is_active = $1 WHERE id = $2',
      [isActive ? 1 : 0, boardId]
    );

    return await this.findById(boardId);
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
