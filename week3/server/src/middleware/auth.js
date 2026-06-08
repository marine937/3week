const jwt = require('jsonwebtoken');
const { AppError } = require('../utils/errors');

function authenticate(req, _res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return next(new AppError('Authentication required.', 401));
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, email: payload.email, name: payload.name };
    next();
  } catch {
    next(new AppError('Invalid or expired token.', 401));
  }
}

module.exports = { authenticate };
