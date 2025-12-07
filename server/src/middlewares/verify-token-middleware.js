require('dotenv').config();
const jwt = require('jsonwebtoken');
const UserModel = require('../models/user-model');
const ErrorResponse = require('../helpers/ErrorResponse');

const verifyAccessToken = async (req, res, next) => {

  const { authorization } = req.headers;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    throw new ErrorResponse(401, 'Hãy đăng nhập để tiếp tục');
  }

  try {
    const token = authorization.split(' ')[1];

    const decode = jwt.verify(token, process.env.JWT_SECRET);

    const user = await UserModel.findById(decode._id);

    if (!user) {
      throw new ErrorResponse(401, 'Hãy đăng nhập để tiếp tục');
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      throw new ErrorResponse(401, 'Token không hợp lệ');
    }
    throw err;
  }
}


module.exports = verifyAccessToken;
