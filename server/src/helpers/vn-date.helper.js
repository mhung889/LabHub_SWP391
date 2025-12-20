function getVNDateOnly(date = new Date()) {
    // Lấy timestamp UTC
    const utcTime = date.getTime();
  
    // Cộng +7 giờ (VN)
    const vnTime = utcTime + 7 * 60 * 60 * 1000;
  
    // Ép về 00:00 ngày VN (theo UTC)
    const vnDate = new Date(vnTime);
    vnDate.setUTCHours(0, 0, 0, 0);
  
    return vnDate;
  }
  
  module.exports = {
    getVNDateOnly,
  };
  