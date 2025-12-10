import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit2, Trash2, Eye, Users, Calendar, Flag } from "lucide-react";
import taskApi from "@/api/taskApi";

export default function MentorTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [formData, setFormData] = useState({
    taskTitle: "",
    description: "",
    startDate: "",
    dueDate: "",
    priority: "medium",
  });
  const [formErrors, setFormErrors] = useState({});
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);

  const loadTasks = async (page = 1) => {
    try {
      setLoading(true);
      const response = await taskApi.getTasks({
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
      alert(error.response?.data?.message || "Lỗi khi tải danh sách task");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks(1);
  }, []);

  const handleAddTask = () => {
    setEditingTask(null);
    setFormData({
      taskTitle: "",
      description: "",
      startDate: "",
      dueDate: "",
      priority: "medium",
      status: "active",
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setFormData({
      taskTitle: task.taskTitle || "",
      description: task.description || "",
      startDate: task.startDate
        ? new Date(task.startDate).toISOString().split("T")[0]
        : "",
      dueDate: task.dueDate
        ? new Date(task.dueDate).toISOString().split("T")[0]
        : "",
      priority: task.priority || "medium",
      status: task.status || "active",
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleViewDetail = async (task) => {
    try {
      setLoading(true);
      const response = await taskApi.getTaskById(task._id);
      setSelectedTask(response.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error("Error loading task detail:", error);
      alert(error.response?.data?.message || "Lỗi khi tải thông tin task");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTask = async (task) => {
    try {
      setLoading(true);
      const response = await taskApi.getAssignedStudents(task._id);
      setAvailableStudents(response.data.students || []);
      setSelectedTask(task);
      const alreadyAssigned = response.data.students
        .filter((s) => s.isAssigned)
        .map((s) => s._id);
      setSelectedStudents(alreadyAssigned);
      setShowAssignModal(true);
    } catch (error) {
      console.error("Error loading students:", error);
      alert(error.response?.data?.message || "Lỗi khi tải danh sách student");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.taskTitle.trim()) {
      errors.taskTitle = "Tiêu đề task là bắt buộc";
    } else if (formData.taskTitle.trim().length > 200) {
      errors.taskTitle = "Tiêu đề không được vượt quá 200 ký tự";
    }
    if (!formData.startDate) {
      errors.startDate = "Ngày bắt đầu là bắt buộc";
    }
    if (!formData.dueDate) {
      errors.dueDate = "Ngày hết hạn là bắt buộc";
    }
    if (formData.startDate && formData.dueDate) {
      const start = new Date(formData.startDate);
      const due = new Date(formData.dueDate);
      if (start > due) {
        errors.dueDate = "Ngày hết hạn phải lớn hơn hoặc bằng ngày bắt đầu";
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      if (editingTask) {
        await taskApi.updateTask(editingTask._id, formData);
        alert("Cập nhật task thành công");
      } else {
        await taskApi.createTask(formData);
        alert("Tạo task thành công");
      }
      setShowForm(false);
      setEditingTask(null);
      await loadTasks(pagination.page);
    } catch (error) {
      console.error("Error saving task:", error);
      alert(error.response?.data?.message || "Lỗi khi lưu task");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignSubmit = async () => {
    if (selectedStudents.length === 0) {
      alert("Vui lòng chọn ít nhất một student");
      return;
    }

    try {
      setLoading(true);
      await taskApi.assignTask(selectedTask._id, {
        studentIds: selectedStudents,
      });
      alert("Gán task thành công");
      setShowAssignModal(false);
      await loadTasks(pagination.page);
    } catch (error) {
      console.error("Error assigning task:", error);
      alert(error.response?.data?.message || "Lỗi khi gán task");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (task) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa task "${task.taskTitle}"?`)) {
      return;
    }

    try {
      setLoading(true);
      await taskApi.deleteTask(task._id);
      alert("Xóa task thành công");
      await loadTasks(pagination.page);
    } catch (error) {
      console.error("Error deleting task:", error);
      alert(error.response?.data?.message || "Lỗi khi xóa task");
    } finally {
      setLoading(false);
    }
  };

  const toggleStudent = (studentId) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

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

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Quản Lý Task</h1>
        <Button onClick={handleAddTask} className="gap-2">
          <Plus className="w-4 h-4" />
          Tạo Task Mới
        </Button>
      </div>

      {showForm && (
        <Card className="p-6 bg-muted/50">
          <h3 className="text-lg font-bold text-foreground mb-4">
            {editingTask ? "Sửa Task" : "Tạo Task Mới"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Tiêu Đề Task <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Nhập tiêu đề task"
                value={formData.taskTitle}
                onChange={(e) =>
                  setFormData({ ...formData, taskTitle: e.target.value })
                }
                required
                maxLength={200}
              />
              {formErrors.taskTitle && (
                <p className="text-sm text-red-500 mt-1">
                  {formErrors.taskTitle}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Mô Tả
              </label>
              <textarea
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                placeholder="Nhập mô tả task"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Ngày Bắt Đầu <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  required
                />
                {formErrors.startDate && (
                  <p className="text-sm text-red-500 mt-1">
                    {formErrors.startDate}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Ngày Hết Hạn <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDate: e.target.value })
                  }
                  required
                />
                {formErrors.dueDate && (
                  <p className="text-sm text-red-500 mt-1">
                    {formErrors.dueDate}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Độ Ưu Tiên
                </label>
                <select
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value })
                  }
                >
                  <option value="low">Thấp</option>
                  <option value="medium">Trung bình</option>
                  <option value="high">Cao</option>
                </select>
              </div>

              {editingTask && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Trạng Thái
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                  >
                    <option value="active">Hoạt động</option>
                    <option value="closed">Đã đóng</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="gap-2" disabled={loading}>
                {editingTask ? (
                  <>
                    <Edit2 className="w-4 h-4" />
                    Cập Nhật Task
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Tạo Task
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingTask(null);
                }}
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
                      Số SV Đã Gán
                    </th>
                    <th className="text-left px-6 py-4 font-bold text-foreground">
                      Trạng Thái
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
                        <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                          {task.assignedStudentsCount || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                            task.status === "active"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : "bg-gray-500/10 text-gray-600"
                          }`}
                        >
                          {task.status === "active" ? "Hoạt động" : "Đã đóng"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDetail(task)}
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditTask(task)}
                            title="Sửa task"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleAssignTask(task)}
                            title="Gán task cho student"
                          >
                            <Users className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(task)}
                            title="Xóa task"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {tasks.length === 0 && !loading && (
              <div className="p-12 text-center text-muted-foreground">
                Không có task nào
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

      {showDetailModal && selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">
                  Chi Tiết Task
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowDetailModal(false)}
                >
                  ×
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Tiêu Đề
                  </label>
                  <p className="text-foreground font-medium">
                    {selectedTask.taskTitle}
                  </p>
                </div>

                {selectedTask.description && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Mô Tả
                    </label>
                    <p className="text-foreground">{selectedTask.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Ngày Bắt Đầu
                    </label>
                    <p className="text-foreground">
                      {formatDate(selectedTask.startDate)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Ngày Hết Hạn
                    </label>
                    <p className="text-foreground">
                      {formatDate(selectedTask.dueDate)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Độ Ưu Tiên
                    </label>
                    <p className="text-foreground">
                      {getPriorityLabel(selectedTask.priority)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Trạng Thái
                    </label>
                    <p className="text-foreground">
                      {selectedTask.status === "active"
                        ? "Hoạt động"
                        : "Đã đóng"}
                    </p>
                  </div>
                </div>

                {selectedTask.assignedStudents &&
                  selectedTask.assignedStudents.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        Danh Sách Student Đã Gán ({selectedTask.assignedStudents.length})
                      </label>
                      <div className="space-y-2">
                        {selectedTask.assignedStudents.map((student, idx) => (
                          <div
                            key={idx}
                            className="p-3 border border-border rounded-lg"
                          >
                            <p className="font-medium text-foreground">
                              {student.fullName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {student.email}
                            </p>
                            <div className="flex gap-2 mt-2">
                              <span
                                className={`text-xs px-2 py-1 rounded ${
                                  student.progress === "completed"
                                    ? "bg-green-500/10 text-green-600"
                                    : student.progress === "inProgress"
                                    ? "bg-yellow-500/10 text-yellow-600"
                                    : "bg-gray-500/10 text-gray-600"
                                }`}
                              >
                                {student.progress === "completed"
                                  ? "Hoàn thành"
                                  : student.progress === "inProgress"
                                  ? "Đang làm"
                                  : "Chưa bắt đầu"}
                              </span>
                              {student.submissionStatus === "submitted" && (
                                <span className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-600">
                                  Đã nộp
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowDetailModal(false)}
                >
                  Đóng
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {showAssignModal && selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">
                  Gán Task: {selectedTask.taskTitle}
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAssignModal(false)}
                >
                  ×
                </Button>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Chọn các student để gán task này
                </p>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {availableStudents.map((student) => (
                    <div
                      key={student._id}
                      className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted/50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student._id)}
                        onChange={() => toggleStudent(student._id)}
                        className="w-4 h-4"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-foreground">
                          {student.fullName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {student.email}
                        </p>
                      </div>
                      {student.isAssigned && (
                        <span className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-600">
                          Đã gán
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {availableStudents.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Không có student nào trong lab của bạn
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowAssignModal(false)}
                >
                  Hủy
                </Button>
                <Button onClick={handleAssignSubmit} disabled={loading}>
                  Gán Task ({selectedStudents.length})
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

