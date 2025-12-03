require('dotenv').config();
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');


const AccountModel = require('../models/account.model');

const ErrorResponse = require('../helpers/ErrorResponse');


module.exports = {
  login: async (req, res) => {
    const { username, password } = req.body;

    const account = await AccountModel.findOne({ username });

    if (!account) {
      // return res.status(400).json({
      //   statusCode: 400,
      //   message: 'TK hoặc MK không đúng',
      // });

      throw new ErrorResponse(400, 'TK hoặc MK không đúng');
    }

    const checkPass = bcryptjs.compareSync(password, account.password);

    if (!checkPass) {
      // return res.status(400).json({
      //   statusCode: 400,
      //   message: 'TK hoặc MK không đúng',
      // });

      throw new ErrorResponse(400, 'TK hoặc MK không đúng');
    }

    // jwt
    const payload = {
      _id: account._id,
      username: account.username,
      role: account.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '15m',
    });

    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: '7d',
    });

    return res.status(200).json({
      ...payload,
      jwt: token,
      refreshToken,
    });
  },
  refreshToken: async (req, res) => {
    const { refreshToken } = req.body;

    const decode = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    const account = await AccountModel.findById(decode._id);
    if (!account) {
      throw new ErrorResponse(401, 'Hãy đăng nhập để tiếp tục');
    }

    const payload = {
      _id: account._id,
      username: account.username,
      role: account.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '15m',
    });

    return res.status(200).json({
      ...payload,
      jwt: token,
      refreshToken,
    });
  },
  createAccount: async (req, res) => {
    const body = req.body;

    //validate the body
    const { value, error } = validCreateAccount(body);

    if (error) {
      return res.status(400).json({
        statusCode: 400,
        message: error.message,
      });
    }

    const account = await AccountModel.create(value);
    return res.status(201).json(account);
  },
  getAccounts: async (req, res) => {
    const { username, gender } = req.query;

    const bodyQuery = {};
    if (username) {
      bodyQuery.username = { $regex: `.*${username}.*`, $options: 'i' }; // i là không phân biệt hoa thường
    }

    if (gender) {
      bodyQuery.gender = gender;
    }

    const accounts = await AccountModel.find(bodyQuery);

    return res.status(200).json(accounts);
  },

  updateAccount: async (req, res) => {
    const { id } = req.params;
    const body = req.body;

    //validate the body

    const account = await AccountModel.findByIdAndUpdate(id, body, {
      new: true,
    });

    return res.status(200).json(account);
  },
  deleteAccount: async (req, res) => {
    const { id } = req.params;

    const account = await AccountModel.findByIdAndDelete(id);

    return res.status(200).json(account);
  },
  getAccountById: async (req, res) => {
    const { id } = req.params;

    const account = await AccountModel.findById(id);

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    return res.status(200).json(account);
  },
};
