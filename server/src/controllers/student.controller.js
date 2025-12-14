const Student = require("../models/student-model");
const User = require("../models/user-model");
const bcrypt = require("bcrypt");
const sendMail = require("../helpers/send.mail");

// =====================================
// Random Password (6 ký tự)
// =====================================
function generateRandomPassword(length = 6) {
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const all = lower + upper + numbers;

  let password = "";

  // đảm bảo gồm 3 loại ký tự
  password += lower[Math.floor(Math.random() * lower.length)];
  password += upper[Math.floor(Math.random() * upper.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];

  for (let i = 3; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

// =====================================
// GET ALL STUDENTS
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
// GET ONE STUDENT
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
// VALIDATE DOB
// =====================================
function validateDobOrThrow(dateOfBirth) {
  if (!dateOfBirth) throw new Error("Date of birth is required");

  const dob = new Date(dateOfBirth);
  const today = new Date();

  if (isNaN(dob.getTime())) throw new Error("Invalid date of birth");
  if (dob > today) throw new Error("Date of birth cannot be in the future");

  const age =
    today.getFullYear() -
    dob.getFullYear() -
    (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);

  if (age < 17) throw new Error("Student must be at least 17 years old");
}

// =====================================
// CREATE STUDENT (User + Student)
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
      studentCode,
    } = req.body;

    // Validate DOB
    try {
      validateDobOrThrow(dateOfBirth);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!studentCode?.trim()) {
      return res.status(400).json({ message: "Student code is required" });
    }

    const existingCode = await Student.findOne({ studentCode });
    if (existingCode)
      return res.status(400).json({ message: "Student code already exists" });

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser)
      return res.status(400).json({ message: "Email already exists" });

    // Generate password
    const plainPassword = generateRandomPassword(6);
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    // Create User
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

    // Create Student
    const student = await Student.create({
      user: user._id,
      studentCode,
      major: majorId || null,
      startDate,
      labStatus: "none",
      lab: null,
    });

    // =====================================
    // SEND EMAIL WITH PASSWORD
    // =====================================
    const senderName = process.env.EMAIL_NAME || "LabHub Support";

    await sendMail({
      to: normalizedEmail,
      subject: "Tài khoản LabHub của bạn đã được tạo",
      html: `
        <h2>Chào ${fullName},</h2>
        <p>Tài khoản LabHub của bạn đã được tạo thành công.</p>

        <p><b>Email đăng nhập:</b> ${normalizedEmail}</p>
        <p><b>Mật khẩu tạm thời:</b> <strong>${plainPassword}</strong></p>

        <hr/>
        <p>Vui lòng đăng nhập và đổi mật khẩu ngay sau khi vào hệ thống.</p>
        <br/>
        <p>Trân trọng,<br/>${senderName}</p>
      `,
    });

    return res.status(201).json({
      message: "Student created successfully (Password emailed)",
      student,
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// =====================================
// UPDATE STUDENT
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

    if (dateOfBirth) {
      try {
        validateDobOrThrow(dateOfBirth);
      } catch (err) {
        return res.status(400).json({ message: err.message });
      }
    }

    const student = await Student.findById(id).populate("user");
    if (!student)
      return res.status(404).json({ message: "Student not found" });

    if (email && email !== student.user.email) {
      const normalizedEmail = email.trim().toLowerCase();

      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser)
        return res.status(400).json({ message: "Email already exists" });

      student.user.email = normalizedEmail;
    }

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

    if (majorId) student.major = majorId;
    if (startDate) student.startDate = startDate;

    if (studentCode && studentCode !== student.studentCode) {
      const exists = await Student.findOne({ studentCode });
      if (exists)
        return res.status(400).json({ message: "Student code already exists" });

      student.studentCode = studentCode;
    }

    await student.save();

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
// DELETE STUDENT
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

// // =====================================
// // CHECK IF STUDENT HAS FACE TOKEN
// // =====================================
// exports.checkFaceRegistered = async (req, res) => {
//   try {
//     const student = await Student.findById(req.params.id).populate("user");

//     if (!student) {
//       return res.status(404).json({ message: "Student not found" });
//     }

//     const hasFace = !!student.user.faceToken;

//     return res.json({
//       registered: hasFace,
//       faceToken: student.user.faceToken || null,
//     });

//   } catch (err) {
//     return res.status(500).json({ message: err.message });
//   }
// };

