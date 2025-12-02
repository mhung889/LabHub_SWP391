// src/seed.js
require('dotenv').config();
const mongoose = require('mongoose');

// Import models
const User = require('./models/user-model');
const Student = require('./models/student-model');
const Lab = require('./models/lab-model');
const LabRecruitment = require('./models/lab-recruitment-model');
const LabAttendance = require('./models/lab-attendance-model');
const LeaveRequest = require('./models/leave-request-model');
const Notification = require('./models/notification-model');

const MONGO_URI = 'mongodb+srv://hungdmhe170689_db_user:NPzVj9MFh7OBelNX@cluster0.tnkwpxl.mongodb.net/StudentMana?retryWrites=true&w=majority&appName=Cluster0';

async function main() {
  try {
    console.log('⏳ Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected!');

    console.log('🧹 Clearing old data...');
    await Promise.all([
      User.deleteMany({}),
      Student.deleteMany({}),
      Lab.deleteMany({}),
      LabRecruitment.deleteMany({}),
      LabAttendance.deleteMany({}),
      LeaveRequest.deleteMany({}),
      Notification.deleteMany({})
    ]);
    console.log('🧼 Old data cleared.');

    // ============================================================
    // 1️⃣ Create Admin
    // ============================================================
    const admin = await User.create({
      fullName: 'Admin User',
      email: `admin_${Date.now()}@example.com`,
      passwordHash: 'admin_hash',
      role: 'admin',
      status: 'active'
    });

    // ============================================================
    // 2️⃣ Create Mentor
    // ============================================================
    const mentor = await User.create({
      fullName: 'Mentor Seed',
      email: `mentor_${Date.now()}@example.com`,
      passwordHash: 'mentor_hash',
      role: 'mentor',
      status: 'active'
    });

    // ============================================================
    // 3️⃣ Create Student User + Student Profile
    // ============================================================
    const studentUser = await User.create({
      fullName: 'Student Example',
      email: `student_${Date.now()}@example.com`,
      passwordHash: 'student_hash',
      role: 'student',
      status: 'active'
    });

    const studentProfile = await Student.create({
      user: studentUser._id,
      dateOfBirth: new Date('2003-01-10'),
      gender: 'male',
      studentCode: `STU${Math.floor(Math.random() * 9999)}`,
      className: 'SDN302-FA25',
      major: 'Software Engineering',
      phoneNumber: '0123456789',
      address: 'Hanoi, Vietnam',
      labStatus: 'none'
    });

    // ============================================================
    // 4️⃣ Create a Lab (assigned to mentor)
    // ============================================================
    const lab = await Lab.create({
      name: 'AI Research Lab',
      code: `LAB_${Math.floor(Math.random() * 9999)}`,
      description: 'Research lab focusing on AI and ML.',
      mentor: mentor._id,
      startTime: '08:00',
      endTime: '17:00',
      status: 'active'
    });

    // Assign student to Lab
    await Student.findByIdAndUpdate(studentProfile._id, {
      lab: lab._id,
      labStatus: 'approved'
    });

    // ============================================================
    // 5️⃣ Create a Lab Recruitment Post
    // ============================================================
    const recruitment = await LabRecruitment.create({
      lab: lab._id,
      createdBy: mentor._id,
      title: 'Recruiting AI Interns',
      description: 'We are looking for students interested in AI/ML research.',
      requirements: 'Basic Python, ML knowledge.',
      slots: 5,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'open'
    });

    // ============================================================
    // 6️⃣ Create Attendance for student
    // ============================================================
    const today = new Date();
    const attendance = await LabAttendance.create({
      lab: lab._id,
      student: studentProfile._id,
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
      checkInTime: new Date(),
      workSummary: 'Reviewed ML models.',
      workDetails: 'Worked on classification model tuning.',
      totalHours: 2,
      status: 'inProgress'
    });

    // ============================================================
    // 7️⃣ Create Leave Request
    // ============================================================
    const leaveRequest = await LeaveRequest.create({
      student: studentProfile._id,
      lab: lab._id,
      leaveType: 'sick',
      startDate: today,
      endDate: today,
      totalDays: 1,
      reason: 'Feeling unwell.',
      status: 'pending'
    });

    // ============================================================
    // 8️⃣ Create Notification
    // ============================================================
    const notification = await Notification.create({
      title: 'Welcome to AI Lab',
      content: 'This is your first notification in the lab.',
      sender: mentor._id,
      lab: lab._id,
      isImportant: true
    });

    console.log(`
    🎉 SEED COMPLETED SUCCESSFULLY! 🎉

    ➤ Created:
      - Admin: ${admin._id}
      - Mentor: ${mentor._id}
      - Student User: ${studentUser._id}
      - Student Profile: ${studentProfile._id}
      - Lab: ${lab._id}
      - Recruitment: ${recruitment._id}
      - Attendance: ${attendance._id}
      - Leave Request: ${leaveRequest._id}
      - Notification: ${notification._id}
    `);

  } catch (err) {
    console.error('❌ SEED ERROR:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
