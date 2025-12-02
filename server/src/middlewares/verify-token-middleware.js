require('dotenv').config();
const jwt = require('jsonwebtoken');
// const AccountModel = require('../models/account.model');

const verifyAccessToken = async (req,res, next ) => {

  const { authorization } = req.headers;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    // return res.status(401).json({
    //     statusCode: 401,
    //     message: 'Hãy đăng nhập để tiếp tục',
    // });

    throw new ErrorResponse(401, 'Hãy đăng nhập để tiếp tục');
  }

  const token = authorization.split(' ')[1];

  const decode = jwt.verify(token, process.env.JWT_SECRET);

  const account = await AccountModel.findById(decode._id);

  if (!account) {
    // return res.status(401).json({
    //     statusCode: 401,
    //     message: 'Hãy đăng nhập để tiếp tục',
    // });
    throw new ErrorResponse(401, 'Hãy đăng nhập để tiếp tục');
  }

  req.account = account;
  next();


}


module.exports = {
  verifyAccessToken,
}