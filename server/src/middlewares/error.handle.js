module.exports = (err, req, res, next) => {
  let error = { ...err };

  if (err?.name === 'CastError') {
    error.statusCode = 404;
    error.message = 'Không tìm thấy tài nguyên';
  }

  if (err.statusCode === 400) {
    error.statusCode = 400;
    error.message = err.message;
  }

  if (err.statusCode === 401) {
    error.statusCode = 401;
    error.message = err.message;
  }

  if (err.statusCode === 403) {
    error.statusCode = 403;
    error.message = err.message;
  }

  if (err.statusCode === 404) {
    error.statusCode = 404;
    error.message = err.message;
  }

  if (err?.code === 11000) {
    error.statusCode = 400;
    error.message = 'Tài nguyên dữ liệu đã tồn tại';
  }

  const statusCode = error.statusCode || 500;
  const message =
    error.message || err.message || 'Lỗi Server. Hãy thử lại sau.';

  return res.status(statusCode).json({
    statusCode,
    message,
  });
};
