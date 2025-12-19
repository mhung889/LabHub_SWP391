import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { CalendarCheck } from "lucide-react";
import mentorApi from "@/api/mentorApi";
import { toast } from "sonner";

export default function MentorAttendancePage() {
  const [data, setData] = useState(null);
  const [filteredData, setFilteredData] = useState([]); // Khởi tạo mảng rỗng
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // Lọc theo trạng thái

  useEffect(() => {
    fetchAttendance();
  }, []);

  // ==============================
  // API
  // ==============================
  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await mentorApi.getAttendance();
      setData(res.data);
      setFilteredData(res.data?.records || []); // Nếu không có records thì khởi tạo mảng rỗng
    } catch (err) {
      console.error("Lỗi tải điểm danh:", err);
      setError("Không thể tải dữ liệu điểm danh");
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // Helpers
  // ==============================
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
      case "completed":
        return "Hoàn thành";
      case "partial":
        return "Chưa đủ giờ";
      case "absent":
        return "Vắng";
      case "leave":
        return "Nghỉ phép";
      case "pending":
        return "Chưa kết thúc";
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "text-emerald-600";
      case "partial":
        return "text-yellow-600";
      case "absent":
        return "text-red-600";
      case "leave":
        return "text-gray-500";
      case "pending":
        return "text-blue-600";
      default:
        return "text-muted-foreground";
    }
  };

  const isToday = (date) => {
    if (!date) return false;
  
    // Chuyển đổi cả ngày từ dữ liệu và ngày hiện tại thành dạng YYYY-MM-DD với múi giờ Việt Nam
    const d = new Date(date);
    
    // Chuyển đổi ngày hôm nay sang múi giờ Việt Nam
    const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  
    // Chuyển 2 ngày thành dạng YYYY-MM-DD
    const formatDate = (d) => `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
  
    return formatDate(d) === formatDate(today);
  };
  
  // ==============================
  // Tìm kiếm và Lọc
  // ==============================
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    filterData(value, statusFilter);
  };

  const handleStatusFilterChange = (e) => {
    const value = e.target.value;
    setStatusFilter(value);
    filterData(searchTerm, value);
  };

  const filterData = (searchTerm, status) => {
    let filtered = data?.records || [];
    if (searchTerm) {
      filtered = filtered.filter((record) => {
        const studentCode = record.student?.studentCode.toLowerCase() || "";
        const fullName = (record.student?.user?.fullName || "").toLowerCase();
        return studentCode.includes(searchTerm.toLowerCase()) || fullName.includes(searchTerm.toLowerCase());
      });
    }
    if (status) {
      filtered = filtered.filter((record) => record.status === status);
    }
    setFilteredData(filtered); // Cập nhật filteredData sau khi lọc
  };

  // ==============================
  // ACTION HANDLERS
  // ==============================
  const handleSupportCheckIn = async (record) => {
    try {
      await mentorApi.updateCheckInTime(record._id, {
        checkInTime: new Date().toISOString(),
      });
      toast.success("Đã hỗ trợ check-in");
      fetchAttendance();
    } catch (err) {
      console.error(err);
      toast.error("Không thể hỗ trợ check-in");
    }
  };

  const handleSupportCheckOut = async (record) => {
    try {
      await mentorApi.updateCheckOutTime(record._id, {
        checkOutTime: new Date().toISOString(),
      });
      toast.success("Đã hỗ trợ check-out");
      fetchAttendance();
    } catch (err) {
      console.error(err);
      toast.error("Không thể hỗ trợ check-out");
    }
  };

  // ==============================
  // RENDER STATES
  // ==============================
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 text-muted-foreground">
        Đang tải dữ liệu điểm danh...
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center text-red-600">
        {error}
      </Card>
    );
  }

  // Nếu không có dữ liệu sau khi lọc, hiển thị thông báo không có dữ liệu nhưng vẫn giữ phần filter
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <CalendarCheck className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Lịch sử điểm danh</h1>
          <p className="text-muted-foreground text-sm">
            Phòng lab: {data.lab?.name} ({data.lab?.code})
          </p>
        </div>
      </div>

      {/* Tìm kiếm và lọc */}
      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Tìm kiếm theo MSSV hoặc tên"
          className="p-2 border rounded"
          value={searchTerm}
          onChange={handleSearchChange}
        />
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
      </div>

      {/* TABLE */}
      <Card className="p-4 overflow-x-auto">
        {filteredData.length === 0 ? (
          <div className="text-center text-muted-foreground">
            Chưa có dữ liệu điểm danh
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

                const disableCheckIn =
                  !!record.checkInTime || !today;

                const disableCheckOut =
                  !record.checkInTime ||
                  !!record.checkOutTime ||
                  !today;

                return (
                  <tr
                    key={record._id}
                    className="border-b last:border-0 hover:bg-muted/40 transition"
                  >
                    <td className="py-3 font-medium">
                      {record.student?.studentCode}
                    </td>
                    <td>{record.student?.user?.fullName || "--"}</td>
                    <td>{formatDate(record.date)}</td>
                    <td>{formatTime(record.checkInTime)}</td>
                    <td>{formatTime(record.checkOutTime)}</td>
                    <td>{formatHours(record.totalHours)}</td>
                    <td className={getStatusColor(record.status)}>
                      {getStatusLabel(record.status)}
                    </td>

                    {/* ACTIONS */}
                    <td className="text-center space-x-2">
                      <button
                        disabled={disableCheckIn}
                        onClick={() => handleSupportCheckIn(record)}
                        className={`text-xs px-3 py-1 rounded transition
                          ${disableCheckIn ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20"}
                        `}
                      >
                        Check-in lại
                      </button>

                      <button
                        disabled={disableCheckOut}
                        onClick={() => handleSupportCheckOut(record)}
                        className={`text-xs px-3 py-1 rounded transition
                          ${disableCheckOut ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"}
                        `}
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
