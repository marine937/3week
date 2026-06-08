const { pool } = require('../config/db');
const { AppError } = require('../utils/errors');

function buildListQuery(baseSql, filters, allowedSortFields) {
  const conditions = [];
  const params = [];

  if (filters.userId) {
    conditions.push('user_id = ?');
    params.push(filters.userId);
  }

  if (filters.search) {
    conditions.push(`${filters.searchField} LIKE ?`);
    params.push(`%${filters.search}%`);
  }

  if (filters.status) {
    conditions.push('status = ?');
    params.push(filters.status);
  }

  if (filters.projectId) {
    conditions.push('project_id = ?');
    params.push(filters.projectId);
  }

  if (filters.taskId) {
    conditions.push('task_id = ?');
    params.push(filters.taskId);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sortField = allowedSortFields.includes(filters.sortBy)
    ? filters.sortBy
    : allowedSortFields[0];
  const sortOrder = filters.sortOrder === 'asc' ? 'ASC' : 'DESC';
  const limit = Math.min(Math.max(Number(filters.limit) || 50, 1), 100);
  const offset = Math.max(Number(filters.offset) || 0, 0);

  const sql = `${baseSql} ${where} ORDER BY ${sortField} ${sortOrder} LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  return { sql, params, limit, offset };
}

async function listProjects(req, res, next) {
  try {
    const filters = {
      userId: req.user.id,
      search: req.query.search,
      searchField: 'name',
      status: req.query.status,
      sortBy: req.query.sortBy || 'created_at',
      sortOrder: req.query.sortOrder,
      limit: req.query.limit,
      offset: req.query.offset,
    };

    const { sql, params } = buildListQuery(
      'SELECT * FROM projects',
      filters,
      ['name', 'status', 'created_at', 'updated_at']
    );

    const [rows] = await pool.execute(sql, params);

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM projects WHERE user_id = ?${
        filters.search ? ' AND name LIKE ?' : ''
      }${filters.status ? ' AND status = ?' : ''}`,
      [
        req.user.id,
        ...(filters.search ? [`%${filters.search}%`] : []),
        ...(filters.status ? [filters.status] : []),
      ]
    );

    res.json({
      success: true,
      data: rows,
      meta: { total: countRows[0].total, limit: params.at(-2), offset: params.at(-1) },
    });
  } catch (err) {
    next(err);
  }
}

async function getProject(req, res, next) {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM projects WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!rows[0]) throw new AppError('Project not found.', 404);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function createProject(req, res, next) {
  try {
    const { name, description, status } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO projects (user_id, name, description, status) VALUES (?, ?, ?, ?)',
      [req.user.id, name, description || null, status || 'planning']
    );

    const [rows] = await pool.execute('SELECT * FROM projects WHERE id = ?', [
      result.insertId,
    ]);

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function updateProject(req, res, next) {
  try {
    const { name, description, status } = req.body;
    const [result] = await pool.execute(
      `UPDATE projects SET name = ?, description = ?, status = ?
       WHERE id = ? AND user_id = ?`,
      [name, description || null, status, req.params.id, req.user.id]
    );

    if (!result.affectedRows) throw new AppError('Project not found.', 404);

    const [rows] = await pool.execute('SELECT * FROM projects WHERE id = ?', [
      req.params.id,
    ]);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function deleteProject(req, res, next) {
  try {
    const [result] = await pool.execute(
      'DELETE FROM projects WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!result.affectedRows) throw new AppError('Project not found.', 404);
    res.json({ success: true, message: 'Project deleted.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
};
