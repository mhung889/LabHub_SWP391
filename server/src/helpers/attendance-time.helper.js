// src/helpers/attendance-time.helper.js

function buildTime(baseTime, offsetMinutes = 0) {
    if (!baseTime) return null;
  
    const [h, m] = baseTime.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    d.setMinutes(d.getMinutes() + offsetMinutes);
    return d;
  }
  
  // =======================
  // CHECK-IN TIME VALIDATE
  // =======================
  exports.isCheckInAllowed = (lab) => {
    if (!lab.startTime || !lab.attendanceRule) return true;
  
    const now = new Date();
  
    const early = buildTime(
      lab.startTime,
      -lab.attendanceRule.checkInEarlyMinutes
    );
  
    const late = buildTime(
      lab.startTime,
      lab.attendanceRule.checkInLateMinutes
    );
  
    return now >= early && now <= late;
  };
  
  // =======================
  // CHECK-OUT TIME VALIDATE
  // =======================
  exports.isCheckOutAllowed = (lab) => {
    if (!lab.endTime || !lab.attendanceRule) return true;
  
    const now = new Date();
  
    const early = buildTime(
      lab.endTime,
      -lab.attendanceRule.checkOutEarlyMinutes
    );
  
    const late = buildTime(
      lab.endTime,
      lab.attendanceRule.checkOutLateMinutes
    );
  
    return now >= early && now <= late;
  };
  