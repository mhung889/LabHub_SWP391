import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, Search, ChevronLeft, ChevronRight } from "lucide-react";
import evaluationApi from "@/api/evaluationApi";
import labApi from "@/api/labApi";

export default function AdminEvaluationReportListPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [labs, setLabs] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    loadReports();
    loadLabs();
  }, [pagination.page, statusFilter, departmentFilter]);

  const loadLabs = async () => {
    try {
      const response = await labApi.getLabs({ status: "active" });
      setLabs(response.data.labs || []);
    } catch (error) {
      console.error("Error loading labs:", error);
    }
  };

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await evaluationApi.getEvaluationReports({
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter || undefined,
        departmentId: departmentFilter || undefined,
      });
      setReports(response.data.reports || []);
      if (response.data.pagination) {
        setPagination({
          ...pagination,
          ...response.data.pagination,
        });
      }
    } catch (error) {
      console.error("Error loading reports:", error);
      alert(error.response?.data?.message || "Lỗi khi tải danh sách báo cáo");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (reportId) => {
    try {
      setLoading(true);
      const response = await evaluationApi.getEvaluationReportDetail(reportId);
      setSelectedReport(response.data.evaluation);
      setShowDetail(true);
    } catch (error) {
      console.error("Error loading report detail:", error);
      alert(error.response?.data?.message || "Lỗi khi tải chi tiết báo cáo");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    // Filter locally by search term
    loadReports();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      draft: { label: "Nháp", color: "bg-gray-100 text-gray-800" },
      completed: { label: "Hoàn thành", color: "bg-blue-100 text-blue-800" },
      submitted: { label: "Đã nộp", color: "bg-green-100 text-green-800" },
    };
    const statusInfo = statusMap[status] || statusMap.draft;
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  const filteredReports = reports.filter((report) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      report.studentName?.toLowerCase().includes(searchLower) ||
      report.studentCode?.toLowerCase().includes(searchLower) ||
      report.mentorName?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Danh Sách Báo Cáo Đánh Giá</h1>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Tìm kiếm theo tên, mã sinh viên..."
              className="pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination({ ...pagination, page: 1 });
            }}
            className="px-3 py-2 border rounded-md"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="draft">Nháp</option>
            <option value="completed">Hoàn thành</option>
            <option value="submitted">Đã nộp</option>
          </select>
          <select
            value={departmentFilter}
            onChange={(e) => {
              setDepartmentFilter(e.target.value);
              setPagination({ ...pagination, page: 1 });
            }}
            className="px-3 py-2 border rounded-md"
          >
            <option value="">Tất cả phòng ban</option>
            {labs.map((lab) => (
              <option key={lab._id} value={lab._id}>
                {lab.name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Reports List */}
      <Card className="p-4">
        {loading && reports.length === 0 ? (
          <div className="text-center py-8">Đang tải...</div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Không có báo cáo nào
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Sinh Viên</th>
                    <th className="text-left p-2">Mentor</th>
                    <th className="text-left p-2">Phòng Ban</th>
                    <th className="text-left p-2">Tổng Điểm</th>
                    <th className="text-left p-2">Trạng Thái</th>
                    <th className="text-left p-2">Ngày Nộp</th>
                    <th className="text-left p-2">Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report) => (
                    <tr key={report._id} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        <div>
                          <p className="font-medium">{report.studentName}</p>
                          <p className="text-sm text-muted-foreground">
                            {report.studentCode}
                          </p>
                        </div>
                      </td>
                      <td className="p-2">{report.mentorName}</td>
                      <td className="p-2">{report.department}</td>
                      <td className="p-2">
                        <span className="font-semibold">
                          {report.totalScore?.toFixed(2) || "0.00"}
                        </span>
                      </td>
                      <td className="p-2">{getStatusBadge(report.status)}</td>
                      <td className="p-2 text-sm">
                        {formatDate(report.submittedDate)}
                      </td>
                      <td className="p-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetail(report._id)}
                          className="gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Xem Chi Tiết
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-muted-foreground">
                  Trang {pagination.page} / {pagination.totalPages} (Tổng:{" "}
                  {pagination.total} báo cáo)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPagination({ ...pagination, page: pagination.page - 1 })
                    }
                    disabled={pagination.page === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPagination({ ...pagination, page: pagination.page + 1 })
                    }
                    disabled={pagination.page >= pagination.totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Detail Modal */}
      {showDetail && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Chi Tiết Báo Cáo Đánh Giá</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowDetail(false)}>
                ✕
              </Button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Sinh Viên</p>
                  <p className="font-semibold">
                    {selectedReport.student?.user?.fullName || "N/A"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedReport.student?.studentCode || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mentor</p>
                  <p className="font-semibold">
                    {selectedReport.mentor?.fullName || "N/A"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedReport.mentor?.email || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phòng Ban</p>
                  <p className="font-semibold">
                    {selectedReport.student?.lab?.name || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ngày Nộp</p>
                  <p className="font-semibold">
                    {formatDate(
                      selectedReport.submittedDate || selectedReport.createdAt
                    )}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Chi Tiết Điểm Số</h3>
                <div className="space-y-3">
                  {selectedReport.criteriaScores?.map((cs, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{cs.criterionName}</h4>
                          {cs.comment && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {cs.comment}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">
                            {cs.score} / {cs.maxScore}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Trọng số: {cs.weight}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-semibold">Tổng Điểm:</span>
                  <span className="text-3xl font-bold text-primary">
                    {selectedReport.totalScore?.toFixed(2) || "0.00"} / 100
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

