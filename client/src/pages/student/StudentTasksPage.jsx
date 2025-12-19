import { useState, useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, Plus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import taskApi from "@/api/taskApi";
import { toast } from "sonner";
import { getAccessToken } from "@/utils/storage";
import authApi from "@/api/authApi";
import Sidebar from "@/components/student/sidebar/Sidebar";

export default function StudentTasksPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    taskTitle: "",
    description: "",
    startDate: "",
    dueDate: "",
    priority: "medium",
    complexity: "medium",
    status: "Open",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      navigate('/login');
      return;
    }

    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    if (!userInfo._id) {
      navigate('/login');
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const response = await authApi.getUserProfile(userInfo._id);
        setUser(response.data);
      } catch (error) {
        console.error('Lỗi khi lấy thông tin user:', error);
        setUser(userInfo);
      }
    };

    fetchUserProfile();
  }, [navigate]);

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

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Đang tải...</p>
      </div>
    );
  }

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!createFormData.taskTitle.trim()) {
      toast.error("Tiêu đề task là bắt buộc");
      return;
    }
    if (!createFormData.startDate || !createFormData.dueDate) {
      toast.error("Ngày bắt đầu và ngày hết hạn là bắt buộc");
      return;
    }

    try {
      setLoading(true);
      await taskApi.createMyTask(createFormData);
      toast.success("Tạo task thành công");
      setShowCreateForm(false);
      setCreateFormData({
        taskTitle: "",
        description: "",
        startDate: "",
        dueDate: "",
        priority: "medium",
        complexity: "medium",
        status: "Open",
      });
      await loadTasks(pagination.page);
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error(error.response?.data?.message || "Lỗi khi tạo task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      <Sidebar user={user} />
      <Container fluid className="flex-grow-1 p-4">
        <div className="space-y-6">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="h3 fw-bold text-dark mb-0">Danh Sách Task</h1>
            <Button onClick={() => setShowCreateForm(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Tạo Task Mới
            </Button>
          </div>

          {showCreateForm && (
            <Card className="p-4 mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="h5 fw-bold text-dark mb-0">Tạo Task Mới</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowCreateForm(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <form onSubmit={handleCreateTask} className="space-y-3">
                <div>
                  <label className="form-label fw-medium">Tiêu Đề Task <span className="text-danger">*</span></label>
                  <Input
                    placeholder="Nhập tiêu đề task"
                    value={createFormData.taskTitle}
                    onChange={(e) =>
                      setCreateFormData({ ...createFormData, taskTitle: e.target.value })
                    }
                    required
                    maxLength={200}
                  />
                </div>

                <div>
                  <label className="form-label fw-medium">Mô Tả</label>
                  <textarea
                    className="form-control"
                    placeholder="Nhập mô tả task"
                    value={createFormData.description}
                    onChange={(e) =>
                      setCreateFormData({ ...createFormData, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                <Row>
                  <Col md={6}>
                    <label className="form-label fw-medium">Ngày Bắt Đầu <span className="text-danger">*</span></label>
                    <Input
                      type="date"
                      value={createFormData.startDate}
                      onChange={(e) =>
                        setCreateFormData({ ...createFormData, startDate: e.target.value })
                      }
                      required
                    />
                  </Col>
                  <Col md={6}>
                    <label className="form-label fw-medium">Ngày Hết Hạn <span className="text-danger">*</span></label>
                    <Input
                      type="date"
                      value={createFormData.dueDate}
                      onChange={(e) =>
                        setCreateFormData({ ...createFormData, dueDate: e.target.value })
                      }
                      required
                    />
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <label className="form-label fw-medium">Độ Ưu Tiên</label>
                    <select
                      className="form-select"
                      value={createFormData.priority}
                      onChange={(e) =>
                        setCreateFormData({ ...createFormData, priority: e.target.value })
                      }
                    >
                      <option value="low">Thấp</option>
                      <option value="medium">Trung bình</option>
                      <option value="high">Cao</option>
                    </select>
                  </Col>
                  <Col md={6}>
                    <label className="form-label fw-medium">Mức Độ Phức Tạp</label>
                    <select
                      className="form-select"
                      value={createFormData.complexity}
                      onChange={(e) =>
                        setCreateFormData({ ...createFormData, complexity: e.target.value })
                      }
                    >
                      <option value="easy">Dễ</option>
                      <option value="medium">Trung bình</option>
                      <option value="complex">Phức tạp</option>
                      <option value="veryComplex">Rất phức tạp</option>
                    </select>
                  </Col>
                </Row>

                <div>
                  <label className="form-label fw-medium">Trạng Thái</label>
                  <select
                    className="form-select"
                    value={createFormData.status}
                    onChange={(e) =>
                      setCreateFormData({ ...createFormData, status: e.target.value })
                    }
                  >
                    <option value="Open">Open</option>
                    <option value="To do">To do</option>
                    <option value="In progress">In progress</option>
                    <option value="Reviewing">Reviewing</option>
                    <option value="Done">Done</option>
                    <option value="Cancel">Cancel</option>
                  </select>
                </div>

                <div className="d-flex gap-2">
                  <Button type="submit" disabled={loading} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Tạo Task
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                    disabled={loading}
                  >
                    Hủy
                  </Button>
                </div>
              </form>
            </Card>
          )}

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
      </Container>
    </div>
  );
}

