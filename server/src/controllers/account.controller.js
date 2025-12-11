require('dotenv').config();
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cloudinary = require('../config/cloudinary');
const crypto = require('crypto');
const sendMail = require('../helpers/send.mail');

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

  // Request password reset: generate token and send email
  requestPasswordReset: async (req, res) => {
    const { email } = req.body;

    if (!email) {
      throw new ErrorResponse(400, 'Vui lòng cung cấp email');
    }

    const user = await UserModel.findOne({ email });

    // Do not reveal whether user exists
    if (!user) {
      return res.status(200).json({ message: 'Nếu email tồn tại, một link đặt lại mật khẩu đã được gửi' });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600 * 1000; // 1 hour
    await user.save();

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password?token=${token}`;

    const html = `
      <p>Bạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
      <p>Nhấn vào liên kết bên dưới để đặt lại mật khẩu (hết hạn sau 1 giờ):</p>
      <p><a href="${resetUrl}">Đặt lại mật khẩu</a></p>
    `;

    try {
      await sendMail({
        to: user.email,
        subject: 'Yêu cầu đặt lại mật khẩu - LabHub',
        html,
      });
    } catch (err) {
      console.error('Error sending reset email:', err);
      throw new ErrorResponse(500, 'Không thể gửi email đặt lại mật khẩu');
    }

    return res.status(200).json({ message: 'Nếu email tồn tại, một link đặt lại mật khẩu đã được gửi' });
  },

  // Reset password using token
  resetPassword: async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      throw new ErrorResponse(400, 'Token và mật khẩu mới là bắt buộc');
    }

    const user = await UserModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new ErrorResponse(400, 'Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn');
    }

    // Update password
    const passwordHash = bcryptjs.hashSync(newPassword, 10);
    user.passwordHash = passwordHash;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.status(200).json({ message: 'Đặt lại mật khẩu thành công' });
  },

  getProfile: async (req, res) => {
    try {
      const userId = req.user._id;

      // Lấy thông tin user
      const user = await UserModel.findById(userId).lean();
      if (!user) {
        throw new ErrorResponse(404, 'Không tìm thấy người dùng');
      }

      // Xóa passwordHash
      delete user.passwordHash;

      const userData = {
        _id: user._id.toString(),
        fullName: user.fullName || null,
        email: user.email || null,
        role: user.role || null,
        status: user.status || null,
        phoneNumber: user.phoneNumber || null,
        image: user.image || null,
        createdAt: user.createdAt || null,
        updatedAt: user.updatedAt || null,
      };

      // Nếu là student, lấy thông tin student
      let studentProfile = null;
      if (user.role === 'student') {
        try {
          const StudentModel = require('../models/student-model');
          const mongoose = require('mongoose');

          let student = await StudentModel.findOne({ user: userId });
          if (student) {
            studentProfile = await StudentModel.findById(student._id)
              .populate({
                path: 'lab',
                select: 'name code',
                options: { lean: true }
              })
              .lean();

            // Populate major nếu có
            if (studentProfile.major) {
              const majorId = studentProfile.major;
              if (mongoose.Types.ObjectId.isValid(majorId)) {
                const db = mongoose.connection.db;
                if (db) {
                  const majorObjectId = typeof majorId === 'string' ? new mongoose.Types.ObjectId(majorId) : majorId;
                  const major = await db.collection('Majors').findOne({ _id: majorObjectId });
                  if (major) {
                    studentProfile.major = {
                      _id: major._id.toString(),
                      name: major.name,
                      code: major.code,
                      description: major.description
                    };
                  }
                }
              }
            }

            // Format student data
            studentProfile = {
              _id: studentProfile._id.toString(),
              user: studentProfile.user ? studentProfile.user.toString() : null,
              studentCode: studentProfile.studentCode || null,
              major: studentProfile.major || null,
              startDate: studentProfile.startDate || null,
              lab: studentProfile.lab ? (typeof studentProfile.lab === 'object' ? {
                _id: studentProfile.lab._id.toString(),
                name: studentProfile.lab.name,
                code: studentProfile.lab.code
              } : studentProfile.lab.toString()) : null,
              createdAt: studentProfile.createdAt || null,
              updatedAt: studentProfile.updatedAt || null,
            };
          }
        } catch (err) {
          console.error('Error fetching student profile:', err);
          // Không throw error, chỉ log
        }
      }

      return res.status(200).json({
        user: userData,
        student: studentProfile,
      });
    } catch (error) {
      console.error('getProfile error:', error);
      throw error;
    }
  },

  updateProfile: async (req, res) => {
    try {
      const userId = req.user._id;
      const updateData = req.body;

      // Lấy user hiện tại
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new ErrorResponse(404, 'Không tìm thấy người dùng');
      }

      // Cập nhật thông tin User
      const userUpdateFields = {};
      if (updateData.fullName !== undefined && updateData.fullName !== null && updateData.fullName.trim() !== '') {
        userUpdateFields.fullName = updateData.fullName.trim();
      }
      if (updateData.phoneNumber !== undefined) {
        const phoneValue = typeof updateData.phoneNumber === 'string'
          ? updateData.phoneNumber.trim()
          : updateData.phoneNumber;
        userUpdateFields.phoneNumber = phoneValue || null;
      }

      if (Object.keys(userUpdateFields).length > 0) {
        await UserModel.findByIdAndUpdate(userId, userUpdateFields, { new: true, runValidators: true });
      }

      // Nếu là student, cập nhật thông tin Student
      let studentProfile = null;
      if (user.role === 'student') {
        try {
          const StudentModel = require('../models/student-model');
          const student = await StudentModel.findOne({ user: userId });

          if (student) {
            const studentUpdateFields = {};
            if (updateData.address !== undefined) {
              studentUpdateFields.address = updateData.address?.trim() || null;
            }
            if (updateData.className !== undefined) {
              studentUpdateFields.className = updateData.className?.trim() || null;
            }
            if (updateData.dateOfBirth !== undefined) {
              studentUpdateFields.dateOfBirth = updateData.dateOfBirth || null;
            }
            if (updateData.gender !== undefined) {
              studentUpdateFields.gender = updateData.gender || null;
            }

            if (Object.keys(studentUpdateFields).length > 0) {
              await StudentModel.findByIdAndUpdate(student._id, studentUpdateFields, { new: true, runValidators: true });
            }

            // Lấy lại student profile đầy đủ
            studentProfile = await StudentModel.findById(student._id)
              .populate({
                path: 'lab',
                select: 'name code',
                options: { lean: true }
              })
              .lean();

            // Populate major
            if (studentProfile.major) {
              const mongoose = require('mongoose');
              const majorId = studentProfile.major;
              if (mongoose.Types.ObjectId.isValid(majorId)) {
                const db = mongoose.connection.db;
                if (db) {
                  const majorObjectId = typeof majorId === 'string' ? new mongoose.Types.ObjectId(majorId) : majorId;
                  const major = await db.collection('Majors').findOne({ _id: majorObjectId });
                  if (major) {
                    studentProfile.major = {
                      _id: major._id.toString(),
                      name: major.name,
                      code: major.code,
                      description: major.description
                    };
                  }
                }
              }
            }

            studentProfile = {
              _id: studentProfile._id.toString(),
              user: studentProfile.user ? studentProfile.user.toString() : null,
              studentCode: studentProfile.studentCode || null,
              major: studentProfile.major || null,
              startDate: studentProfile.startDate || null,
              lab: studentProfile.lab ? (typeof studentProfile.lab === 'object' ? {
                _id: studentProfile.lab._id.toString(),
                name: studentProfile.lab.name,
                code: studentProfile.lab.code
              } : studentProfile.lab.toString()) : null,
              createdAt: studentProfile.createdAt || null,
              updatedAt: studentProfile.updatedAt || null,
            };
          }
        } catch (err) {
          console.error('Error updating student profile:', err);
        }
      }

      // Lấy lại user data đầy đủ
      const updatedUser = await UserModel.findById(userId).lean();
      delete updatedUser.passwordHash;

      const userData = {
        _id: updatedUser._id.toString(),
        fullName: updatedUser.fullName || null,
        email: updatedUser.email || null,
        role: updatedUser.role || null,
        status: updatedUser.status || null,
        phoneNumber: updatedUser.phoneNumber || null,
        image: updatedUser.image || null,
        createdAt: updatedUser.createdAt || null,
        updatedAt: updatedUser.updatedAt || null,
      };

      return res.status(200).json({
        user: userData,
        student: studentProfile,
        message: 'Cập nhật hồ sơ thành công'
      });
    } catch (error) {
      console.error('updateProfile error:', error);
      throw error;
    }
  },

  uploadAvatar: async (req, res) => {
    try {
      const userId = req.user._id;

      if (!req.file) {
        throw new ErrorResponse(400, 'Vui lòng chọn ảnh để upload');
      }

      // Upload to Cloudinary
      let imageUrl;
      try {
        if (process.env.CLOUDINARY_NAME && process.env.CLOUDINARY_KEY && process.env.CLOUDINARY_SECRET) {
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
          imageUrl = uploadResult.secure_url;
        } else {
          const fileData = req.file.buffer.toString('base64');
          const mimeType = req.file.mimetype;
          imageUrl = `data:${mimeType};base64,${fileData}`;
        }
      } catch (uploadError) {
        console.error('Error uploading image:', uploadError);
        const fileData = req.file.buffer.toString('base64');
        const mimeType = req.file.mimetype;
        imageUrl = `data:${mimeType};base64,${fileData}`;
      }

      // Cập nhật avatar trong User model
      await UserModel.findByIdAndUpdate(userId, { image: imageUrl }, { new: true });

      // Nếu là student, cập nhật avatar trong Student model (nếu có)
      const user = await UserModel.findById(userId);
      if (user.role === 'student') {
        try {
          const StudentModel = require('../models/student-model');
          const student = await StudentModel.findOne({ user: userId });
          if (student) {
            await StudentModel.findByIdAndUpdate(student._id, { image: imageUrl }, { new: true });
          }
        } catch (err) {
          console.error('Error updating student avatar:', err);
        }
      }

      // Lấy lại profile đầy đủ (giống getProfile)
      const updatedUser = await UserModel.findById(userId).lean();
      delete updatedUser.passwordHash;

      const userData = {
        _id: updatedUser._id.toString(),
        fullName: updatedUser.fullName || null,
        email: updatedUser.email || null,
        role: updatedUser.role || null,
        status: updatedUser.status || null,
        phoneNumber: updatedUser.phoneNumber || null,
        image: updatedUser.image || null,
        createdAt: updatedUser.createdAt || null,
        updatedAt: updatedUser.updatedAt || null,
      };

      let studentProfile = null;
      if (user.role === 'student') {
        try {
          const StudentModel = require('../models/student-model');
          const mongoose = require('mongoose');

          let student = await StudentModel.findOne({ user: userId });
          if (student) {
            studentProfile = await StudentModel.findById(student._id)
              .populate({
                path: 'lab',
                select: 'name code',
                options: { lean: true }
              })
              .lean();

            if (studentProfile.major) {
              const majorId = studentProfile.major;
              if (mongoose.Types.ObjectId.isValid(majorId)) {
                const db = mongoose.connection.db;
                if (db) {
                  const majorObjectId = typeof majorId === 'string' ? new mongoose.Types.ObjectId(majorId) : majorId;
                  const major = await db.collection('Majors').findOne({ _id: majorObjectId });
                  if (major) {
                    studentProfile.major = {
                      _id: major._id.toString(),
                      name: major.name,
                      code: major.code,
                      description: major.description
                    };
                  }
                }
              }
            }

            studentProfile = {
              _id: studentProfile._id.toString(),
              user: studentProfile.user ? studentProfile.user.toString() : null,
              studentCode: studentProfile.studentCode || null,
              major: studentProfile.major || null,
              startDate: studentProfile.startDate || null,
              lab: studentProfile.lab ? (typeof studentProfile.lab === 'object' ? {
                _id: studentProfile.lab._id.toString(),
                name: studentProfile.lab.name,
                code: studentProfile.lab.code
              } : studentProfile.lab.toString()) : null,
              createdAt: studentProfile.createdAt || null,
              updatedAt: studentProfile.updatedAt || null,
            };
          }
        } catch (err) {
          console.error('Error fetching student profile after avatar update:', err);
        }
      }

      return res.status(200).json({
        user: userData,
        student: studentProfile,
        message: 'Cập nhật avatar thành công'
      });
    } catch (error) {
      console.error('uploadAvatar error:', error);
      throw error;
    }
  },
};
