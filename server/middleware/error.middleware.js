const errorMiddleware = (err, req, res, next) => {
  // Log in development
  if (process.env.NODE_ENV !== 'production') {
    console.error('❌', req.method, req.path, '→', err.message);
  }

  // Mongoose ValidationError (field-level)
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => {
      // Surface the actual bad value for ObjectId cast failures
      if (e.kind === 'ObjectId' || e.kind === 'objectid') {
        return `Invalid value for field "${e.path}". Expected a valid ID.`;
      }
      return e.message;
    });
    return res.status(400).json({ success: false, message: messages.join('. ') });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue ? err.keyValue[field] : '';
    return res.status(400).json({
      success: false,
      message: `${field} '${value}' already exists`,
    });
  }

  // Mongoose CastError (e.g. invalid ObjectId in query param)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid value for "${err.path}": "${err.value}". Expected a valid ID.`,
    });
  }

  // BSON errors (invalid ObjectId strings)
  if (err.name === 'BSONError' || err.name === 'BSONTypeError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format provided',
    });
  }

  // Multer file size
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File too large. Maximum size is 50MB.' });
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({ success: false, message: 'Too many files. Maximum is 20.' });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired. Please sign in again.' });
  }

  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorMiddleware;
