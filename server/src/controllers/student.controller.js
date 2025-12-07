const Student = require("../models/student-model");
const User = require("../models/user-model");
const bcrypt = require("bcrypt");

// =====================================
// 1️⃣ GET ALL STUDENTS
// =====================================
exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .populate("user", "fullName email phoneNumber gender")
      .populate("lab", "name code")
      .populate("major", "name code"); // ⭐ THÊM POPULATE MAJOR

    return res.json(students);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

// =====================================
// 2️⃣ GET ONE STUDENT
// =====================================
exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate("user")
      .populate("lab")
      .populate("major", "name code"); // ⭐ THÊM MAJOR

    if (!student)
      return res.status(404).json({ message: "Student not found" });

    return res.json(student);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

// =====================================
// 3️⃣ CREATE STUDENT (User + Student)
// =====================================
exports.createStudent = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      phoneNumber,
      gender,
      address,
      studentCode,
      majorId,   // ⭐ DÙNG majorId
      startDate,
    } = req.body;

    // 1. Check email duplicate
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email already exists" });

    // 2. Create User
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName,
      email,
      passwordHash,
      phoneNumber,
      gender,
      address,
      role: "student",
      status: "active",
    });

    // 3. Create Student profile
    const student = await Student.create({
      user: user._id,
      studentCode,
      major: majorId || null,   // ⭐ GÁN major đúng chuẩn
      startDate,
      labStatus: "none",
      lab: null,
    });

    return res.status(201).json({
      message: "Student created successfully",
      student,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

// =====================================
// 4️⃣ UPDATE STUDENT (User + Student)
// =====================================
exports.updateStudent = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phoneNumber,
      gender,
      address,
      studentCode,
      majorId,   // ⭐ DÙNG majorId
      startDate,
    } = req.body;

    const { id } = req.params;

    // 1. Find student
    const student = await Student.findById(id).populate("user");
    if (!student)
      return res.status(404).json({ message: "Student not found" });

    // 2. Check duplicate email
    if (email && email !== student.user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser)
        return res.status(400).json({ message: "Email already exists" });
    }

    // 3. Check duplicate studentCode
    if (studentCode && studentCode !== student.studentCode) {
      const existingStudent = await Student.findOne({
        studentCode,
        _id: { $ne: id },
      });
      if (existingStudent) {
        return res.status(400).json({
          message: "Mã sinh viên đã tồn tại. Vui lòng dùng mã khác.",
        });
      }
    }

    // 4. Update User info
    if (fullName) student.user.fullName = fullName;
    if (email) student.user.email = email;
    if (phoneNumber) student.user.phoneNumber = phoneNumber;
    if (gender) student.user.gender = gender;
    if (address) student.user.address = address;
    await student.user.save();

    // 5. Update Student info
    if (studentCode) student.studentCode = studentCode;
    if (majorId) student.major = majorId;   // ⭐ Update major
    if (startDate) student.startDate = startDate;

    await student.save();

    // 6. Return updated with populate
    const updated = await Student.findById(id)
      .populate("user", "fullName email phoneNumber gender address")
      .populate("lab", "name code")
      .populate("major", "name code");  // ⭐ POPULATE

    return res.json({
      message: "Student updated successfully",
      student: updated,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

// =====================================
// 5️⃣ DELETE STUDENT
// =====================================
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student)
      return res.status(404).json({ message: "Student not found" });

    // Delete user linked
    await User.findByIdAndDelete(student.user);

    // Delete student profile
    await Student.findByIdAndDelete(req.params.id);

    return res.json({ message: "Student deleted successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
