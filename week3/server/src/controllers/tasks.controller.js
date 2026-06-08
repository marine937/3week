const { pool } = require('../config/db');
const { AppError } = require('../utils/errors');

async function verifyProjectOwnership(projectId, userId) {
  const [rows] = await pool.execute(
    'SELECT id FROM projects WHERE id = ? AND user_id = ?',
    [projectId, userId]
  );
  if (!rows[0]) throw new AppError('Project not found.', 404);
}

async function listTasks(req, res, next) {
  try {
    const conditions = ['t.user_id = ?'];
    const params = [req.user.id];

    if (req.query.search) {
      conditions.push('t.title LIKE ?');
      params.push(`%${req.query.search}%`);
    }
    if (req.query.status) {
      conditions.push('t.status = ?');
      params.push(req.query.status);
    }
    if (req.query.priority) {
      conditions.push('t.priority = ?');
      params.push(req.query.priority);
    }
    if (req.query.projectId) {
      conditions.push('t.project_id = ?');
      params.push(req.query.projectId);
    }

    const sortBy = ['title', 'status', 'priority', 'due_date', 'created_at'].includes(
      req.query.sortBy
    )
      ? req.query.sortBy
      : 'created_at';
    const sortOrder = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC';
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    const where = conditions.join(' AND ');
    const sql = `
      SELECT t.*, p.name AS project_name
      FROM tasks t
      JOIN projects p ON p.id = t.project_id
      WHERE ${where}
      ORDER BY t.${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;
    params.push(limit, offset);

    const [rows] = await pool.execute(sql, params);

    const countParams = params.slice(0, -2);
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM tasks t WHERE ${where}`,
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

async function getTask(req, res, next) {
  try {
    const [rows] = await pool.execute(
      `SELECT t.*, p.name AS project_name
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       WHERE t.id = ? AND t.user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (!rows[0]) throw new AppError('Task not found.', 404);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function createTask(req, res, next) {
  try {
    const { projectId, title, description, status, priority, dueDate } = req.body;
    await verifyProjectOwnership(projectId, req.user.id);

    const [result] = await pool.execute(
      `INSERT INTO tasks (project_id, user_id, title, description, status, priority, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        projectId,
        req.user.id,
        title,
        description || null,
        status || 'todo',
        priority || 'medium',
        dueDate || null,
      ]
    );

    const [rows] = await pool.execute(
      `SELECT t.*, p.name AS project_name
       FROM tasks t JOIN projects p ON p.id = t.project_id WHERE t.id = ?`,
      [result.insertId]
    );

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function updateTask(req, res, next) {
  try {
    const { projectId, title, description, status, priority, dueDate } = req.body;

    if (projectId) await verifyProjectOwnership(projectId, req.user.id);

    const [result] = await pool.execute(
      `UPDATE tasks SET
         project_id = COALESCE(?, project_id),
         title = COALESCE(?, title),
         description = COALESCE(?, description),
         status = COALESCE(?, status),
         priority = COALESCE(?, priority),
         due_date = COALESCE(?, due_date)
       WHERE id = ? AND user_id = ?`,
      [
        projectId ?? null,
        title ?? null,
        description ?? null,
        status ?? null,
        priority ?? null,
        dueDate ?? null,
        req.params.id,
        req.user.id,
      ]
    );

    if (!result.affectedRows) throw new AppError('Task not found.', 404);

    const [rows] = await pool.execute(
      `SELECT t.*, p.name AS project_name
       FROM tasks t JOIN projects p ON p.id = t.project_id WHERE t.id = ?`,
      [req.params.id]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function deleteTask(req, res, next) {
  try {
    const [result] = await pool.execute(
      'DELETE FROM tasks WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!result.affectedRows) throw new AppError('Task not found.', 404);
    res.json({ success: true, message: 'Task deleted.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
};
