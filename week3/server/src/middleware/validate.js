const { validationResult } = require('express-validator');
const { AppError } = require('../utils/errors');

function validate(req, _res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({
      field: e.path,
      message: e.msg,
    }));
    return next(new AppError('Validation failed.', 422, formatted));
  }

  next();
}

function validateWithErrors(req, _res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return _res.status(422).json({
      success: false,
      message: 'Validation failed.',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }

  next();
}

module.exports = { validate, validateWithErrors };
