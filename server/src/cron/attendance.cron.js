const cron = require("node-cron");

const Lab = require("../models/lab-model");
const Student = require("../models/student-model");
const LabAttendance = require("../models/lab-attendance-model");
const LeaveRequest = require("../models/leave-request-model");

const {
  isAfterCheckoutDeadline,
} = require("../helpers/attendance-time.helper");

const forceRun = process.env.CRON_FORCE === "true";

/**
 * Utils: lấy ngày YYYY-MM-DD (00:00:00)
 */
function getDateOnly(date = new Date()) {
  // Chuyển giờ UTC sang giờ Việt Nam (Asia/Ho_Chi_Minh)
  const dateInVN = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
  console.log("Converted date to VN timezone:", dateInVN); // Log để kiểm tra

  return new Date(dateInVN.toISOString().split("T")[0]);
}


/* =====================================================
 * CRON 1: KHỞI TẠO ATTENDANCE ĐẦU NGÀY
 * - Chạy lúc 00:00 mỗi ngày
 * - Mỗi student trong lab active có 1 record/ngày
 * ===================================================== */
cron.schedule("1 0 * * *", async () => {
  try {
    console.log("🌅 [CRON] Init attendance records");
    // cron.schedule("*/1 * * * *", async () => {
    //   try {
    //     console.log("🧪 [TEST] Init attendance records");    

    const dateOnly = getDateOnly();
    const dateVN = new Date(dateOnly.getTime() + 7 * 60 * 60 * 1000);
    const labs = await Lab.find({ status: "active" });
    if (!labs.length) return;

    for (const lab of labs) {
      const students = await Student.find({ lab: lab._id });

      for (const student of students) {
        const existed = await LabAttendance.findOne({
          lab: lab._id,
          student: student._id,
          date: dateVN ,
        });

        if (!existed) {
          await LabAttendance.create({
            lab: lab._id,
            student: student._id,
            date: dateVN ,
            status: "pending", // trạng thái khởi tạo
            checkInTime: null,
            checkOutTime: null,
          });
        }
      }
    }
  } catch (err) {
    console.error("❌ [CRON] Init attendance error:", err);
  }
});

/* =====================================================
 * CRON 2: CHỐT TRẠNG THÁI CUỐI NGÀY
 * - Chạy mỗi 1 giờ
 * - Sau deadline checkout mới xử lý
 * ===================================================== */
cron.schedule("0 * * * *", async () => {
  try {
    console.log("⏰ [CRON] Finalize attendance status");
    // cron.schedule("*/1 * * * *", async () => {
    //   try {
    //     console.log("🧪 [TEST] Init attendance status"); 

    const now = new Date();
    const dateOnly = getDateOnly(now);

    const labs = await Lab.find({ status: "active" });
    if (!labs.length) return;

    for (const lab of labs) {
      const after = isAfterCheckoutDeadline(lab);
      // Chưa tới deadline checkout → bỏ qua
      if (!forceRun && !isAfterCheckoutDeadline(lab)) continue;
      

      const students = await Student.find({ lab: lab._id });

      for (const student of students) {
        const attendance = await LabAttendance.findOne({
          lab: lab._id,
          student: student._id,
          date: dateOnly,
        });

        // Về lý thuyết không xảy ra vì cron đầu ngày đã tạo
        if (!attendance) continue;

        /* ---------------------------------------------
         * 1️⃣ CHECK LEAVE (ƯU TIÊN CAO NHẤT)
         * --------------------------------------------- */
        const leave = await LeaveRequest.findOne({
          student: student._id,
          lab: lab._id,
          status: "approved",
          startDate: { $lte: dateOnly },
          endDate: { $gte: dateOnly },
        });

        if (leave) {
          attendance.status = "leave";
          await attendance.save();
          continue;
        }

        /* ---------------------------------------------
         * 2️⃣ CHỐT STATUS THEO CHECK-IN / CHECK-OUT
         * --------------------------------------------- */
        if (attendance.checkInTime && attendance.checkOutTime) {
          attendance.status = "completed";

          const diffMs =
          attendance.checkOutTime - attendance.checkInTime;
      
        attendance.totalHours = Math.max(
          diffMs / (1000 * 60 * 60),
          0
        );
        } else if (
          attendance.checkInTime ||
          attendance.checkOutTime
        ) {
          attendance.status = "partial";
        } else {
          attendance.status = "absent";
        }

        await attendance.save();
      }
    }
  } catch (err) {
    console.error("❌ [CRON] Finalize attendance error:", err);
  }
});

console.log("✅ Attendance cron initialized");
