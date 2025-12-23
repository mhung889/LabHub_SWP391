// Import model Major để thao tác với dữ liệu chuyên ngành
const MajorModel = require('../models/major-model');
// Import model Student để kiểm tra số lượng sinh viên sử dụng major
const StudentModel = require('../models/student-model');
// Import model Lab để kiểm tra số lượng lab sử dụng major
const LabModel = require('../models/lab-model');
// Import class ErrorResponse để xử lý lỗi
const ErrorResponse = require('../helpers/ErrorResponse');

/**
 * Hàm lấy danh sách tất cả chuyên ngành với phân trang và tìm kiếm
 * @param {Object} req - Request object chứa query parameters
 * @param {Object} res - Response object để trả về kết quả
 */
exports.getAllMajors = async (req, res) => {
  try {
    // Lấy các tham số từ query string: số trang, số lượng mỗi trang, từ khóa tìm kiếm, trạng thái
    const { page = 1, limit = 100, search, status } = req.query;
    // Chuyển đổi số trang sang số nguyên, đảm bảo tối thiểu là 1
    const pageNum = Math.max(1, parseInt(page)) || 1;
    // Chuyển đổi số lượng mỗi trang sang số nguyên, giới hạn tối đa 100, tối thiểu 1, mặc định 100
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))) || 100;
    // Tính số bản ghi cần bỏ qua (skip) dựa trên số trang và số lượng mỗi trang
    const skip = (pageNum - 1) * limitNum;

    // Khởi tạo query object rỗng
    const query = {};

    // Xử lý tìm kiếm theo từ khóa
    if (search) {
      // Tạo điều kiện tìm kiếm: tìm trong name hoặc code (không phân biệt hoa thường)
      query.$or = [
        { name: { $regex: search, $options: 'i' } },    // Tìm trong tên chuyên ngành
        { code: { $regex: search, $options: 'i' } },     // Tìm trong mã chuyên ngành
      ];
    }

    // Tìm kiếm majors trong database với các điều kiện đã xây dựng
    const majors = await MajorModel.find(query)
      .sort({ createdAt: -1 })      // Sắp xếp theo thời gian tạo mới nhất trước
      .skip(skip)                   // Bỏ qua số bản ghi theo phân trang
      .limit(limitNum)              // Giới hạn số lượng bản ghi trả về
      .lean();                      // Trả về plain object thay vì Mongoose document

    // Đếm tổng số majors thỏa mãn điều kiện query (không phân trang)
    const total = await MajorModel.countDocuments(query);

    // Trả về kết quả với danh sách majors và thông tin phân trang
    return res.status(200).json({
      majors,                       // Danh sách majors
      pagination: {
        total,                      // Tổng số majors
        page: pageNum,              // Trang hiện tại
        limit: limitNum,            // Số lượng mỗi trang
        totalPages: Math.ceil(total / limitNum),  // Tổng số trang
      },
    });
  } catch (error) {
    // Xử lý lỗi: log lỗi và throw ErrorResponse
    console.error('Error in getAllMajors:', error);
    throw new ErrorResponse(500, 'Lỗi khi lấy danh sách chuyên ngành');
  }
};

/**
 * Hàm lấy thông tin chi tiết của một chuyên ngành theo ID
 * @param {Object} req - Request object chứa major ID trong params
 * @param {Object} res - Response object để trả về kết quả
 */
exports.getMajorById = async (req, res) => {
  try {
    // Lấy ID chuyên ngành từ params
    const { id } = req.params;

    // Validate ID: phải là MongoDB ObjectId hợp lệ (24 ký tự hex)
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      throw new ErrorResponse(400, 'ID chuyên ngành không hợp lệ');
    }

    // Tìm chuyên ngành trong database theo ID
    const major = await MajorModel.findById(id).lean();

    // Kiểm tra chuyên ngành có tồn tại không
    if (!major) {
      throw new ErrorResponse(404, 'Không tìm thấy chuyên ngành');
    }

    // Đếm số lượng sinh viên đang sử dụng chuyên ngành này
    const studentCount = await StudentModel.countDocuments({ major: id });
    // Đếm số lượng lab đang sử dụng chuyên ngành này
    const labCount = await LabModel.countDocuments({ major: id });

    // Trả về thông tin chuyên ngành kèm số lượng sinh viên và lab
    return res.status(200).json({
      major: {
        ...major,              // Spread tất cả thuộc tính của major
        studentCount,         // Số lượng sinh viên
        labCount,             // Số lượng lab
      },
    });
  } catch (error) {
    // Nếu lỗi là ErrorResponse, throw lại
    if (error instanceof ErrorResponse) {
      throw error;
    }
    // Log lỗi và throw ErrorResponse mới
    console.error('Error in getMajorById:', error);
    throw new ErrorResponse(500, 'Lỗi khi lấy thông tin chuyên ngành');
  }
};

/**
 * Hàm tạo chuyên ngành mới
 * @param {Object} req - Request object chứa thông tin chuyên ngành trong body
 * @param {Object} res - Response object để trả về kết quả
 */
exports.createMajor = async (req, res) => {
  try {
    // Lấy các thông tin từ request body
    const { name, code, description } = req.body;

    // Validate name: bắt buộc và không được để trống
    if (!name || !name.trim()) {
      throw new ErrorResponse(400, 'Tên chuyên ngành là bắt buộc');
    }

    // Validate code: bắt buộc và không được để trống
    if (!code || !code.trim()) {
      throw new ErrorResponse(400, 'Mã chuyên ngành là bắt buộc');
    }

    // Kiểm tra tên chuyên ngành đã tồn tại chưa
    const existingName = await MajorModel.findOne({
      name: name.trim(),
    });

    // Nếu tên đã tồn tại, throw lỗi
    if (existingName) {
      throw new ErrorResponse(400, 'Tên chuyên ngành đã tồn tại');
    }

    // Kiểm tra mã chuyên ngành đã tồn tại chưa (chuyển sang chữ hoa để so sánh)
    const existingCode = await MajorModel.findOne({
      code: code.trim().toUpperCase(),
    });

    // Nếu mã đã tồn tại, throw lỗi
    if (existingCode) {
      throw new ErrorResponse(400, 'Mã chuyên ngành đã tồn tại');
    }

    // Tạo chuyên ngành mới trong database
    const major = await MajorModel.create({
      name: name.trim(),                           // Tên đã trim
      code: code.trim().toUpperCase(),            // Mã chuyển sang chữ hoa và trim
      description: description?.trim() || '',      // Mô tả (nếu có) hoặc chuỗi rỗng
    });

    // Trả về kết quả thành công
    return res.status(201).json({
      message: 'Tạo chuyên ngành thành công',
      major,
    });
  } catch (error) {
    // Nếu lỗi là ErrorResponse, throw lại
    if (error instanceof ErrorResponse) {
      throw error;
    }
    // Log lỗi
    console.error('Error in createMajor:', error);
    // Xử lý lỗi duplicate key (MongoDB error code 11000)
    if (error.code === 11000) {
      // Lấy field bị duplicate
      const field = Object.keys(error.keyPattern)[0];
      // Throw lỗi với thông báo phù hợp
      throw new ErrorResponse(400, `${field === 'name' ? 'Tên' : 'Mã'} chuyên ngành đã tồn tại`);
    }
    // Throw lỗi server
    throw new ErrorResponse(500, 'Lỗi khi tạo chuyên ngành');
  }
};

/**
 * Hàm cập nhật thông tin chuyên ngành
 * @param {Object} req - Request object chứa major ID trong params và dữ liệu cập nhật trong body
 * @param {Object} res - Response object để trả về kết quả
 */
exports.updateMajor = async (req, res) => {
  try {
    // Lấy ID chuyên ngành từ params
    const { id } = req.params;
    // Lấy dữ liệu cập nhật từ request body
    const { name, code, description } = req.body;

    // Validate ID: phải là MongoDB ObjectId hợp lệ
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      throw new ErrorResponse(400, 'ID chuyên ngành không hợp lệ');
    }

    // Tìm chuyên ngành hiện tại trong database
    const major = await MajorModel.findById(id);

    // Kiểm tra chuyên ngành có tồn tại không
    if (!major) {
      throw new ErrorResponse(404, 'Không tìm thấy chuyên ngành');
    }

    // Khởi tạo object chứa dữ liệu cập nhật
    const updateData = {};

    // Xử lý cập nhật name (nếu có)
    if (name !== undefined) {
      // Validate name không được để trống
      if (!name || !name.trim()) {
        throw new ErrorResponse(400, 'Tên chuyên ngành là bắt buộc');
      }

      // Kiểm tra tên đã tồn tại chưa (loại trừ chuyên ngành hiện tại)
      const existingName = await MajorModel.findOne({
        name: name.trim(),
        _id: { $ne: id },  // Loại trừ chuyên ngành hiện tại
      });

      // Nếu tên đã tồn tại, throw lỗi
      if (existingName) {
        throw new ErrorResponse(400, 'Tên chuyên ngành đã tồn tại');
      }

      // Thêm name vào updateData
      updateData.name = name.trim();
    }

    // Xử lý cập nhật code (nếu có)
    if (code !== undefined) {
      // Validate code không được để trống
      if (!code || !code.trim()) {
        throw new ErrorResponse(400, 'Mã chuyên ngành là bắt buộc');
      }

      // Kiểm tra mã đã tồn tại chưa (loại trừ chuyên ngành hiện tại)
      const existingCode = await MajorModel.findOne({
        code: code.trim().toUpperCase(),
        _id: { $ne: id },  // Loại trừ chuyên ngành hiện tại
      });

      // Nếu mã đã tồn tại, throw lỗi
      if (existingCode) {
        throw new ErrorResponse(400, 'Mã chuyên ngành đã tồn tại');
      }

      // Thêm code vào updateData (chuyển sang chữ hoa)
      updateData.code = code.trim().toUpperCase();
    }

    // Xử lý cập nhật description (nếu có)
    if (description !== undefined) {
      updateData.description = description?.trim() || '';
    }

    // Cập nhật chuyên ngành trong database
    const updatedMajor = await MajorModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true }  // Trả về document đã được cập nhật
    );

    // Trả về kết quả thành công
    return res.status(200).json({
      message: 'Cập nhật chuyên ngành thành công',
      major: updatedMajor,
    });
  } catch (error) {
    // Nếu lỗi là ErrorResponse, throw lại
    if (error instanceof ErrorResponse) {
      throw error;
    }
    // Log lỗi
    console.error('Error in updateMajor:', error);
    // Xử lý lỗi duplicate key
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      throw new ErrorResponse(400, `${field === 'name' ? 'Tên' : 'Mã'} chuyên ngành đã tồn tại`);
    }
    // Throw lỗi server
    throw new ErrorResponse(500, 'Lỗi khi cập nhật chuyên ngành');
  }
};

/**
 * Hàm xóa chuyên ngành
 * @param {Object} req - Request object chứa major ID trong params
 * @param {Object} res - Response object để trả về kết quả
 */
exports.deleteMajor = async (req, res) => {
  try {
    // Lấy ID chuyên ngành từ params
    const { id } = req.params;

    // Validate ID: phải là MongoDB ObjectId hợp lệ
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      throw new ErrorResponse(400, 'ID chuyên ngành không hợp lệ');
    }

    // Tìm chuyên ngành trong database
    const major = await MajorModel.findById(id);

    // Kiểm tra chuyên ngành có tồn tại không
    if (!major) {
      throw new ErrorResponse(404, 'Không tìm thấy chuyên ngành');
    }

    // Kiểm tra chuyên ngành có đang được sử dụng bởi sinh viên hoặc lab không
    const studentCount = await StudentModel.countDocuments({ major: id });
    const labCount = await LabModel.countDocuments({ major: id });

    // Nếu có sinh viên hoặc lab đang sử dụng, không cho phép xóa
    if (studentCount > 0 || labCount > 0) {
      throw new ErrorResponse(
        400,
        `Không thể xóa chuyên ngành này vì đang được sử dụng bởi ${studentCount} sinh viên và ${labCount} lab`
      );
    }

    // Xóa chuyên ngành khỏi database
    await MajorModel.findByIdAndDelete(id);

    // Trả về kết quả thành công
    return res.status(200).json({
      message: 'Xóa chuyên ngành thành công',
    });
  } catch (error) {
    // Nếu lỗi là ErrorResponse, throw lại
    if (error instanceof ErrorResponse) {
      throw error;
    }
    // Log lỗi và throw ErrorResponse mới
    console.error('Error in deleteMajor:', error);
    throw new ErrorResponse(500, 'Lỗi khi xóa chuyên ngành');
  }
};

/**
 * Hàm tìm kiếm chuyên ngành theo từ khóa
 * @param {Object} req - Request object chứa keyword trong query
 * @param {Object} res - Response object để trả về kết quả
 */
exports.searchMajors = async (req, res) => {
  try {
    // Lấy từ khóa tìm kiếm từ query string
    const { keyword } = req.query;

    // Nếu không có từ khóa hoặc từ khóa rỗng, trả về mảng rỗng
    if (!keyword || keyword.trim().length < 1) {
      return res.status(200).json({
        majors: [],
      });
    }

    // Tìm kiếm chuyên ngành theo từ khóa (tìm trong name hoặc code)
    const majors = await MajorModel.find({
      $or: [
        { name: { $regex: keyword.trim(), $options: 'i' } },   // Tìm trong tên (không phân biệt hoa thường)
        { code: { $regex: keyword.trim(), $options: 'i' } },   // Tìm trong mã (không phân biệt hoa thường)
      ],
    })
      .limit(20)    // Giới hạn tối đa 20 kết quả
      .lean();      // Trả về plain object

    // Trả về kết quả tìm kiếm
    return res.status(200).json({
      majors,
    });
  } catch (error) {
    // Xử lý lỗi: log lỗi và throw ErrorResponse
    console.error('Error in searchMajors:', error);
    throw new ErrorResponse(500, 'Lỗi khi tìm kiếm chuyên ngành');
  }
};
