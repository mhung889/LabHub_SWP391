const MajorModel = require('../models/major-model');
const StudentModel = require('../models/student-model');
const LabModel = require('../models/lab-model');
const ErrorResponse = require('../helpers/ErrorResponse');

exports.getAllMajors = async (req, res) => {
  try {
    const { page = 1, limit = 100, search, status } = req.query;
    const pageNum = Math.max(1, parseInt(page)) || 1;
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))) || 100;
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    const majors = await MajorModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await MajorModel.countDocuments(query);

    return res.status(200).json({
      majors,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error in getAllMajors:', error);
    throw new ErrorResponse(500, 'Lỗi khi lấy danh sách chuyên ngành');
  }
};

exports.getMajorById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      throw new ErrorResponse(400, 'ID chuyên ngành không hợp lệ');
    }

    const major = await MajorModel.findById(id).lean();

    if (!major) {
      throw new ErrorResponse(404, 'Không tìm thấy chuyên ngành');
    }

    // Get count of students and labs using this major
    const studentCount = await StudentModel.countDocuments({ major: id });
    const labCount = await LabModel.countDocuments({ major: id });

    return res.status(200).json({
      major: {
        ...major,
        studentCount,
        labCount,
      },
    });
  } catch (error) {
    if (error instanceof ErrorResponse) {
      throw error;
    }
    console.error('Error in getMajorById:', error);
    throw new ErrorResponse(500, 'Lỗi khi lấy thông tin chuyên ngành');
  }
};

exports.createMajor = async (req, res) => {
  try {
    const { name, code, description } = req.body;

    if (!name || !name.trim()) {
      throw new ErrorResponse(400, 'Tên chuyên ngành là bắt buộc');
    }

    if (!code || !code.trim()) {
      throw new ErrorResponse(400, 'Mã chuyên ngành là bắt buộc');
    }

    // Check if name already exists
    const existingName = await MajorModel.findOne({
      name: name.trim(),
    });

    if (existingName) {
      throw new ErrorResponse(400, 'Tên chuyên ngành đã tồn tại');
    }

    // Check if code already exists
    const existingCode = await MajorModel.findOne({
      code: code.trim().toUpperCase(),
    });

    if (existingCode) {
      throw new ErrorResponse(400, 'Mã chuyên ngành đã tồn tại');
    }

    const major = await MajorModel.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description?.trim() || '',
    });

    return res.status(201).json({
      message: 'Tạo chuyên ngành thành công',
      major,
    });
  } catch (error) {
    if (error instanceof ErrorResponse) {
      throw error;
    }
    console.error('Error in createMajor:', error);
    if (error.code === 11000) {
      // Duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      throw new ErrorResponse(400, `${field === 'name' ? 'Tên' : 'Mã'} chuyên ngành đã tồn tại`);
    }
    throw new ErrorResponse(500, 'Lỗi khi tạo chuyên ngành');
  }
};

exports.updateMajor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description } = req.body;

    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      throw new ErrorResponse(400, 'ID chuyên ngành không hợp lệ');
    }

    const major = await MajorModel.findById(id);

    if (!major) {
      throw new ErrorResponse(404, 'Không tìm thấy chuyên ngành');
    }

    const updateData = {};

    if (name !== undefined) {
      if (!name || !name.trim()) {
        throw new ErrorResponse(400, 'Tên chuyên ngành là bắt buộc');
      }

      // Check if name already exists (excluding current major)
      const existingName = await MajorModel.findOne({
        name: name.trim(),
        _id: { $ne: id },
      });

      if (existingName) {
        throw new ErrorResponse(400, 'Tên chuyên ngành đã tồn tại');
      }

      updateData.name = name.trim();
    }

    if (code !== undefined) {
      if (!code || !code.trim()) {
        throw new ErrorResponse(400, 'Mã chuyên ngành là bắt buộc');
      }

      // Check if code already exists (excluding current major)
      const existingCode = await MajorModel.findOne({
        code: code.trim().toUpperCase(),
        _id: { $ne: id },
      });

      if (existingCode) {
        throw new ErrorResponse(400, 'Mã chuyên ngành đã tồn tại');
      }

      updateData.code = code.trim().toUpperCase();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || '';
    }

    const updatedMajor = await MajorModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    return res.status(200).json({
      message: 'Cập nhật chuyên ngành thành công',
      major: updatedMajor,
    });
  } catch (error) {
    if (error instanceof ErrorResponse) {
      throw error;
    }
    console.error('Error in updateMajor:', error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      throw new ErrorResponse(400, `${field === 'name' ? 'Tên' : 'Mã'} chuyên ngành đã tồn tại`);
    }
    throw new ErrorResponse(500, 'Lỗi khi cập nhật chuyên ngành');
  }
};

exports.deleteMajor = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      throw new ErrorResponse(400, 'ID chuyên ngành không hợp lệ');
    }

    const major = await MajorModel.findById(id);

    if (!major) {
      throw new ErrorResponse(404, 'Không tìm thấy chuyên ngành');
    }

    // Check if major is being used by students or labs
    const studentCount = await StudentModel.countDocuments({ major: id });
    const labCount = await LabModel.countDocuments({ major: id });

    if (studentCount > 0 || labCount > 0) {
      throw new ErrorResponse(
        400,
        `Không thể xóa chuyên ngành này vì đang được sử dụng bởi ${studentCount} sinh viên và ${labCount} lab`
      );
    }

    await MajorModel.findByIdAndDelete(id);

    return res.status(200).json({
      message: 'Xóa chuyên ngành thành công',
    });
  } catch (error) {
    if (error instanceof ErrorResponse) {
      throw error;
    }
    console.error('Error in deleteMajor:', error);
    throw new ErrorResponse(500, 'Lỗi khi xóa chuyên ngành');
  }
};

exports.searchMajors = async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword || keyword.trim().length < 1) {
      return res.status(200).json({
        majors: [],
      });
    }

    const majors = await MajorModel.find({
      $or: [
        { name: { $regex: keyword.trim(), $options: 'i' } },
        { code: { $regex: keyword.trim(), $options: 'i' } },
      ],
    })
      .limit(20)
      .lean();

    return res.status(200).json({
      majors,
    });
  } catch (error) {
    console.error('Error in searchMajors:', error);
    throw new ErrorResponse(500, 'Lỗi khi tìm kiếm chuyên ngành');
  }
};
