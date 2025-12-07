const Student = require("../models/student-model");
const User = require("../models/user-model");
const bcrypt = require("bcrypt");

// =====================================
// Generate unique student code HE + 6 digits
// =====================================
async function generateStudentCode() {
  let code;
  let exists = true;

  while (exists) {
    const random6 = Math.floor(Math.random() * 1_000_000)
      .toString()
      .padStart(6, "0");

    code = `HE${random6}`;
    exists = await Student.findOne({ studentCode: code });
  }

  return code;
}

// =====================================
// 1️⃣ GET ALL STUDENTS
// =====================================
exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .populate("user")
      .populate("lab", "name code")
      .populate("major", "name code");

    return res.json(students);
  } catch (err) {
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
      .populate("major", "name code");

    return res.json(student);
  } catch (err) {
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
      phoneNumber,
      gender,
      dateOfBirth,
      address,
      emergencyContact,
      majorId,
      startDate,
    } = req.body;

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Check duplicate email
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // 2. Create User with default password
    const passwordHash = await bcrypt.hash("123456", 10);

    const user = await User.create({
      fullName,
      email: normalizedEmail,
      passwordHash,
      phoneNumber,
      gender,
      dateOfBirth,
      address,
      emergencyContact,
      role: "student",
      status: "active",
    });

    // 3. Auto generate student code
    const studentCode = await generateStudentCode();

    // 4. Create Student profile
    const student = await Student.create({
      user: user._id,
      studentCode,
      major: majorId || null,
      startDate,
      labStatus: "none",
      lab: null,
    });

    return res.status(201).json({
      message: "Student created successfully",
      student,
    });

  } catch (err) {
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
      dateOfBirth,
      address,
      emergencyContact,
      majorId,
      startDate,
      studentCode,
    } = req.body;

    const { id } = req.params;

    // 1. Find student
    const student = await Student.findById(id).populate("user");
    if (!student)
      return res.status(404).json({ message: "Student not found" });

    // 2. Check duplicate email
    if (email && email !== student.user.email) {
      const normalizedEmail = email.trim().toLowerCase();
      const existingUser = await User.findOne({ email: normalizedEmail });

      if (existingUser)
        return res.status(400).json({ message: "Email already exists" });

      student.user.email = normalizedEmail;
    }

    // 3. Update User info
    if (fullName) student.user.fullName = fullName;
    if (phoneNumber) student.user.phoneNumber = phoneNumber;
    if (gender) student.user.gender = gender;
    if (dateOfBirth) student.user.dateOfBirth = dateOfBirth;
    if (address) student.user.address = address;

    if (emergencyContact) {
      student.user.emergencyContact = {
        name: emergencyContact.name || student.user.emergencyContact?.name,
        relationship:
          emergencyContact.relationship ||
          student.user.emergencyContact?.relationship,
        phoneNumber:
          emergencyContact.phoneNumber ||
          student.user.emergencyContact?.phoneNumber,
      };
    }

    await student.user.save();

    // 4. Update Student info
    if (majorId) student.major = majorId;
    if (startDate) student.startDate = startDate;
    if (studentCode) student.studentCode = studentCode;

    await student.save();

    // 5. Return updated with populate
    const updated = await Student.findById(id)
      .populate("user")
      .populate("lab")
      .populate("major");

    return res.json({
      message: "Student updated successfully",
      student: updated,
    });

  } catch (err) {
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

    await User.findByIdAndDelete(student.user);
    await Student.findByIdAndDelete(req.params.id);

    return res.json({ message: "Student deleted successfully" });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
