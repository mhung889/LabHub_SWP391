import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container } from "react-bootstrap";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save } from "lucide-react";
import taskApi from "@/api/taskApi";
import { toast } from "sonner";
import { getAccessToken } from "@/utils/storage";
import authApi from "@/api/authApi";
import Sidebar from "@/components/student/sidebar/Sidebar";

export default function StudentTaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    status: "Open",
    note: "",
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

  useEffect(() => {
    loadTask();
  }, [id]);

  const loadTask = async () => {
    try {
      setLoading(true);
      const response = await taskApi.getMyTaskById(id);
      setTask(response.data);
      setFormData({
        status: response.data.status || "Open",
        note: response.data.progressNote || "",
      });
    } catch (error) {
      console.error("Error loading task:", error);
      toast.error(error.response?.data?.message || "Lỗi khi tải thông tin task");
      navigate("/student/tasks");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      await taskApi.updateMyTaskProgress(id, {
        status: formData.status,
        note: formData.note,
      });
      toast.success("Cập nhật task thành công");
      await loadTask();
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error(error.response?.data?.message || "Lỗi khi cập nhật task");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
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

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Đang tải...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="d-flex" style={{ minHeight: '100vh' }}>
        <Sidebar user={user} />
        <Container fluid className="flex-grow-1 p-4 d-flex align-items-center justify-content-center">
          <p className="text-muted-foreground">Đang tải...</p>
        </Container>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="d-flex" style={{ minHeight: '100vh' }}>
        <Sidebar user={user} />
        <Container fluid className="flex-grow-1 p-4 d-flex align-items-center justify-content-center">
          <p className="text-muted-foreground">Không tìm thấy task</p>
        </Container>
      </div>
    );
  }

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      <Sidebar user={user} />
      <Container fluid className="flex-grow-1 p-4">
        <div className="space-y-6">
          <div className="d-flex align-items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/student/tasks")}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="h3 fw-bold text-dark mb-0">Chi Tiết Task</h1>
          </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Thông tin task */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">
              {task.taskTitle}
            </h2>

            {task.description && (
              <div className="mb-4">
                <label className="text-sm font-medium text-muted-foreground">
                  Mô Tả
                </label>
                <p className="text-foreground mt-1 whitespace-pre-wrap">
                  {task.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Ngày Bắt Đầu
                </label>
                <p className="text-foreground">{formatDate(task.startDate)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Ngày Hết Hạn
                </label>
                <p className="text-foreground">{formatDate(task.dueDate)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Độ Ưu Tiên
                </label>
                <p className="text-foreground">
                  {getPriorityLabel(task.priority)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Mức Độ Phức Tạp
                </label>
                <p className="text-foreground">
                  {getComplexityLabel(task.complexity || "medium")}
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Trạng Thái Task
              </label>
              <p className="mt-1">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    task.status || "Open"
                  )}`}
                >
                  {task.status || "Open"}
                </span>
              </p>
            </div>

            {task.createdBy && (
              <div className="mt-4 pt-4 border-t border-border">
                <label className="text-sm font-medium text-muted-foreground">
                  Người Giao Task
                </label>
                <p className="text-foreground">
                  {task.createdBy.fullName} ({task.createdBy.email})
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Form cập nhật trạng thái và note */}
        <div>
          <Card className="p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">
              Cập Nhật Task
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Trạng Thái Task
                </label>
                <select
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value,
                    })
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

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Ghi Chú
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  placeholder="Nhập ghi chú về task..."
                  value={formData.note}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      note: e.target.value,
                    })
                  }
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.note.length}/500 ký tự
                </p>
              </div>

              <Button
                type="submit"
                className="w-full gap-2"
                disabled={saving}
              >
                <Save className="w-4 h-4" />
                {saving ? "Đang lưu..." : "Lưu Thay Đổi"}
              </Button>
            </form>
          </Card>
        </div>
      </div>
        </div>
      </Container>
    </div>
  );
}

