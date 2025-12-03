const ErrorResponse = require('../helpers/ErrorResponse');

module.exports = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles]; 
  }

  return (req, res, next) => {
    if (!req.account || !roles.includes(req.account.role)) {
      throw new ErrorResponse(403, 'Bạn không có quyền truy cập');
    }

    next();
  };
};
