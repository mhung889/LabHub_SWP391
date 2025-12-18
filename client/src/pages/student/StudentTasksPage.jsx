import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Calendar, Flag, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import taskApi from "@/api/taskApi";
import { toast } from "sonner";

export default function StudentTasksPage() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const loadTasks = async (page = 1) => {
    try {
      setLoading(true);
      const response = await taskApi.getMyTasks({
        page,
        limit: pagination.limit,
      });
      setTasks(response.data.tasks || []);
      if (response.data.pagination) {
        setPagination({
          ...pagination,
          page: response.data.pagination.page,
          total: response.data.pagination.total,
          totalPages: response.data.pagination.totalPages,
        });
      }
    } catch (error) {
      console.error("Error loading tasks:", error);
      toast.error(error.response?.data?.message || "Lỗi khi tải danh sách task");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks(1);
  }, []);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-500/10 text-red-600";
      case "medium":
        return "bg-yellow-500/10 text-yellow-600";
      case "low":
        return "bg-green-500/10 text-green-600";
      default:
        return "bg-gray-500/10 text-gray-600";
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case "high":
        return "Cao";
      case "medium":
        return "Trung bình";
      case "low":
        return "Thấp";
      default:
        return priority;
    }
  };

  const getComplexityLabel = (complexity) => {
    switch (complexity) {
      case "easy":
        return "Dễ";
      case "medium":
        return "Trung bình";
      case "complex":
        return "Phức tạp";
      case "veryComplex":
        return "Rất phức tạp";
      default:
        return complexity || "Trung bình";
    }
  };

  const getComplexityColor = (complexity) => {
    switch (complexity) {
      case "easy":
        return "bg-green-500/10 text-green-600";
      case "medium":
        return "bg-blue-500/10 text-blue-600";
      case "complex":
        return "bg-orange-500/10 text-orange-600";
      case "veryComplex":
        return "bg-red-500/10 text-red-600";
      default:
        return "bg-gray-500/10 text-gray-600";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Open":
        return "bg-blue-500/10 text-blue-600";
      case "To do":
        return "bg-gray-500/10 text-gray-600";
      case "In progress":
        return "bg-yellow-500/10 text-yellow-600";
      case "Reviewing":
        return "bg-purple-500/10 text-purple-600";
      case "Done":
        return "bg-emerald-500/10 text-emerald-600";
      case "Cancel":
        return "bg-red-500/10 text-red-600";
      default:
        return "bg-gray-500/10 text-gray-600";
    }
  };

  const getProgressColor = (progress) => {
    switch (progress) {
      case "completed":
        return "bg-emerald-500/10 text-emerald-600";
      case "inProgress":
        return "bg-yellow-500/10 text-yellow-600";
      case "notStarted":
        return "bg-gray-500/10 text-gray-600";
      default:
        return "bg-gray-500/10 text-gray-600";
    }
  };

  const getProgressLabel = (progress) => {
    switch (progress) {
      case "completed":
        return "Hoàn thành";
      case "inProgress":
        return "Đang làm";
      case "notStarted":
        return "Chưa bắt đầu";
      default:
        return progress;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  const handleViewDetail = (task) => {
    navigate(`/student/tasks/${task._id}`);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Danh Sách Task</h1>
      </div>

      <Card className="overflow-hidden">
        {loading && tasks.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            Đang tải...
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="text-left px-6 py-4 font-bold text-foreground">
                      Tiêu Đề
                    </th>
                    <th className="text-left px-6 py-4 font-bold text-foreground">
                      Ngày Bắt Đầu
                    </th>
                    <th className="text-left px-6 py-4 font-bold text-foreground">
                      Ngày Hết Hạn
                    </th>
                    <th className="text-left px-6 py-4 font-bold text-foreground">
                      Độ Ưu Tiên
                    </th>
                    <th className="text-left px-6 py-4 font-bold text-foreground">
                      Mức Độ Phức Tạp
                    </th>
                    <th className="text-left px-6 py-4 font-bold text-foreground">
                      Trạng Thái Task
                    </th>
                    <th className="text-left px-6 py-4 font-bold text-foreground">
                      Tiến Độ
                    </th>
                    <th className="text-center px-6 py-4 font-bold text-foreground">
                      Hành Động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tasks.map((task) => (
                    <tr
                      key={task._id}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-foreground font-medium">
                        {task.taskTitle}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {formatDate(task.startDate)}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {formatDate(task.dueDate)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(
                            task.priority
                          )}`}
                        >
                          {getPriorityLabel(task.priority)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getComplexityColor(
                            task.complexity || "medium"
                          )}`}
                        >
                          {getComplexityLabel(task.complexity || "medium")}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                            task.status || "Open"
                          )}`}
                        >
                          {task.status || "Open"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getProgressColor(
                            task.progressStatus || "notStarted"
                          )}`}
                        >
                          {getProgressLabel(task.progressStatus || "notStarted")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewDetail(task)}
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {tasks.length === 0 && !loading && (
              <div className="p-12 text-center text-muted-foreground">
                Không có task nào được gán cho bạn
              </div>
            )}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Trang {pagination.page} / {pagination.totalPages} (Tổng:{" "}
                  {pagination.total} task)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadTasks(pagination.page - 1)}
                    disabled={pagination.page <= 1 || loading}
                  >
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadTasks(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages || loading}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

