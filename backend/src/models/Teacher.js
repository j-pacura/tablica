import { query } from '../db/connection.js';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

class Teacher {
  static async create({ email, password, name }) {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await query(
      `INSERT INTO teachers (email, password_hash, name)
       VALUES ($1, $2, $3)
       RETURNING id, email, name, created_at`,
      [email, passwordHash, name]
    );

    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await query(
      'SELECT * FROM teachers WHERE email = $1',
      [email]
    );

    return result.rows[0];
  }

  static async findById(id) {
    const result = await query(
      'SELECT id, email, name, created_at FROM teachers WHERE id = $1',
      [id]
    );

    return result.rows[0];
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updatePassword(teacherId, newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    const result = await query(
      `UPDATE teachers
       SET password_hash = $1
       WHERE id = $2
       RETURNING id, email, name`,
      [passwordHash, teacherId]
    );

    return result.rows[0];
  }

  static async delete(teacherId) {
    const result = await query(
      'DELETE FROM teachers WHERE id = $1 RETURNING id',
      [teacherId]
    );

    return result.rows[0];
  }
}

export default Teacher;
