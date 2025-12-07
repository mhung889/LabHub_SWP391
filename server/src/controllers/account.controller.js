require('dotenv').config();
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cloudinary = require('../config/cloudinary');

const UserModel = require('../models/user-model');

const ErrorResponse = require('../helpers/ErrorResponse');


module.exports = {
  login: async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ErrorResponse(400, 'Vui lòng cung cấp email và mật khẩu');
    }

    const user = await UserModel.findOne({ email });

    if (!user) {
      throw new ErrorResponse(400, 'Email hoặc mật khẩu không đúng');
    }

    const checkPass = bcryptjs.compareSync(password, user.passwordHash);

    if (!checkPass) {
      throw new ErrorResponse(400, 'Email hoặc mật khẩu không đúng');
    }

    const payload = {
      _id: user._id,
      email: user.email,
      role: user.role,
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

    try {
      const decode = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

      const user = await UserModel.findById(decode._id);
      if (!user) {
        throw new ErrorResponse(401, 'Hãy đăng nhập để tiếp tục');
      }

      const payload = {
        _id: user._id,
        email: user.email,
        role: user.role,
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '15m',
      });

      return res.status(200).json({
        ...payload,
        jwt: token,
        refreshToken,
      });
    } catch (err) {
      throw new ErrorResponse(401, 'Refresh token không hợp lệ');
    }
  },

  createAccount: async (req, res) => {
    const { email, password, fullName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Thiếu email hoặc mật khẩu' });
    }

    const exists = await UserModel.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'Email đã tồn tại' });
    }

    const passwordHash = bcryptjs.hashSync(password, 10);

    const user = await UserModel.create({
      fullName: fullName || email,
      email,
      passwordHash,
    });

    return res.status(201).json(user);
  },

  // Basic listing for admins (kept simple)
  getAccounts: async (req, res) => {
    const { email, gender } = req.query;

    const bodyQuery = {};
    if (email) {
      bodyQuery.email = { $regex: `.*${email}.*`, $options: 'i' };
    }

    if (gender) {
      bodyQuery.gender = gender;
    }

    const accounts = await UserModel.find(bodyQuery).select('-passwordHash');

    return res.status(200).json(accounts);
  },

  updateAccount: async (req, res) => {
    try {
      const { id } = req.params;
      let body = { ...req.body };

      // Handle file upload if image file is present
      if (req.file) {
        try {
          // Try to upload to Cloudinary if configured
          if (process.env.CLOUDINARY_NAME && process.env.CLOUDINARY_KEY && process.env.CLOUDINARY_SECRET) {
            // Upload to Cloudinary
            const uploadResult = await new Promise((resolve, reject) => {
              const uploadStream = cloudinary.uploader.upload_stream(
                {
                  folder: 'LabHub/users',
                  resource_type: 'image',
                  transformation: [
                    { width: 500, height: 500, crop: 'limit' },
                    { quality: 'auto' }
                  ]
                },
                (error, result) => {
                  if (error) reject(error);
                  else resolve(result);
                }
              );
              uploadStream.end(req.file.buffer);
            });
            body.image = uploadResult.secure_url;
          } else {
            // Fallback to base64 if Cloudinary not configured
            const fileData = req.file.buffer.toString('base64');
            const mimeType = req.file.mimetype;
            body.image = `data:${mimeType};base64,${fileData}`;
          }
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          // Fallback to base64 if Cloudinary upload fails
          const fileData = req.file.buffer.toString('base64');
          const mimeType = req.file.mimetype;
          body.image = `data:${mimeType};base64,${fileData}`;
        }
      }

      // Parse nested objects if they come as JSON strings from FormData
      if (typeof body.emergencyContact === 'string') {
        try {
          body.emergencyContact = JSON.parse(body.emergencyContact);
        } catch (e) {
          // If not valid JSON, keep as is
        }
      }

      if (body.password) {
        body.passwordHash = bcryptjs.hashSync(body.password, 10);
        delete body.password;
      }

      // Remove undefined and null values
      Object.keys(body).forEach(key => {
        if (body[key] === undefined || body[key] === 'undefined' || body[key] === null || body[key] === 'null') {
          delete body[key];
        }
      });

      const account = await UserModel.findByIdAndUpdate(id, body, {
        new: true,
      }).select('-passwordHash');

      return res.status(200).json(account);
    } catch (error) {
      console.error('Error in updateAccount:', error);
      throw error;
    }
  },

  deleteAccount: async (req, res) => {
    const { id } = req.params;

    const account = await UserModel.findByIdAndDelete(id);

    return res.status(200).json(account);
  },

  getAccountById: async (req, res) => {
    const { id } = req.params;

    const account = await UserModel.findById(id).select('-passwordHash');

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    return res.status(200).json(account);
  },

  changePassword: async (req, res) => {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new ErrorResponse(400, 'Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới');
    }

    const user = await UserModel.findById(id);

    if (!user) {
      throw new ErrorResponse(404, 'Không tìm thấy người dùng');
    }

    // Verify current password
    const checkPass = bcryptjs.compareSync(currentPassword, user.passwordHash);

    if (!checkPass) {
      throw new ErrorResponse(400, 'Mật khẩu hiện tại không đúng');
    }

    // Hash and update new password
    const passwordHash = bcryptjs.hashSync(newPassword, 10);

    const updatedUser = await UserModel.findByIdAndUpdate(id, { passwordHash }, {
      new: true,
    }).select('-passwordHash');

    return res.status(200).json(updatedUser);
  },
};
