/**
 * Centralized error handler middleware
 * Responds with JSON: { error: message, code: code, details?: [...] }
 */
function errorHandler(err, req, res, next) {
  const status = err.status || (err.code === 'VALIDATION_ERROR' ? 400 : err.code === 'CONFLICT' ? 409 : 500);
  const payload = {
    error: err.message || 'Internal Server Error',
    code: err.code || 'INTERNAL_ERROR',
  };
  if (err.details) payload.details = err.details;
  res.status(status).json(payload);
}

module.exports = errorHandler;
