require('dotenv').config();
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserModel = require('../models/user-model');
const StudentModel = require('../models/student-model');
const ErrorResponse = require('../helpers/ErrorResponse');

module.exports = {
  login: async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ErrorResponse(400, 'Vui lòng nhập email và mật khẩu');
    }

    const user = await UserModel.findOne({ email });

    if (!user) {
      throw new ErrorResponse(400, 'Email hoặc mật khẩu không đúng');
    }

    if (user.status !== 'active') {
      throw new ErrorResponse(403, 'Tài khoản của bạn đã bị vô hiệu hóa');
    }

    // Kiểm tra xem passwordHash có phải là bcrypt hash không
    const isBcryptHash = user.passwordHash && (
      user.passwordHash.startsWith('$2a$') || 
      user.passwordHash.startsWith('$2b$') || 
      user.passwordHash.startsWith('$2y$')
    ) && user.passwordHash.length === 60;

    let checkPass = false;

    if (isBcryptHash) {
      // Nếu là bcrypt hash, dùng compareSync
      checkPass = bcryptjs.compareSync(password, user.passwordHash);
    } else {
      // Nếu là plain text, so sánh trực tiếp
      checkPass = password === user.passwordHash;
    }

    if (!checkPass) {
      throw new ErrorResponse(400, 'Email hoặc mật khẩu không đúng');
    }

    // jwt
    const payload = {
      _id: user._id,
      email: user.email,
      fullName: user.fullName,
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

    if (!refreshToken) {
      throw new ErrorResponse(400, 'Refresh token không được cung cấp');
    }

    const decode = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    const user = await UserModel.findById(decode._id);
    if (!user) {
      throw new ErrorResponse(401, 'Hãy đăng nhập để tiếp tục');
    }

    if (user.status !== 'active') {
      throw new ErrorResponse(403, 'Tài khoản của bạn đã bị vô hiệu hóa');
    }

    const payload = {
      _id: user._id,
      email: user.email,
      fullName: user.fullName,
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
  },
  getProfile: async (req, res) => {
    try {
      // Đảm bảo userId là đúng format - lấy từ req.user (Mongoose document)
      const userId = req.user._id;
      console.log('getProfile - req.user._id:', userId);
      console.log('getProfile - req.user._id type:', typeof userId);
      console.log('getProfile - req.user._id constructor:', userId?.constructor?.name);

      // Lấy user với tất cả fields (kể cả phoneNumber và image nếu có trong DB)
      const user = await UserModel.findById(userId).lean();
      
      if (!user) {
        throw new ErrorResponse(404, 'Không tìm thấy người dùng');
      }

      // Xóa passwordHash khỏi response
      delete user.passwordHash;

      // Kết hợp thông tin user - lấy tất cả fields từ DB
      const userData = {
        _id: user._id,
        fullName: user.fullName || null,
        email: user.email || null,
        role: user.role || null,
        status: user.status || null,
        phoneNumber: user.phoneNumber || null,
        image: user.image || null,
        createdAt: user.createdAt || null,
        updatedAt: user.updatedAt || null,
      };

      // Nếu là student, lấy thông tin student profile
      let studentProfile = null;
      if (user.role === 'student') {
        try {
          console.log('=== getProfile Student Query ===');
          console.log('userId:', userId);
          console.log('userId.toString():', userId?.toString());
          console.log('userId.constructor.name:', userId?.constructor?.name);
          
          // Thử query với nhiều cách
          let student = null;
          
          // Cách 1: Query trực tiếp (giống updateProfile)
          student = await StudentModel.findOne({ user: userId });
          console.log('Query 1 (direct):', student ? 'FOUND' : 'NOT FOUND');
          
          // Cách 2: Query với string
          if (!student) {
            student = await StudentModel.findOne({ user: userId.toString() });
            console.log('Query 2 (string):', student ? 'FOUND' : 'NOT FOUND');
          }
          
          // Cách 3: Query với ObjectId
          if (!student) {
            const mongoose = require('mongoose');
            if (mongoose.Types.ObjectId.isValid(userId)) {
              const userObjId = typeof userId === 'string' 
                ? new mongoose.Types.ObjectId(userId) 
                : userId;
              student = await StudentModel.findOne({ user: userObjId });
              console.log('Query 3 (ObjectId):', student ? 'FOUND' : 'NOT FOUND');
            }
          }
          
          // Cách 4: Query tất cả và tìm
          if (!student) {
            const allStudents = await StudentModel.find({}).limit(10);
            console.log('Total students checked:', allStudents.length);
            for (const s of allStudents) {
              const sUserId = s.user?.toString();
              const reqUserId = userId?.toString();
              console.log(`Comparing: ${sUserId} === ${reqUserId}?`, sUserId === reqUserId);
              if (sUserId === reqUserId) {
                student = s;
                console.log('FOUND by manual comparison!');
                break;
              }
            }
          }
          
          if (student) {
            console.log('✅ Student FOUND:', {
              _id: student._id,
              studentCode: student.studentCode,
              user: student.user?.toString()
            });
            
            // Convert sang lean trước, KHÔNG populate lab ở đây (sẽ populate sau để tránh lỗi MissingSchemaError)
            studentProfile = await StudentModel.findById(student._id).lean();
            
            // Populate lab ngay sau khi có studentProfile (trước khi populate major)
            if (studentProfile && studentProfile.lab) {
              try {
                const LabModel = require('../models/lab-model');
                const lab = await LabModel.findById(studentProfile.lab).select('name code').lean();
                if (lab) {
                  studentProfile.lab = {
                    _id: lab._id.toString(),
                    name: lab.name,
                    code: lab.code
                  };
                }
              } catch (labErr) {
                console.log('Lab populate error (non-critical):', labErr.message);
                // Giữ nguyên lab là ObjectId nếu không populate được
              }
            }
            
            // Nếu major là ObjectId, populate từ Major collection
            if (studentProfile.major) {
              try {
                const mongoose = require('mongoose');
                const majorId = studentProfile.major;
                
                // Kiểm tra xem major có phải là ObjectId không
                if (mongoose.Types.ObjectId.isValid(majorId)) {
                  // Tìm trong Major collection
                  const db = mongoose.connection.db;
                  if (db) {
                    const majorObjectId = typeof majorId === 'string' 
                      ? new mongoose.Types.ObjectId(majorId) 
                      : majorId;
                    
                    const major = await db.collection('Majors').findOne({ _id: majorObjectId });
                    if (major) {
                      studentProfile.major = {
                        _id: major._id.toString(),
                        name: major.name,
                        code: major.code,
                        description: major.description
                      };
                      console.log('Major populated:', studentProfile.major);
                    } else {
                      console.log('Major not found in collection for ID:', majorObjectId);
                    }
                  }
                } else {
                  console.log('Major is not a valid ObjectId, keeping as string:', majorId);
                }
              } catch (err) {
                console.error('Major populate error:', err.message);
                // Nếu lỗi, giữ nguyên giá trị major
              }
            } else {
              console.log('No major field in student profile');
            }

            // Nếu student có phoneNumber hoặc image nhưng user không có, lấy từ student
            if (!userData.phoneNumber && studentProfile.phoneNumber) {
              userData.phoneNumber = studentProfile.phoneNumber;
            }
            if (!userData.image && studentProfile.image) {
              userData.image = studentProfile.image;
            }
            userData.studentCode = studentProfile.studentCode || null;
          }
        } catch (err) {
          console.error('Error fetching student profile:', err);
          // Không throw error, chỉ log và tiếp tục
        }
      }

      // Lab đã được populate ở trên, không cần populate lại

      // Convert ObjectId to string để tránh lỗi serialize - đảm bảo tất cả fields được trả về
      const response = {
        user: {
          ...userData,
          _id: userData._id.toString()
        },
        student: studentProfile ? {
          // Trả về tất cả fields của student - giống hệt như updateProfile
          ...studentProfile,
          _id: studentProfile._id.toString(),
          user: studentProfile.user ? studentProfile.user.toString() : null,
          lab: studentProfile.lab ? (typeof studentProfile.lab === 'object' ? {
            _id: studentProfile.lab._id.toString(),
            name: studentProfile.lab.name,
            code: studentProfile.lab.code
          } : studentProfile.lab.toString()) : null
        } : null
      };

      // Log để debug
      console.log('getProfile response:', JSON.stringify(response, null, 2));

      return res.status(200).json(response);
    } catch (error) {
      console.error('getProfile error:', error);
      throw error;
    }
  },
  updateProfile: async (req, res) => {
    try {
      const userId = req.user._id;
      const updateData = req.body;

      console.log('=== updateProfile DEBUG ===');
      console.log('updateData:', updateData);
      console.log('updateData.phoneNumber:', updateData.phoneNumber);
      console.log('updateData.phoneNumber type:', typeof updateData.phoneNumber);

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
        // Cập nhật phoneNumber - luôn update kể cả là empty string
        const phoneValue = typeof updateData.phoneNumber === 'string' 
          ? updateData.phoneNumber.trim() 
          : updateData.phoneNumber;
        userUpdateFields.phoneNumber = phoneValue || null;
        console.log('Updating User phoneNumber:', phoneValue);
      }
      if (updateData.image !== undefined && updateData.image !== null) {
        userUpdateFields.image = updateData.image;
      }

      console.log('User update fields:', userUpdateFields);
      if (Object.keys(userUpdateFields).length > 0) {
        await UserModel.findByIdAndUpdate(userId, userUpdateFields, { new: true, runValidators: true });
        console.log('User updated successfully');
      } else {
        console.log('No user fields to update');
      }

      // Nếu là student, cập nhật thông tin Student
      let updatedStudent = null;
      if (user.role === 'student') {
        try {
          const student = await StudentModel.findOne({ user: userId });
          
          if (student) {
            const studentUpdateFields = {};
            if (updateData.phoneNumber !== undefined) {
              // Cập nhật phoneNumber - luôn update kể cả là empty string
              const phoneValue = typeof updateData.phoneNumber === 'string' 
                ? updateData.phoneNumber.trim() 
                : updateData.phoneNumber;
              studentUpdateFields.phoneNumber = phoneValue || null;
              console.log('Updating Student phoneNumber:', phoneValue);
            }
            if (updateData.image !== undefined && updateData.image !== null) {
              studentUpdateFields.image = updateData.image;
            }
            if (updateData.address !== undefined && updateData.address !== null) {
              studentUpdateFields.address = updateData.address.trim();
            }
            if (updateData.className !== undefined && updateData.className !== null) {
              studentUpdateFields.className = updateData.className.trim();
            }
            if (updateData.dateOfBirth !== undefined && updateData.dateOfBirth !== null && updateData.dateOfBirth !== '') {
              const dateOfBirth = new Date(updateData.dateOfBirth);
              if (!isNaN(dateOfBirth.getTime())) {
                studentUpdateFields.dateOfBirth = dateOfBirth;
              }
            }
            if (updateData.gender !== undefined && updateData.gender !== null && updateData.gender !== '') {
              studentUpdateFields.gender = updateData.gender;
            }
            if (updateData.major !== undefined && updateData.major !== null) {
              const mongoose = require('mongoose');
              if (mongoose.Types.ObjectId.isValid(updateData.major)) {
                studentUpdateFields.major = updateData.major;
              } else if (updateData.major !== '') {
                studentUpdateFields.major = updateData.major;
              }
            }

            if (Object.keys(studentUpdateFields).length > 0) {
              updatedStudent = await StudentModel.findByIdAndUpdate(
                student._id,
                studentUpdateFields,
                { new: true, runValidators: true }
              ).lean();
            } else {
              updatedStudent = student.toObject();
            }
          } else {
            // Nếu không tìm thấy student, log nhưng không throw error
            console.log(`Student profile not found for user: ${userId}`);
          }
        } catch (studentError) {
          console.error('Error updating student profile:', studentError);
          // Không throw error, chỉ log
        }
      }

      // Lấy lại profile đầy đủ sau khi update
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

      // Populate major nếu có
      if (updatedStudent && updatedStudent.major) {
        try {
          const mongoose = require('mongoose');
          const majorId = updatedStudent.major;
          if (mongoose.Types.ObjectId.isValid(majorId)) {
            const db = mongoose.connection.db;
            if (db) {
              const majorObjectId = typeof majorId === 'string' 
                ? new mongoose.Types.ObjectId(majorId) 
                : majorId;
              const major = await db.collection('Majors').findOne({ _id: majorObjectId });
              if (major) {
                updatedStudent.major = {
                  _id: major._id.toString(),
                  name: major.name,
                  code: major.code,
                  description: major.description
                };
              }
            }
          }
        } catch (err) {
          console.log('Major populate error:', err.message);
        }
      }

      // Cập nhật userData từ student nếu cần
      if (updatedStudent) {
        if (!userData.phoneNumber && updatedStudent.phoneNumber) {
          userData.phoneNumber = updatedStudent.phoneNumber;
        }
        if (!userData.image && updatedStudent.image) {
          userData.image = updatedStudent.image;
        }
        userData.studentCode = updatedStudent.studentCode || null;
      }

      // Populate lab nếu có
      if (updatedStudent && updatedStudent.lab) {
        try {
          const mongoose = require('mongoose');
          if (mongoose.Types.ObjectId.isValid(updatedStudent.lab)) {
            const LabModel = mongoose.models.Lab || mongoose.model('Lab', new mongoose.Schema({}, { strict: false }), 'Labs');
            const lab = await LabModel.findById(updatedStudent.lab).select('name code').lean();
            if (lab) {
              updatedStudent.lab = {
                _id: lab._id.toString(),
                name: lab.name,
                code: lab.code
              };
            }
          }
        } catch (err) {
          console.log('Lab populate error:', err.message);
        }
      }

      return res.status(200).json({
        user: userData,
        student: updatedStudent ? {
          ...updatedStudent,
          _id: updatedStudent._id.toString(),
          user: updatedStudent.user ? (typeof updatedStudent.user === 'object' ? updatedStudent.user.toString() : updatedStudent.user) : null,
        } : null,
        message: 'Cập nhật hồ sơ thành công'
      });
    } catch (error) {
      console.error('updateProfile error:', error);
      // Nếu là CastError, trả về lỗi rõ ràng hơn
      if (error.name === 'CastError') {
        throw new ErrorResponse(400, 'Dữ liệu không hợp lệ');
      }
      throw error;
    }
  },
  uploadAvatar: async (req, res) => {
    try {
      const userId = req.user._id;
      
      if (!req.file) {
        throw new ErrorResponse(400, 'Vui lòng chọn ảnh để upload');
      }

      // Cloudinary trả về URL trong req.file.url
      const imageUrl = req.file.url;
      
      if (!imageUrl) {
        console.error('No image URL found in req.file:', req.file);
        throw new ErrorResponse(500, 'Không thể lấy URL ảnh từ Cloudinary');
      }

      // Lấy user hiện tại
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new ErrorResponse(404, 'Không tìm thấy người dùng');
      }

      // Cập nhật avatar trong User model
      await UserModel.findByIdAndUpdate(userId, { image: imageUrl }, { new: true });

      // Nếu là student, cập nhật avatar trong Student model
      if (user.role === 'student') {
        const student = await StudentModel.findOne({ user: userId });
        if (student) {
          await StudentModel.findByIdAndUpdate(student._id, { image: imageUrl }, { new: true });
        }
      }

      // Sử dụng lại logic từ getProfile để đảm bảo trả về đầy đủ thông tin
      const updatedUser = await UserModel.findById(userId).lean();
      delete updatedUser.passwordHash;

      const userData = {
        _id: updatedUser._id,
        fullName: updatedUser.fullName || null,
        email: updatedUser.email || null,
        role: updatedUser.role || null,
        status: updatedUser.status || null,
        phoneNumber: updatedUser.phoneNumber || null,
        image: updatedUser.image || null,
        createdAt: updatedUser.createdAt || null,
        updatedAt: updatedUser.updatedAt || null,
      };

      // Lấy student profile nếu có - giống như getProfile
      let studentProfile = null;
      if (user.role === 'student') {
        try {
          studentProfile = await StudentModel.findOne({ user: userId })
            .populate({
              path: 'lab',
              select: 'name code',
              options: { lean: true }
            })
            .lean();
          
          if (studentProfile) {
            // Populate major nếu có
            if (studentProfile.major) {
              try {
                const mongoose = require('mongoose');
                const majorId = studentProfile.major;
                
                if (mongoose.Types.ObjectId.isValid(majorId)) {
                  const db = mongoose.connection.db;
                  if (db) {
                    const majorObjectId = typeof majorId === 'string' 
                      ? new mongoose.Types.ObjectId(majorId) 
                      : majorId;
                    
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
              } catch (err) {
                console.log('Major populate error:', err.message);
              }
            }

            // Cập nhật userData từ student nếu cần
            if (!userData.phoneNumber && studentProfile.phoneNumber) {
              userData.phoneNumber = studentProfile.phoneNumber;
            }
            if (!userData.image && studentProfile.image) {
              userData.image = studentProfile.image;
            }
            userData.studentCode = studentProfile.studentCode || null;
          }
        } catch (err) {
          console.error('Error fetching student profile:', err);
        }
      }

      // Convert ObjectId to string để tránh lỗi serialize - giống như getProfile
      return res.status(200).json({
        user: {
          ...userData,
          _id: userData._id.toString()
        },
        student: studentProfile ? {
          ...studentProfile,
          _id: studentProfile._id.toString(),
          user: studentProfile.user ? studentProfile.user.toString() : null,
          lab: studentProfile.lab ? (typeof studentProfile.lab === 'object' ? {
            _id: studentProfile.lab._id.toString(),
            name: studentProfile.lab.name,
            code: studentProfile.lab.code
          } : studentProfile.lab.toString()) : null
        } : null,
        message: 'Cập nhật avatar thành công'
      });
    } catch (error) {
      console.error('uploadAvatar error:', error);
      throw error;
    }
  },
};

