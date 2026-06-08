class AppError extends Error {
  constructor(message, status = 400, errors = null) {
    super(message);
    this.status = status;
    this.name = 'AppError';
    this.errors = errors;
  }
}

module.exports = { AppError };
