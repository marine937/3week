const { pool } = require('../config/db');
const { AppError } = require('../utils/errors');

async function verifyTaskOwnership(taskId, userId) {
  const [rows] = await pool.execute(
    'SELECT id FROM tasks WHERE id = ? AND user_id = ?',
    [taskId, userId]
  );
  if (!rows[0]) throw new AppError('Task not found.', 404);
}

async function listComments(req, res, next) {
  try {
    const conditions = ['c.user_id = ?'];
    const params = [req.user.id];

    if (req.query.search) {
      conditions.push('c.body LIKE ?');
      params.push(`%${req.query.search}%`);
    }
    if (req.query.taskId) {
      conditions.push('c.task_id = ?');
      params.push(req.query.taskId);
    }

    const sortBy = ['created_at', 'updated_at'].includes(req.query.sortBy)
      ? req.query.sortBy
      : 'created_at';
    const sortOrder = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC';
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    const where = conditions.join(' AND ');
    const sql = `
      SELECT c.*, t.title AS task_title
      FROM comments c
      JOIN tasks t ON t.id = c.task_id
      WHERE ${where}
      ORDER BY c.${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;
    params.push(limit, offset);

    const [rows] = await pool.execute(sql, params);

    const countParams = params.slice(0, -2);
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM comments c WHERE ${where}`,
      countParams
    );

    res.json({
      success: true,
      data: rows,
      meta: { total: countRows[0].total, limit, offset },
    });
  } catch (err) {
    next(err);
  }
}

async function getComment(req, res, next) {
  try {
    const [rows] = await pool.execute(
      `SELECT c.*, t.title AS task_title
       FROM comments c
       JOIN tasks t ON t.id = c.task_id
       WHERE c.id = ? AND c.user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (!rows[0]) throw new AppError('Comment not found.', 404);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function createComment(req, res, next) {
  try {
    const { taskId, body } = req.body;
    await verifyTaskOwnership(taskId, req.user.id);

    const [result] = await pool.execute(
      'INSERT INTO comments (task_id, user_id, body) VALUES (?, ?, ?)',
      [taskId, req.user.id, body]
    );

    const [rows] = await pool.execute(
      `SELECT c.*, t.title AS task_title
       FROM comments c JOIN tasks t ON t.id = c.task_id WHERE c.id = ?`,
      [result.insertId]
    );

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function updateComment(req, res, next) {
  try {
    const { body } = req.body;

    const [result] = await pool.execute(
      'UPDATE comments SET body = ? WHERE id = ? AND user_id = ?',
      [body, req.params.id, req.user.id]
    );

    if (!result.affectedRows) throw new AppError('Comment not found.', 404);

    const [rows] = await pool.execute(
      `SELECT c.*, t.title AS task_title
       FROM comments c JOIN tasks t ON t.id = c.task_id WHERE c.id = ?`,
      [req.params.id]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function deleteComment(req, res, next) {
  try {
    const [result] = await pool.execute(
      'DELETE FROM comments WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!result.affectedRows) throw new AppError('Comment not found.', 404);
    res.json({ success: true, message: 'Comment deleted.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listComments,
  getComment,
  createComment,
  updateComment,
  deleteComment,
};
