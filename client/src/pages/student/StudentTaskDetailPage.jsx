import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, FileText } from "lucide-react";
import taskApi from "@/api/taskApi";
import { toast } from "sonner";

export default function StudentTaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    progressStatus: "notStarted",
    progressNote: "",
    submissionFile: "",
  });

  useEffect(() => {
    loadTask();
  }, [id]);

  const loadTask = async () => {
    try {
      setLoading(true);
      const response = await taskApi.getMyTaskById(id);
      setTask(response.data);
      setFormData({
        progressStatus: response.data.progressStatus || "notStarted",
        progressNote: response.data.progressNote || "",
        submissionFile: response.data.submissionFile || "",
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
      await taskApi.updateMyTaskProgress(id, formData);
      toast.success("Cập nhật tiến độ task thành công");
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Đang tải...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Không tìm thấy task</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/student/tasks")}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Chi Tiết Task</h1>
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

        {/* Form cập nhật tiến độ */}
        <div>
          <Card className="p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">
              Cập Nhật Tiến Độ
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Trạng Thái Tiến Độ
                </label>
                <select
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  value={formData.progressStatus}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      progressStatus: e.target.value,
                    })
                  }
                >
                  <option value="notStarted">Chưa bắt đầu</option>
                  <option value="inProgress">Đang làm</option>
                  <option value="completed">Hoàn thành</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Ghi Chú Tiến Độ
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  placeholder="Nhập ghi chú về tiến độ..."
                  value={formData.progressNote}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      progressNote: e.target.value,
                    })
                  }
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.progressNote.length}/500 ký tự
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Link File Nộp (URL)
                </label>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={formData.submissionFile}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      submissionFile: e.target.value,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Nhập link đến file đã nộp (Google Drive, OneDrive, etc.)
                </p>
              </div>

              {task.submissionFile && (
                <div className="p-3 bg-muted rounded-lg">
                  <label className="text-sm font-medium text-muted-foreground">
                    File Đã Nộp
                  </label>
                  <a
                    href={task.submissionFile}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline block mt-1"
                  >
                    {task.submissionFile}
                  </a>
                  {task.submittedAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Nộp lúc: {formatDate(task.submittedAt)}
                    </p>
                  )}
                </div>
              )}

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
  );
}

