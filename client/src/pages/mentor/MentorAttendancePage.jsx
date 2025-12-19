import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { CalendarCheck } from "lucide-react";
import mentorApi from "@/api/mentorApi";
import { toast } from "sonner";

export default function MentorAttendancePage() {
  const [data, setData] = useState(null);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  // 1. Thêm state cho bộ lọc ngày
  const [dateFilter, setDateFilter] = useState(""); 

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await mentorApi.getAttendance();
      setData(res.data);
      setFilteredData(res.data?.records || []);
    } catch (err) {
      console.error("Lỗi tải điểm danh:", err);
      setError("Không thể tải dữ liệu điểm danh");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "--";
    return new Date(date).toLocaleDateString("vi-VN");
  };

  const formatTime = (time) => {
    if (!time) return "--";
    return new Date(time).toLocaleTimeString("vi-VN");
  };

  const formatHours = (hours) => {
    if (hours === null || hours === undefined) return "0.0";
    return parseFloat(hours).toFixed(1);
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "completed": return "Hoàn thành";
      case "partial": return "Chưa đủ giờ";
      case "absent": return "Vắng";
      case "leave": return "Nghỉ phép";
      case "pending": return "Chưa kết thúc";
      default: return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed": return "text-emerald-600";
      case "partial": return "text-yellow-600";
      case "absent": return "text-red-600";
      case "leave": return "text-gray-500";
      case "pending": return "text-blue-600";
      default: return "text-muted-foreground";
    }
  };

  const isToday = (date) => {
    if (!date) return false;
    const d = new Date(date);
    const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    const fDate = (d) => `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
    return fDate(d) === fDate(today);
  };

  // ==============================
  // Tìm kiếm và Lọc (Cập nhật logic)
  // ==============================
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    filterData(value, statusFilter, dateFilter);
  };

  const handleStatusFilterChange = (e) => {
    const value = e.target.value;
    setStatusFilter(value);
    filterData(searchTerm, value, dateFilter);
  };

  // 2. Thêm handler xử lý thay đổi ngày
  const handleDateFilterChange = (e) => {
    const value = e.target.value;
    setDateFilter(value);
    filterData(searchTerm, statusFilter, value);
  };

  const filterData = (search, status, date) => {
    let filtered = data?.records || [];

    // Lọc theo tìm kiếm
    if (search) {
      filtered = filtered.filter((record) => {
        const studentCode = record.student?.studentCode.toLowerCase() || "";
        const fullName = (record.student?.user?.fullName || "").toLowerCase();
        return studentCode.includes(search.toLowerCase()) || fullName.includes(search.toLowerCase());
      });
    }

    // Lọc theo trạng thái
    if (status) {
      filtered = filtered.filter((record) => record.status === status);
    }

    // 3. Lọc theo ngày (so sánh chuỗi YYYY-MM-DD)
    if (date) {
      filtered = filtered.filter((record) => {
        if (!record.date) return false;
        const recordDate = new Date(record.date).toISOString().split('T')[0];
        return recordDate === date;
      });
    }

    setFilteredData(filtered);
  };

  const handleSupportCheckIn = async (record) => {
    try {
      await mentorApi.updateCheckInTime(record._id, { checkInTime: new Date().toISOString() });
      toast.success("Đã hỗ trợ check-in");
      fetchAttendance();
    } catch (err) {
      console.error(err);
      toast.error("Không thể hỗ trợ check-in");
    }
  };

  const handleSupportCheckOut = async (record) => {
    try {
      await mentorApi.updateCheckOutTime(record._id, { checkOutTime: new Date().toISOString() });
      toast.success("Đã hỗ trợ check-out");
      fetchAttendance();
    } catch (err) {
      console.error(err);
      toast.error("Không thể hỗ trợ check-out");
    }
  };

  if (loading) return <div className="flex justify-center items-center py-20 text-muted-foreground">Đang tải...</div>;
  if (error) return <Card className="p-6 text-center text-red-600">{error}</Card>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CalendarCheck className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Lịch sử điểm danh</h1>
          <p className="text-muted-foreground text-sm">
            Phòng lab: {data.lab?.name} ({data.lab?.code})
          </p>
        </div>
      </div>

      {/* TÌM KIẾM VÀ LỌC */}
      <div className="flex flex-wrap gap-4 mb-4">
        <input
          type="text"
          placeholder="Tìm kiếm MSSV hoặc tên..."
          className="p-2 border rounded min-w-[250px]"
          value={searchTerm}
          onChange={handleSearchChange}
        />
        
        {/* Input lọc ngày mới */}
        <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Ngày:</span>
            <input
              type="date"
              className="p-2 border rounded"
              value={dateFilter}
              onChange={handleDateFilterChange}
            />
        </div>

        <select
          className="p-2 border rounded"
          value={statusFilter}
          onChange={handleStatusFilterChange}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="completed">Hoàn thành</option>
          <option value="partial">Chưa đủ giờ</option>
          <option value="absent">Vắng</option>
          <option value="leave">Nghỉ phép</option>
          <option value="pending">Chưa kết thúc</option>
        </select>

        {/* Nút Reset nhanh */}
        {(searchTerm || statusFilter || dateFilter) && (
            <button 
                onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("");
                    setDateFilter("");
                    setFilteredData(data?.records || []);
                }}
                className="text-sm text-blue-600 hover:underline"
            >
                Đặt lại bộ lọc
            </button>
        )}
      </div>

      <Card className="p-4 overflow-x-auto">
        {filteredData.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            Không tìm thấy dữ liệu điểm danh phù hợp
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-3">MSSV</th>
                <th>Họ tên</th>
                <th>Ngày</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Tổng giờ</th>
                <th>Trạng thái</th>
                <th className="text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((record) => {
                const today = isToday(record.date);
                const disableCheckIn = !!record.checkInTime || !today;
                const disableCheckOut = !record.checkInTime || !!record.checkOutTime || !today;

                return (
                  <tr key={record._id} className="border-b last:border-0 hover:bg-muted/40 transition">
                    <td className="py-3 font-medium">{record.student?.studentCode}</td>
                    <td>{record.student?.user?.fullName || "--"}</td>
                    <td>{formatDate(record.date)}</td>
                    <td>{formatTime(record.checkInTime)}</td>
                    <td>{formatTime(record.checkOutTime)}</td>
                    <td>{formatHours(record.totalHours)}</td>
                    <td className={getStatusColor(record.status)}>
                      {getStatusLabel(record.status)}
                    </td>
                    <td className="text-center space-x-2">
                      <button
                        disabled={disableCheckIn}
                        onClick={() => handleSupportCheckIn(record)}
                        className={`text-xs px-3 py-1 rounded transition ${disableCheckIn ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20"}`}
                      >
                        Check-in lại
                      </button>
                      <button
                        disabled={disableCheckOut}
                        onClick={() => handleSupportCheckOut(record)}
                        className={`text-xs px-3 py-1 rounded transition ${disableCheckOut ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"}`}
                      >
                        Check-out lại
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}