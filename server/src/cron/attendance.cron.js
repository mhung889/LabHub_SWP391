//src/cron/attendance.cron.js
const cron = require("node-cron");
const Lab = require("../models/lab-model");
const Student = require("../models/student-model");
const LabAttendance = require("../models/lab-attendance-model");
const {
  isAfterCheckoutDeadline,
} = require("../helpers/attendance-time.helper");
const forceRun = process.env.CRON_FORCE === "true";


// ===============================================
// ATTENDANCE CRON JOB
// - Chuẩn hóa trạng thái sau giờ checkout
// ===============================================

// chạy mỗi 1 giờ
cron.schedule("0 * * * *", async () => {
  try {
    console.log("⏰ Attendance cron running...");

    const now = new Date();

    // Lấy các lab đang active
    const labs = await Lab.find({ status: "active" });

    if (!labs.length) return;

    // Lấy ngày hiện tại (YYYY-MM-DD, 00:00:00)
    const dateOnly = new Date(now.toISOString().split("T")[0]);

    for (const lab of labs) {
      // Chưa quá deadline checkout → bỏ qua
      if (!forceRun && !isAfterCheckoutDeadline(lab)) continue;

      // Lấy danh sách sinh viên thuộc lab
      const students = await Student.find({ lab: lab._id });

      for (const student of students) {
        const attendance = await LabAttendance.findOne({
          lab: lab._id,
          student: student._id,
          date: dateOnly,
        });

        // =====================================
        // CASE 1: KHÔNG CÓ RECORD → ABSENT
        // =====================================
        if (!attendance) {
          await LabAttendance.create({
            lab: lab._id,
            student: student._id,
            date: dateOnly,
            status: "absent",
          });
          continue;
        }

        // =====================================
        // CASE 2: CHECKIN NHƯNG KHÔNG CHECKOUT
        // =====================================
        if (attendance.status === "inProgress") {
          attendance.status = "incomplete";
          await attendance.save();
        }

        // completed / late → KHÔNG ĐỤNG
      }
    }
  } catch (err) {
    console.error("❌ Attendance cron error:", err);
  }
});

console.log("✅ Attendance cron initialized");
