const path = require('path');
const fs = require('fs');
const { pool } = require('../config/db');
const { AppError } = require('../utils/errors');
const { uploadDir } = require('../middleware/upload');

async function verifyResourceAccess(userId, resourceType, resourceId) {
  if (resourceType === 'user') {
    if (Number(resourceId) !== userId) {
      throw new AppError('Access denied.', 403);
    }
    return;
  }

  if (resourceType === 'project') {
    const [rows] = await pool.execute(
      'SELECT id FROM projects WHERE id = ? AND user_id = ?',
      [resourceId, userId]
    );
    if (!rows[0]) throw new AppError('Project not found.', 404);
    return;
  }

  if (resourceType === 'task') {
    const [rows] = await pool.execute(
      'SELECT id FROM tasks WHERE id = ? AND user_id = ?',
      [resourceId, userId]
    );
    if (!rows[0]) throw new AppError('Task not found.', 404);
    return;
  }

  throw new AppError('Invalid resource type.', 400);
}

async function uploadFile(req, res, next) {
  try {
    if (!req.file) throw new AppError('No file uploaded.', 400);

    const { resourceType, resourceId } = req.body;
    await verifyResourceAccess(req.user.id, resourceType, Number(resourceId));

    const [result] = await pool.execute(
      `INSERT INTO files (user_id, resource_type, resource_id, filename, original_name, mime_type, size)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        resourceType,
        resourceId,
        req.file.filename,
        req.file.originalname,
        req.file.mimetype,
        req.file.size,
      ]
    );

    if (resourceType === 'user') {
      const avatarUrl = `/api/files/${req.file.filename}`;
      await pool.execute('UPDATE users SET avatar_url = ? WHERE id = ?', [
        avatarUrl,
        req.user.id,
      ]);
    }

    res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: `/api/files/${req.file.filename}`,
      },
    });
  } catch (err) {
    if (req.file) {
      fs.unlink(path.join(uploadDir, req.file.filename), () => {});
    }
    next(err);
  }
}

async function listFiles(req, res, next) {
  try {
    const { resourceType, resourceId } = req.query;
    if (!resourceType || !resourceId) {
      throw new AppError('resourceType and resourceId are required.', 400);
    }

    await verifyResourceAccess(req.user.id, resourceType, Number(resourceId));

    const [rows] = await pool.execute(
      `SELECT id, filename, original_name, mime_type, size, created_at
       FROM files
       WHERE user_id = ? AND resource_type = ? AND resource_id = ?
       ORDER BY created_at DESC`,
      [req.user.id, resourceType, resourceId]
    );

    const data = rows.map((f) => ({
      ...f,
      url: `/api/files/${f.filename}`,
    }));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function deleteFile(req, res, next) {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM files WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    const file = rows[0];
    if (!file) throw new AppError('File not found.', 404);

    const filePath = path.join(uploadDir, file.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await pool.execute('DELETE FROM files WHERE id = ?', [file.id]);

    res.json({ success: true, message: 'File deleted.' });
  } catch (err) {
    next(err);
  }
}

function serveFile(req, res, next) {
  try {
    const filePath = path.join(uploadDir, req.params.filename);
    if (!fs.existsSync(filePath)) {
      throw new AppError('File not found.', 404);
    }
    res.sendFile(filePath);
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadFile, listFiles, deleteFile, serveFile };
