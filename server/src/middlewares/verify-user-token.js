require('dotenv').config();
const jwt = require('jsonwebtoken');
const UserModel = require('../models/user-model');
const ErrorResponse = require('../helpers/ErrorResponse');

const verifyUserToken = async (req, res, next) => {
  try {
    const { authorization } = req.headers;

    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new ErrorResponse(401, 'Hãy đăng nhập để tiếp tục');
    }

    const token = authorization.split(' ')[1];

    const decode = jwt.verify(token, process.env.JWT_SECRET);

    const user = await UserModel.findById(decode._id);

    if (!user) {
      throw new ErrorResponse(401, 'Hãy đăng nhập để tiếp tục');
    }

    if (user.status !== 'active') {
      throw new ErrorResponse(403, 'Tài khoản của bạn đã bị vô hiệu hóa');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      throw new ErrorResponse(401, 'Token không hợp lệ hoặc đã hết hạn');
    }
    throw error;
  }
};

module.exports = verifyUserToken;

