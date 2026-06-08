const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('../config/db');
const { AppError } = require('../utils/errors');
const { sendPasswordResetEmail } = require('../utils/email');

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    if (existing.length) {
      throw new AppError('Email is already registered.', 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, passwordHash]
    );

    const user = { id: result.insertId, name, email };
    const token = signToken(user);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: { user, token },
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const [rows] = await pool.execute(
      'SELECT id, name, email, password_hash, avatar_url FROM users WHERE email = ?',
      [email]
    );
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw new AppError('Invalid email or password.', 401);
    }

    const token = signToken(user);
    const { password_hash, ...safeUser } = user;

    res.json({
      success: true,
      message: 'Logged in successfully.',
      data: { user: safeUser, token },
    });
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res, next) {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, email, avatar_url, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!rows[0]) throw new AppError('User not found.', 404);

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;

    const [rows] = await pool.execute(
      'SELECT id, email FROM users WHERE email = ?',
      [email]
    );
    const user = rows[0];

    // Always return success to prevent email enumeration
    const genericResponse = {
      success: true,
      message: 'If that email exists, a reset link has been sent.',
    };

    if (!user) {
      return res.json(genericResponse);
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await pool.execute(
      'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [user.id, tokenHash, expiresAt]
    );

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password?token=${rawToken}`;
    const emailResult = await sendPasswordResetEmail(user.email, resetUrl);

    res.json({
      ...genericResponse,
      ...(emailResult.devMode && process.env.NODE_ENV === 'development'
        ? { devResetUrl: resetUrl }
        : {}),
    });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const [rows] = await pool.execute(
      `SELECT prt.id, prt.user_id
       FROM password_reset_tokens prt
       WHERE prt.token_hash = ?
         AND prt.used_at IS NULL
         AND prt.expires_at > NOW()`,
      [tokenHash]
    );

    const resetRecord = rows[0];
    if (!resetRecord) {
      throw new AppError('Invalid or expired reset token.', 400);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [
      passwordHash,
      resetRecord.user_id,
    ]);
    await pool.execute(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?',
      [resetRecord.id]
    );

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
};
