require('dotenv').config();
const bcryptjs = require('bcryptjs');
const cloudinary = require('../config/cloudinary');
const UserModel = require('../models/user-model');
const LabModel = require('../models/lab-model');
const ErrorResponse = require('../helpers/ErrorResponse');

module.exports = {
  getMentors: async (req, res) => {
    try {
      const { search, page = 1, limit = 20, status } = req.query;
      
      const pageNum = Math.max(1, parseInt(page)) || 1;
      const limitNum = Math.min(100, Math.max(1, parseInt(limit))) || 20; // Max 100, min 1
      const skip = (pageNum - 1) * limitNum;

      const query = { role: 'mentor' };

      if (status !== undefined && status !== null && String(status).trim()) {
        const statusValue = String(status).trim().toLowerCase();
        if (statusValue === 'active' || statusValue === 'inactive') {
          query.status = statusValue;
          console.log('Status filter applied:', statusValue);
        } else {
          throw new ErrorResponse(400, 'Trạng thái không hợp lệ. Chỉ chấp nhận: active hoặc inactive');
        }
      } else {
        console.log('No status filter provided');
      }

      if (search !== undefined && search !== null && String(search).trim()) {
        const searchTerm = String(search).trim();
        if (searchTerm.length > 0 && searchTerm.length <= 100) {
          const escapedSearch = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          
          const searchConditions = {
            $or: [
              { fullName: { $regex: escapedSearch, $options: 'i' } },
              { email: { $regex: escapedSearch, $options: 'i' } },
              { phoneNumber: { $regex: escapedSearch, $options: 'i' } },
            ]
          };
          
          if (query.status) {
            const statusValue = query.status;
            query.$and = [
              { role: 'mentor' },
              { status: statusValue },
              searchConditions
            ];
            delete query.status;
            delete query.role;
            console.log('Combined status and search in $and');
          } else {
            query.$or = searchConditions.$or;
            console.log('Search only, no status filter');
          }
        } else if (searchTerm.length > 100) {
          throw new ErrorResponse(400, 'Từ khóa tìm kiếm không được vượt quá 100 ký tự');
        }
      } else {
        console.log('No search term provided');
      }

      console.log('=== MENTOR QUERY DEBUG ===');
      console.log('Query params received:', { search, page, limit, status });
      console.log('Final query object:', JSON.stringify(query, null, 2));
      console.log('Query keys:', Object.keys(query));
      if (query.status) console.log('Status in query:', query.status);
      if (query.$and) console.log('$and in query:', JSON.stringify(query.$and, null, 2));
      console.log('========================');

      const mentors = await UserModel.find(query)
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();
      
      console.log('Mentors found:', mentors.length);
      console.log('Mentors statuses:', mentors.map(m => ({ id: m._id, status: m.status })));

      const mentorsWithLabs = await Promise.all(
        mentors.map(async (mentor) => {
          const labCount = await LabModel.countDocuments({ mentor: mentor._id, status: 'active' });
          return {
            ...mentor,
            labCount,
          };
        })
      );

      const total = await UserModel.countDocuments(query);

      return res.status(200).json({
        mentors: mentorsWithLabs,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error('Error in getMentors:', error);
      throw new ErrorResponse(500, 'Lỗi khi lấy danh sách mentor');
    }
  },

  getMentorById: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
        throw new ErrorResponse(400, 'ID mentor không hợp lệ');
      }

      const mentor = await UserModel.findById(id)
        .select('-passwordHash')
        .lean();

      if (!mentor || mentor.role !== 'mentor') {
        throw new ErrorResponse(404, 'Không tìm thấy mentor');
      }

      const labs = await LabModel.find({ mentor: id, status: 'active' })
        .select('_id name code description major')
        .lean();

      return res.status(200).json({
        ...mentor,
        labs,
        labCount: labs.length,
      });
    } catch (error) {
      if (error instanceof ErrorResponse) {
        throw error;
      }
      console.error('Error in getMentorById:', error);
      throw new ErrorResponse(500, 'Lỗi khi lấy thông tin mentor');
    }
  },

  createMentor: async (req, res) => {
    try {
      const { email, password, fullName, phoneNumber, dateOfBirth, gender, address, labId } = req.body;

      if (!email || !email.trim()) {
        throw new ErrorResponse(400, 'Email là bắt buộc');
      }
      if (!password || !password.trim()) {
        throw new ErrorResponse(400, 'Mật khẩu là bắt buộc');
      }
      if (!fullName || !fullName.trim()) {
        throw new ErrorResponse(400, 'Họ tên là bắt buộc');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        throw new ErrorResponse(400, 'Email không đúng định dạng');
      }
      if (email.trim().length > 100) {
        throw new ErrorResponse(400, 'Email không được vượt quá 100 ký tự');
      }

      if (password.length < 8) {
        throw new ErrorResponse(400, 'Mật khẩu phải có ít nhất 8 ký tự');
      }
      if (password.length > 64) {
        throw new ErrorResponse(400, 'Mật khẩu không được vượt quá 64 ký tự');
      }

      if (fullName.trim().length < 2) {
        throw new ErrorResponse(400, 'Họ tên phải có ít nhất 2 ký tự');
      }
      if (fullName.trim().length > 100) {
        throw new ErrorResponse(400, 'Họ tên không được vượt quá 100 ký tự');
      }

      if (phoneNumber && phoneNumber.trim()) {
        const phoneRegex = /^[0-9]{10,11}$/;
        if (!phoneRegex.test(phoneNumber.trim().replace(/[\s-]/g, ''))) {
          throw new ErrorResponse(400, 'Số điện thoại không hợp lệ (10-11 chữ số)');
        }
        if (phoneNumber.trim().length > 20) {
          throw new ErrorResponse(400, 'Số điện thoại không được vượt quá 20 ký tự');
        }
      }

      if (dateOfBirth) {
        const birthDate = new Date(dateOfBirth);
        const today = new Date();
        const minDate = new Date('1900-01-01');
        
        if (isNaN(birthDate.getTime())) {
          throw new ErrorResponse(400, 'Ngày sinh không hợp lệ');
        }
        if (birthDate > today) {
          throw new ErrorResponse(400, 'Ngày sinh không thể là tương lai');
        }
        if (birthDate < minDate) {
          throw new ErrorResponse(400, 'Ngày sinh không hợp lệ');
        }
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 18 || (age === 18 && today.getMonth() < birthDate.getMonth()) || 
            (age === 18 && today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) {
          throw new ErrorResponse(400, 'Mentor phải ít nhất 18 tuổi');
        }
      }

      if (gender && !['male', 'female', 'other'].includes(gender)) {
        throw new ErrorResponse(400, 'Giới tính không hợp lệ');
      }

      if (address && address.trim().length > 255) {
        throw new ErrorResponse(400, 'Địa chỉ không được vượt quá 255 ký tự');
      }

      const exists = await UserModel.findOne({ email: email.trim().toLowerCase() });
      if (exists) {
        throw new ErrorResponse(400, 'Email đã tồn tại');
      }

      if (req.file) {
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedMimeTypes.includes(req.file.mimetype)) {
          throw new ErrorResponse(400, 'Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)');
        }
        if (req.file.size > 5 * 1024 * 1024) { // 5MB
          throw new ErrorResponse(400, 'Kích thước ảnh không được vượt quá 5MB');
        }
      }

      const passwordHash = bcryptjs.hashSync(password, 10);

      let imageUrl = undefined;
      if (req.file) {
        try {
          if (process.env.CLOUDINARY_NAME && process.env.CLOUDINARY_KEY && process.env.CLOUDINARY_SECRET) {
            const uploadResult = await new Promise((resolve, reject) => {
              const uploadStream = cloudinary.uploader.upload_stream(
                {
                  folder: 'LabHub/mentors',
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
      }

      const mentorData = {
        email: email.trim().toLowerCase(),
        passwordHash,
        fullName: fullName.trim(),
        role: 'mentor',
        status: 'active',
        phoneNumber: phoneNumber ? phoneNumber.trim().replace(/[\s-]/g, '') : undefined,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender: gender || undefined,
        address: address ? address.trim() : undefined,
        image: imageUrl,
      };

      Object.keys(mentorData).forEach(key => {
        if (mentorData[key] === undefined) {
          delete mentorData[key];
        }
      });

      const mentor = await UserModel.create(mentorData);

      if (labId && /^[0-9a-fA-F]{24}$/.test(String(labId))) {
        await LabModel.updateMany(
          { mentor: mentor._id },
          { $unset: { mentor: "" } }
        );
        await LabModel.findByIdAndUpdate(
          labId,
          { $set: { mentor: mentor._id } }
        );
      }

      return res.status(201).json({
        ...mentor.toObject(),
        passwordHash: undefined,
      });
    } catch (error) {
      if (error instanceof ErrorResponse) {
        throw error;
      }
      console.error('Error in createMentor:', error);
      throw new ErrorResponse(500, 'Lỗi khi tạo mentor');
    }
  },

  updateMentor: async (req, res) => {
    try {
      const { id } = req.params;
      let body = { ...req.body };

      if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
        throw new ErrorResponse(400, 'ID mentor không hợp lệ');
      }

      const existingMentor = await UserModel.findById(id);
      if (!existingMentor || existingMentor.role !== 'mentor') {
        throw new ErrorResponse(404, 'Không tìm thấy mentor');
      }

      if (body.fullName !== undefined) {
        if (!body.fullName || !body.fullName.trim()) {
          throw new ErrorResponse(400, 'Họ tên không được để trống');
        }
        if (body.fullName.trim().length < 2) {
          throw new ErrorResponse(400, 'Họ tên phải có ít nhất 2 ký tự');
        }
        if (body.fullName.trim().length > 100) {
          throw new ErrorResponse(400, 'Họ tên không được vượt quá 100 ký tự');
        }
        body.fullName = body.fullName.trim();
      }

      if (body.email !== undefined && body.email !== existingMentor.email) {
        if (!body.email || !body.email.trim()) {
          throw new ErrorResponse(400, 'Email không được để trống');
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(body.email.trim())) {
          throw new ErrorResponse(400, 'Email không đúng định dạng');
        }
        if (body.email.trim().length > 100) {
          throw new ErrorResponse(400, 'Email không được vượt quá 100 ký tự');
        }
        const emailExists = await UserModel.findOne({ email: body.email.trim().toLowerCase() });
        if (emailExists) {
          throw new ErrorResponse(400, 'Email đã tồn tại');
        }
        body.email = body.email.trim().toLowerCase();
      }

      if (body.password) {
        if (body.password.length < 8) {
          throw new ErrorResponse(400, 'Mật khẩu phải có ít nhất 8 ký tự');
        }
        if (body.password.length > 64) {
          throw new ErrorResponse(400, 'Mật khẩu không được vượt quá 64 ký tự');
        }
      }

      if (body.phoneNumber !== undefined && body.phoneNumber) {
        const phoneRegex = /^[0-9]{10,11}$/;
        const cleanPhone = body.phoneNumber.trim().replace(/[\s-]/g, '');
        if (!phoneRegex.test(cleanPhone)) {
          throw new ErrorResponse(400, 'Số điện thoại không hợp lệ (10-11 chữ số)');
        }
        if (cleanPhone.length > 20) {
          throw new ErrorResponse(400, 'Số điện thoại không được vượt quá 20 ký tự');
        }
        body.phoneNumber = cleanPhone;
      }

      if (body.dateOfBirth !== undefined && body.dateOfBirth) {
        const birthDate = new Date(body.dateOfBirth);
        const today = new Date();
        const minDate = new Date('1900-01-01');
        
        if (isNaN(birthDate.getTime())) {
          throw new ErrorResponse(400, 'Ngày sinh không hợp lệ');
        }
        if (birthDate > today) {
          throw new ErrorResponse(400, 'Ngày sinh không thể là tương lai');
        }
        if (birthDate < minDate) {
          throw new ErrorResponse(400, 'Ngày sinh không hợp lệ');
        }
        body.dateOfBirth = birthDate;
      }

      if (body.gender !== undefined && body.gender && !['male', 'female', 'other'].includes(body.gender)) {
        throw new ErrorResponse(400, 'Giới tính không hợp lệ');
      }

      if (body.address !== undefined && body.address && body.address.trim().length > 255) {
        throw new ErrorResponse(400, 'Địa chỉ không được vượt quá 255 ký tự');
      }
      if (body.address !== undefined && body.address) {
        body.address = body.address.trim();
      }

      if (req.file) {
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedMimeTypes.includes(req.file.mimetype)) {
          throw new ErrorResponse(400, 'Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)');
        }
        if (req.file.size > 5 * 1024 * 1024) { // 5MB
          throw new ErrorResponse(400, 'Kích thước ảnh không được vượt quá 5MB');
        }
      }

      if (req.file) {
        try {
          if (process.env.CLOUDINARY_NAME && process.env.CLOUDINARY_KEY && process.env.CLOUDINARY_SECRET) {
            const uploadResult = await new Promise((resolve, reject) => {
              const uploadStream = cloudinary.uploader.upload_stream(
                {
                  folder: 'LabHub/mentors',
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
            const fileData = req.file.buffer.toString('base64');
            const mimeType = req.file.mimetype;
            body.image = `data:${mimeType};base64,${fileData}`;
          }
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          const fileData = req.file.buffer.toString('base64');
          const mimeType = req.file.mimetype;
          body.image = `data:${mimeType};base64,${fileData}`;
        }
      }

      if (typeof body.emergencyContact === 'string') {
        try {
          body.emergencyContact = JSON.parse(body.emergencyContact);
        } catch (e) {
        }
      }

      if (body.password) {
        body.passwordHash = bcryptjs.hashSync(body.password, 10);
        delete body.password;
      }

      body.role = 'mentor';

      Object.keys(body).forEach(key => {
        if (body[key] === undefined || body[key] === 'undefined' || body[key] === null || body[key] === 'null') {
          delete body[key];
        }
      });

      const mentor = await UserModel.findByIdAndUpdate(id, body, {
        new: true,
      }).select('-passwordHash');

      if (body.labId !== undefined) {
        await LabModel.updateMany(
          { mentor: id },
          { $unset: { mentor: "" } }
        );
        
        if (body.labId && body.labId.trim() && /^[0-9a-fA-F]{24}$/.test(String(body.labId))) {
          await LabModel.findByIdAndUpdate(
            body.labId,
            { $set: { mentor: id } }
          );
        }
      }

      return res.status(200).json(mentor);
    } catch (error) {
      if (error instanceof ErrorResponse) {
        throw error;
      }
      console.error('Error in updateMentor:', error);
      throw new ErrorResponse(500, 'Lỗi khi cập nhật mentor');
    }
  },

  searchMentors: async (req, res) => {
    try {
      const { keyword } = req.query;

      if (!keyword || keyword.trim().length === 0) {
        return res.status(200).json({ mentors: [] });
      }

      const keywordTrimmed = keyword.trim();
      if (keywordTrimmed.length > 100) {
        throw new ErrorResponse(400, 'Từ khóa tìm kiếm không được vượt quá 100 ký tự');
      }

      const escapedKeyword = keywordTrimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = { $regex: escapedKeyword, $options: 'i' };
      const query = {
        role: 'mentor',
        $or: [
          { fullName: searchRegex },
          { email: searchRegex },
          { phoneNumber: searchRegex },
        ],
      };

      const mentors = await UserModel.find(query)
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      const mentorsWithLabs = await Promise.all(
        mentors.map(async (mentor) => {
          const labCount = await LabModel.countDocuments({ mentor: mentor._id, status: 'active' });
          return {
            ...mentor,
            labCount,
          };
        })
      );

      return res.status(200).json({ mentors: mentorsWithLabs });
    } catch (error) {
      console.error('Error in searchMentors:', error);
      throw new ErrorResponse(500, 'Lỗi khi tìm kiếm mentor');
    }
  },
};

