// Global Error Handler & 404 Handler for foodBridge-AI API

const notFound = (req, res, next) => {
  const error = new Error(`Resource not found - [${req.method}] ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  console.error(`[API Error] [${req.method}] ${req.originalUrl} -`, err.message);

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = {
  notFound,
  errorHandler,
};

