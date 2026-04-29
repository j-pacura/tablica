import { query } from '../db/connection.js';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const SALT_ROUNDS = 10;

class Teacher {
  static async create({ email, password, name }) {
    const id = uuidv4();
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await query(
      `INSERT INTO teachers (id, email, password_hash, name)
       VALUES ($1, $2, $3, $4)`,
      [id, email, passwordHash, name]
    );

    return {
      id,
      email,
      name,
      created_at: new Date().toISOString()
    };
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

    await query(
      `UPDATE teachers
       SET password_hash = $1
       WHERE id = $2`,
      [passwordHash, teacherId]
    );

    const result = await query(
      'SELECT id, email, name FROM teachers WHERE id = $1',
      [teacherId]
    );

    return result.rows[0];
  }

  static async delete(teacherId) {
    const result = await query(
      'DELETE FROM teachers WHERE id = $1',
      [teacherId]
    );

    return { id: teacherId };
  }
}

export default Teacher;
