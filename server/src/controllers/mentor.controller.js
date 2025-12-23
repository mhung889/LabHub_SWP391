// Load biến môi trường từ file .env
require('dotenv').config();
// Import thư viện bcryptjs để mã hóa mật khẩu
const bcryptjs = require('bcryptjs');
// Import cấu hình Cloudinary để upload ảnh
const cloudinary = require('../config/cloudinary');
// Import model User để thao tác với dữ liệu người dùng
const UserModel = require('../models/user-model');
// Import model Lab để thao tác với dữ liệu phòng lab
const LabModel = require('../models/lab-model');
// Import model Student để thao tác với dữ liệu sinh viên
const StudentModel = require('../models/student-model');
// Import model LabAttendance để thao tác với dữ liệu điểm danh
const LabAttendanceModel = require('../models/lab-attendance-model');
// Import class ErrorResponse để xử lý lỗi
const ErrorResponse = require('../helpers/ErrorResponse');

/**
 * Hàm kiểm tra xem một ngày có phải là hôm nay không
 * @param {Date|string} date - Ngày cần kiểm tra
 * @returns {boolean} - true nếu là hôm nay, false nếu không
 */
const isToday = (date) => {
  // Nếu không có date, trả về false
  if (!date) return false;

  // Chuyển đổi date thành đối tượng Date
  const d = new Date(date);
  // Lấy ngày hiện tại
  const today = new Date();

  // So sánh năm, tháng và ngày
  return (
    d.getFullYear() === today.getFullYear() &&  // So sánh năm
    d.getMonth() === today.getMonth() &&        // So sánh tháng
    d.getDate() === today.getDate()             // So sánh ngày
  );
};

// Export các hàm xử lý liên quan đến mentor
module.exports = {
  /**
   * Hàm lấy danh sách mentor với phân trang, tìm kiếm và lọc theo trạng thái
   * @param {Object} req - Request object chứa query parameters
   * @param {Object} res - Response object để trả về kết quả
   */
  getMentors: async (req, res) => {
    try {
      // Lấy các tham số từ query string: từ khóa tìm kiếm, số trang, số lượng mỗi trang, trạng thái
      const { search, page = 1, limit = 20, status } = req.query;
      
      // Chuyển đổi số trang sang số nguyên, đảm bảo tối thiểu là 1
      const pageNum = Math.max(1, parseInt(page)) || 1;
      // Chuyển đổi số lượng mỗi trang sang số nguyên, giới hạn tối đa 100, tối thiểu 1, mặc định 20
      const limitNum = Math.min(100, Math.max(1, parseInt(limit))) || 20; // Max 100, min 1
      // Tính số bản ghi cần bỏ qua (skip) dựa trên số trang và số lượng mỗi trang
      const skip = (pageNum - 1) * limitNum;

      // Khởi tạo query object với điều kiện role phải là 'mentor'
      const query = { role: 'mentor' };

      // Xử lý filter theo trạng thái (status)
      // Kiểm tra nếu status được truyền vào và không phải null/undefined
      if (status !== undefined && status !== null && String(status).trim()) {
        // Chuyển đổi status sang chữ thường và loại bỏ khoảng trắng
        const statusValue = String(status).trim().toLowerCase();
        // Kiểm tra status có hợp lệ không (chỉ chấp nhận 'active' hoặc 'inactive')
        if (statusValue === 'active' || statusValue === 'inactive') {
          // Thêm điều kiện status vào query
          query.status = statusValue;
          // Log để debug
          console.log('Status filter applied:', statusValue);
        } else {
          // Nếu status không hợp lệ, throw lỗi
          throw new ErrorResponse(400, 'Trạng thái không hợp lệ. Chỉ chấp nhận: active hoặc inactive');
        }
      } else {
        // Nếu không có status filter, log để debug
        console.log('No status filter provided');
      }

      // Xử lý tìm kiếm theo từ khóa
      // Kiểm tra nếu có từ khóa tìm kiếm được truyền vào
      if (search !== undefined && search !== null && String(search).trim()) {
        // Chuyển đổi search sang string và loại bỏ khoảng trắng
        const searchTerm = String(search).trim();
        // Kiểm tra độ dài từ khóa tìm kiếm (từ 1 đến 100 ký tự)
        if (searchTerm.length > 0 && searchTerm.length <= 100) {
          // Escape các ký tự đặc biệt trong regex để tránh lỗi
          const escapedSearch = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          
          // Tạo điều kiện tìm kiếm: tìm trong fullName, email hoặc phoneNumber (không phân biệt hoa thường)
          const searchConditions = {
            $or: [
              { fullName: { $regex: escapedSearch, $options: 'i' } },      // Tìm trong họ tên
              { email: { $regex: escapedSearch, $options: 'i' } },          // Tìm trong email
              { phoneNumber: { $regex: escapedSearch, $options: 'i' } },    // Tìm trong số điện thoại
            ]
          };
          
          // Nếu đã có filter theo status, kết hợp với điều kiện tìm kiếm bằng $and
          if (query.status) {
            // Lưu giá trị status hiện tại
            const statusValue = query.status;
            // Tạo query $and để kết hợp role, status và search conditions
            query.$and = [
              { role: 'mentor' },           // Điều kiện role
              { status: statusValue },      // Điều kiện status
              searchConditions              // Điều kiện tìm kiếm
            ];
            // Xóa các field cũ vì đã chuyển vào $and
            delete query.status;
            delete query.role;
            // Log để debug
            console.log('Combined status and search in $and');
          } else {
            // Nếu không có status filter, chỉ thêm điều kiện tìm kiếm vào $or
            query.$or = searchConditions.$or;
            // Log để debug
            console.log('Search only, no status filter');
          }
        } else if (searchTerm.length > 100) {
          // Nếu từ khóa quá dài, throw lỗi
          throw new ErrorResponse(400, 'Từ khóa tìm kiếm không được vượt quá 100 ký tự');
        }
      } else {
        // Nếu không có từ khóa tìm kiếm, log để debug
        console.log('No search term provided');
      }

      // Log thông tin query để debug
      console.log('=== MENTOR QUERY DEBUG ===');
      console.log('Query params received:', { search, page, limit, status });
      console.log('Final query object:', JSON.stringify(query, null, 2));
      console.log('Query keys:', Object.keys(query));
      if (query.status) console.log('Status in query:', query.status);
      if (query.$and) console.log('$and in query:', JSON.stringify(query.$and, null, 2));
      console.log('========================');

      // Tìm kiếm mentors trong database với các điều kiện đã xây dựng
      const mentors = await UserModel.find(query)
        .select('-passwordHash')              // Loại bỏ passwordHash khỏi kết quả
        .sort({ createdAt: -1 })              // Sắp xếp theo thời gian tạo mới nhất trước
        .skip(skip)                           // Bỏ qua số bản ghi theo phân trang
        .limit(limitNum)                      // Giới hạn số lượng bản ghi trả về
        .lean();                              // Trả về plain object thay vì Mongoose document
      
      // Log số lượng mentors tìm được và trạng thái của chúng
      console.log('Mentors found:', mentors.length);
      console.log('Mentors statuses:', mentors.map(m => ({ id: m._id, status: m.status })));

      // Thêm thông tin số lượng lab cho mỗi mentor
      const mentorsWithLabs = await Promise.all(
        // Duyệt qua từng mentor
        mentors.map(async (mentor) => {
          // Đếm số lượng lab active mà mentor này quản lý
          const labCount = await LabModel.countDocuments({ mentor: mentor._id, status: 'active' });
          // Trả về object mentor kèm theo labCount
          return {
            ...mentor,      // Spread tất cả thuộc tính của mentor
            labCount,       // Thêm số lượng lab
          };
        })
      );

      // Đếm tổng số mentors thỏa mãn điều kiện query (không phân trang)
      const total = await UserModel.countDocuments(query);

      // Trả về kết quả với danh sách mentors và thông tin phân trang
      return res.status(200).json({
        mentors: mentorsWithLabs,              // Danh sách mentors kèm số lượng lab
        pagination: {
          total,                               // Tổng số mentors
          page: pageNum,                       // Trang hiện tại
          limit: limitNum,                     // Số lượng mỗi trang
          totalPages: Math.ceil(total / limitNum),  // Tổng số trang
        },
      });
    } catch (error) {
      // Xử lý lỗi: log lỗi và throw ErrorResponse
      console.error('Error in getMentors:', error);
      throw new ErrorResponse(500, 'Lỗi khi lấy danh sách mentor');
    }
  },

  /**
   * Hàm lấy thông tin chi tiết của một mentor theo ID
   * @param {Object} req - Request object chứa mentor ID trong params
   * @param {Object} res - Response object để trả về kết quả
   */
  getMentorById: async (req, res) => {
    try {
      // Lấy ID mentor từ params
      const { id } = req.params;

      // Validate ID: phải là MongoDB ObjectId hợp lệ (24 ký tự hex)
      if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
        throw new ErrorResponse(400, 'ID mentor không hợp lệ');
      }

      // Tìm mentor trong database theo ID
      const mentor = await UserModel.findById(id)
        .select('-passwordHash')    // Loại bỏ passwordHash khỏi kết quả
        .lean();                    // Trả về plain object

      // Kiểm tra mentor có tồn tại và có role là 'mentor' không
      if (!mentor || mentor.role !== 'mentor') {
        throw new ErrorResponse(404, 'Không tìm thấy mentor');
      }

      // Tìm tất cả lab active mà mentor này quản lý
      const labs = await LabModel.find({ mentor: id, status: 'active' })
        .select('_id name code description major')  // Chỉ lấy các field cần thiết
        .lean();                                     // Trả về plain object

      // Trả về thông tin mentor kèm danh sách labs và số lượng lab
      return res.status(200).json({
        ...mentor,              // Spread tất cả thuộc tính của mentor
        labs,                   // Danh sách labs
        labCount: labs.length,  // Số lượng lab
      });
    } catch (error) {
      // Nếu lỗi là ErrorResponse, throw lại
      if (error instanceof ErrorResponse) {
        throw error;
      }
      // Log lỗi và throw ErrorResponse mới
      console.error('Error in getMentorById:', error);
      throw new ErrorResponse(500, 'Lỗi khi lấy thông tin mentor');
    }
  },

  /**
   * Hàm tạo mentor mới
   * @param {Object} req - Request object chứa thông tin mentor trong body và file ảnh (nếu có)
   * @param {Object} res - Response object để trả về kết quả
   */
  createMentor: async (req, res) => {
    try {
      // Lấy các thông tin từ request body
      const { email, password, fullName, phoneNumber, dateOfBirth, gender, address, labId } = req.body;

      // Validate email: bắt buộc và không được để trống
      if (!email || !email.trim()) {
        throw new ErrorResponse(400, 'Email là bắt buộc');
      }
      // Validate password: bắt buộc và không được để trống
      if (!password || !password.trim()) {
        throw new ErrorResponse(400, 'Mật khẩu là bắt buộc');
      }
      // Validate fullName: bắt buộc và không được để trống
      if (!fullName || !fullName.trim()) {
        throw new ErrorResponse(400, 'Họ tên là bắt buộc');
      }

      // Validate định dạng email bằng regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        throw new ErrorResponse(400, 'Email không đúng định dạng');
      }
      // Validate độ dài email: không được vượt quá 100 ký tự
      if (email.trim().length > 100) {
        throw new ErrorResponse(400, 'Email không được vượt quá 100 ký tự');
      }

      // Validate độ dài password: tối thiểu 8 ký tự
      if (password.length < 8) {
        throw new ErrorResponse(400, 'Mật khẩu phải có ít nhất 8 ký tự');
      }
      // Validate độ dài password: tối đa 64 ký tự
      if (password.length > 64) {
        throw new ErrorResponse(400, 'Mật khẩu không được vượt quá 64 ký tự');
      }

      // Validate độ dài fullName: tối thiểu 2 ký tự
      if (fullName.trim().length < 2) {
        throw new ErrorResponse(400, 'Họ tên phải có ít nhất 2 ký tự');
      }
      // Validate độ dài fullName: tối đa 100 ký tự
      if (fullName.trim().length > 100) {
        throw new ErrorResponse(400, 'Họ tên không được vượt quá 100 ký tự');
      }

      // Validate phoneNumber (nếu có)
      if (phoneNumber && phoneNumber.trim()) {
        // Regex để kiểm tra số điện thoại: 10-11 chữ số
        const phoneRegex = /^[0-9]{10,11}$/;
        // Loại bỏ khoảng trắng và dấu gạch ngang trước khi kiểm tra
        if (!phoneRegex.test(phoneNumber.trim().replace(/[\s-]/g, ''))) {
          throw new ErrorResponse(400, 'Số điện thoại không hợp lệ (10-11 chữ số)');
        }
        // Validate độ dài: không được vượt quá 20 ký tự
        if (phoneNumber.trim().length > 20) {
          throw new ErrorResponse(400, 'Số điện thoại không được vượt quá 20 ký tự');
        }
      }

      // Validate dateOfBirth (nếu có)
      if (dateOfBirth) {
        // Chuyển đổi dateOfBirth sang đối tượng Date
        const birthDate = new Date(dateOfBirth);
        // Lấy ngày hiện tại
        const today = new Date();
        // Ngày tối thiểu cho phép: 1900-01-01
        const minDate = new Date('1900-01-01');
        
        // Kiểm tra date có hợp lệ không
        if (isNaN(birthDate.getTime())) {
          throw new ErrorResponse(400, 'Ngày sinh không hợp lệ');
        }
        // Kiểm tra ngày sinh không được là tương lai
        if (birthDate > today) {
          throw new ErrorResponse(400, 'Ngày sinh không thể là tương lai');
        }
        // Kiểm tra ngày sinh không được quá cũ (trước 1900)
        if (birthDate < minDate) {
          throw new ErrorResponse(400, 'Ngày sinh không hợp lệ');
        }
        // Tính tuổi dựa trên năm
        const age = today.getFullYear() - birthDate.getFullYear();
        // Kiểm tra mentor phải ít nhất 18 tuổi (tính cả tháng và ngày)
        if (age < 18 || (age === 18 && today.getMonth() < birthDate.getMonth()) || 
            (age === 18 && today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) {
          throw new ErrorResponse(400, 'Mentor phải ít nhất 18 tuổi');
        }
      }

      // Validate gender (nếu có): chỉ chấp nhận 'male', 'female', 'other'
      if (gender && !['male', 'female', 'other'].includes(gender)) {
        throw new ErrorResponse(400, 'Giới tính không hợp lệ');
      }

      // Validate address (nếu có): không được vượt quá 255 ký tự
      if (address && address.trim().length > 255) {
        throw new ErrorResponse(400, 'Địa chỉ không được vượt quá 255 ký tự');
      }

      // Kiểm tra email đã tồn tại trong database chưa
      const exists = await UserModel.findOne({ email: email.trim().toLowerCase() });
      if (exists) {
        throw new ErrorResponse(400, 'Email đã tồn tại');
      }

      // Validate file ảnh (nếu có)
      if (req.file) {
        // Danh sách các loại file ảnh được phép
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        // Kiểm tra loại file có hợp lệ không
        if (!allowedMimeTypes.includes(req.file.mimetype)) {
          throw new ErrorResponse(400, 'Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)');
        }
        // Kiểm tra kích thước file: không được vượt quá 5MB
        if (req.file.size > 5 * 1024 * 1024) { // 5MB
          throw new ErrorResponse(400, 'Kích thước ảnh không được vượt quá 5MB');
        }
      }

      // Mã hóa mật khẩu bằng bcrypt với salt rounds = 10
      const passwordHash = bcryptjs.hashSync(password, 10);

      // Khởi tạo biến lưu URL ảnh
      let imageUrl = undefined;
      // Xử lý upload ảnh nếu có file
      if (req.file) {
        try {
          // Kiểm tra xem có cấu hình Cloudinary không
          if (process.env.CLOUDINARY_NAME && process.env.CLOUDINARY_KEY && process.env.CLOUDINARY_SECRET) {
            // Upload ảnh lên Cloudinary
            const uploadResult = await new Promise((resolve, reject) => {
              // Tạo upload stream với các tùy chọn
              const uploadStream = cloudinary.uploader.upload_stream(
                {
                  folder: 'LabHub/mentors',        // Thư mục lưu trữ trên Cloudinary
                  resource_type: 'image',          // Loại resource là ảnh
                  transformation: [
                    { width: 500, height: 500, crop: 'limit' },  // Resize ảnh tối đa 500x500
                    { quality: 'auto' }                           // Tự động điều chỉnh chất lượng
                  ]
                },
                // Callback khi upload xong
                (error, result) => {
                  if (error) reject(error);        // Nếu có lỗi, reject promise
                  else resolve(result);            // Nếu thành công, resolve với result
                }
              );
              // Ghi dữ liệu file vào stream
              uploadStream.end(req.file.buffer);
            });
            // Lấy URL ảnh từ kết quả upload
            imageUrl = uploadResult.secure_url;
          } else {
            // Nếu không có Cloudinary, chuyển ảnh sang base64
            const fileData = req.file.buffer.toString('base64');
            const mimeType = req.file.mimetype;
            // Tạo data URL từ base64
            imageUrl = `data:${mimeType};base64,${fileData}`;
          }
        } catch (uploadError) {
          // Nếu upload lỗi, log lỗi và fallback về base64
          console.error('Error uploading image:', uploadError);
          const fileData = req.file.buffer.toString('base64');
          const mimeType = req.file.mimetype;
          imageUrl = `data:${mimeType};base64,${fileData}`;
        }
      }

      // Tạo object chứa dữ liệu mentor
      const mentorData = {
        email: email.trim().toLowerCase(),                    // Email chuyển sang chữ thường
        passwordHash,                                         // Mật khẩu đã mã hóa
        fullName: fullName.trim(),                            // Họ tên đã trim
        role: 'mentor',                                       // Role mặc định là mentor
        status: 'active',                                     // Trạng thái mặc định là active
        phoneNumber: phoneNumber ? phoneNumber.trim().replace(/[\s-]/g, '') : undefined,  // Số điện thoại đã làm sạch
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,  // Ngày sinh chuyển sang Date object
        gender: gender || undefined,                          // Giới tính
        address: address ? address.trim() : undefined,        // Địa chỉ đã trim
        image: imageUrl,                                      // URL ảnh
      };

      // Loại bỏ các field có giá trị undefined khỏi object
      Object.keys(mentorData).forEach(key => {
        if (mentorData[key] === undefined) {
          delete mentorData[key];
        }
      });

      // Tạo mentor mới trong database
      const mentor = await UserModel.create(mentorData);

      // Nếu có labId, gán mentor cho lab đó
      if (labId && /^[0-9a-fA-F]{24}$/.test(String(labId))) {
        // Xóa mentor khỏi tất cả lab hiện tại (đảm bảo mỗi mentor chỉ quản lý 1 lab)
        await LabModel.updateMany(
          { mentor: mentor._id },
          { $unset: { mentor: "" } }
        );
        // Gán mentor cho lab mới
        await LabModel.findByIdAndUpdate(
          labId,
          { $set: { mentor: mentor._id } }
        );
      }

      // Trả về kết quả (loại bỏ passwordHash)
      return res.status(201).json({
        ...mentor.toObject(),        // Spread tất cả thuộc tính của mentor
        passwordHash: undefined,     // Xóa passwordHash khỏi response
      });
    } catch (error) {
      if (error instanceof ErrorResponse) {
        throw error;
      }
      console.error('Error in createMentor:', error);
      throw new ErrorResponse(500, 'Lỗi khi tạo mentor');
    }
  },

  /**
   * Hàm cập nhật thông tin mentor
   * @param {Object} req - Request object chứa mentor ID trong params và dữ liệu cập nhật trong body
   * @param {Object} res - Response object để trả về kết quả
   */
  updateMentor: async (req, res) => {
    try {
      // Lấy ID mentor từ params
      const { id } = req.params;
      // Copy dữ liệu từ request body
      let body = { ...req.body };

      // Validate ID: phải là MongoDB ObjectId hợp lệ
      if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
        throw new ErrorResponse(400, 'ID mentor không hợp lệ');
      }

      // Tìm mentor hiện tại trong database
      const existingMentor = await UserModel.findById(id);
      // Kiểm tra mentor có tồn tại và có role là 'mentor' không
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
  getMentorAttendance: async (req, res) => {
    try {
      const mentorId = req.user.id;
      const { date, from, to, status } = req.query;

      const lab = await LabModel.findOne({
        mentor: mentorId,
        status: 'active',
      }).lean();

      if (!lab) {
        throw new ErrorResponse(404, 'Bạn chưa được phân công phòng lab nào');
      }

      const students = await StudentModel.find({ lab: lab._id })
        .populate('user', 'fullName email')
        .select('_id studentCode user')
        .lean();

      const studentIds = students.map(s => s._id);

      const filter = {
        lab: lab._id,
        student: { $in: studentIds },
      };

      if (date) filter.date = new Date(date);
      if (from && to) {
        filter.date = {
          $gte: new Date(from),
          $lte: new Date(to),
        };
      }
      if (status) filter.status = status;

      const attendances = await LabAttendanceModel.find(filter)
        .populate({
          path: 'student',
          select: 'studentCode user',
          populate: {
            path: 'user',
            select: 'fullName',
          },
        })
        .sort({ date: -1 })
        .lean();

      return res.status(200).json({
        lab: {
          id: lab._id,
          name: lab.name,
          code: lab.code,
          time: `${lab.startTime} - ${lab.endTime}`,
          attendanceRule: lab.attendanceRule,
        },
        totalStudents: students.length,
        records: attendances,
      });
    } catch (error) {
      console.error('Error in getMentorAttendance:', error);
      if (error instanceof ErrorResponse) throw error;
      throw new ErrorResponse(500, 'Lỗi khi lấy dữ liệu điểm danh');
    }
  },
  // Mentor hỗ trợ chỉnh check-in time
updateCheckInTime: async (req, res) => {
  try {
    const mentorId = req.user.id;
    const { id } = req.params;
    const { checkInTime } = req.body;

    if (!checkInTime) {
      throw new ErrorResponse(400, "checkInTime là bắt buộc");
    }

    const attendance = await LabAttendanceModel
      .findById(id)
      .populate("lab");

    if (!attendance) {
      throw new ErrorResponse(404, "Không tìm thấy attendance");
    }

    // ✔ đúng mentor của lab
    if (!attendance.lab || String(attendance.lab.mentor) !== mentorId) {
      throw new ErrorResponse(403, "Không có quyền chỉnh attendance này");
    }

    // ❌ chỉ cho sửa trong ngày
    if (!isToday(attendance.date)) {
      throw new ErrorResponse(400, "Chỉ được hỗ trợ check-in trong ngày");
    }

    // ❌ không cho ghi đè
    if (attendance.checkInTime) {
      throw new ErrorResponse(400, "Sinh viên đã check-in");
    }

    attendance.checkInTime = new Date(checkInTime);
    await attendance.save();

    return res.status(200).json({
      message: "Đã hỗ trợ check-in thành công",
    });
  } catch (error) {
    console.error("Error in updateCheckInTime:", error);
    if (error instanceof ErrorResponse) throw error;
    throw new ErrorResponse(500, "Lỗi khi cập nhật check-in time");
  }
},

  // Mentor hỗ trợ chỉnh check-out time
updateCheckOutTime: async (req, res) => {
  try {
    const mentorId = req.user.id;
    const { id } = req.params;
    const { checkOutTime } = req.body;

    if (!checkOutTime) {
      throw new ErrorResponse(400, "checkOutTime là bắt buộc");
    }

    const attendance = await LabAttendanceModel
      .findById(id)
      .populate("lab");

    if (!attendance) {
      throw new ErrorResponse(404, "Không tìm thấy attendance");
    }

    // ✔ đúng mentor của lab
    if (!attendance.lab || String(attendance.lab.mentor) !== mentorId) {
      throw new ErrorResponse(403, "Không có quyền chỉnh attendance này");
    }

    // ❌ chỉ cho sửa trong ngày
    if (!isToday(attendance.date)) {
      throw new ErrorResponse(400, "Chỉ được hỗ trợ check-out trong ngày");
    }

    // ❌ chưa check-in thì không cho check-out
    if (!attendance.checkInTime) {
      throw new ErrorResponse(400, "Sinh viên chưa check-in");
    }

    // ❌ không cho ghi đè
    if (attendance.checkOutTime) {
      throw new ErrorResponse(400, "Sinh viên đã check-out");
    }

    attendance.checkOutTime = new Date(checkOutTime);
    await attendance.save();

    return res.status(200).json({
      message: "Đã hỗ trợ check-out thành công",
    });
  } catch (error) {
    console.error("Error in updateCheckOutTime:", error);
    if (error instanceof ErrorResponse) throw error;
    throw new ErrorResponse(500, "Lỗi khi cập nhật check-out time");
  }
},
};

