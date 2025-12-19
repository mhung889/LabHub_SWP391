import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit2, Trash2, Eye, Users, Calendar, Flag } from "lucide-react";
import taskApi from "@/api/taskApi";
import { getUserInfo } from "@/utils/storage";

export default function MentorTasksPage() {
  const [currentUser, setCurrentUser] = useState(null);
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

  useEffect(() => {
    const userInfo = getUserInfo();
    setCurrentUser(userInfo);
  }, []);
  const [formData, setFormData] = useState({
    taskTitle: "",
    description: "",
    startDate: "",
    dueDate: "",
    priority: "medium",
    complexity: "medium",
    status: "Open",
    studentId: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [loadingStudents, setLoadingStudents] = useState(false);

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

  const loadStudents = async () => {
    try {
      setLoadingStudents(true);
      // Lấy danh sách student từ task assignment API
      const response = await taskApi.getTasks({ page: 1, limit: 1 });
      if (response.data.tasks && response.data.tasks.length > 0) {
        const studentsResponse = await taskApi.getAssignedStudents(response.data.tasks[0]._id);
        setAvailableStudents(studentsResponse.data.students || []);
      } else {
        setAvailableStudents([]);
      }
    } catch (error) {
      console.error("Error loading students:", error);
      setAvailableStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleAddTask = async () => {
    setEditingTask(null);
    setFormData({
      taskTitle: "",
      description: "",
      startDate: "",
      dueDate: "",
      priority: "medium",
      complexity: "medium",
      status: "Open",
      studentId: "",
    });
    setFormErrors({});
    await loadStudents();
    setShowForm(true);
  };

  const handleEditTask = async (task) => {
    setEditingTask(task);
    await loadStudents();
    try {
      const studentsResponse = await taskApi.getAssignedStudents(task._id);
      const assignedStudent = studentsResponse.data.students.find((s) => s.isAssigned);
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
        complexity: task.complexity || "medium",
        status: task.status || "Open",
        studentId: assignedStudent ? assignedStudent._id : "",
      });
    } catch (error) {
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
        complexity: task.complexity || "medium",
        status: task.status || "Open",
        studentId: "",
      });
    }
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
      const alreadyAssigned = response.data.students.find((s) => s.isAssigned);
      setSelectedStudent(alreadyAssigned ? alreadyAssigned._id : "");
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
      // Đảm bảo status luôn có giá trị hợp lệ
      const submitData = {
        ...formData,
        status: formData.status || "Open",
      };
      
      if (editingTask) {
        await taskApi.updateTask(editingTask._id, submitData);
        alert("Cập nhật task thành công");
      } else {
        await taskApi.createTask(submitData);
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
    if (!selectedStudent) {
      alert("Vui lòng chọn một student");
      return;
    }

    try {
      setLoading(true);
      await taskApi.assignTask(selectedTask._id, {
        studentId: selectedStudent,
      });
      alert("Gán task thành công");
      setShowAssignModal(false);
      setSelectedStudent("");
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

  const selectStudent = (studentId) => {
    setSelectedStudent(studentId);
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
        return complexity;
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

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Mức Độ Phức Tạp
                </label>
                <select
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  value={formData.complexity}
                  onChange={(e) =>
                    setFormData({ ...formData, complexity: e.target.value })
                  }
                >
                  <option value="easy">Dễ</option>
                  <option value="medium">Trung bình</option>
                  <option value="complex">Phức tạp</option>
                  <option value="veryComplex">Rất phức tạp</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  Gán Cho Sinh Viên
                </label>
                <select
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  value={formData.studentId}
                  onChange={(e) =>
                    setFormData({ ...formData, studentId: e.target.value })
                  }
                  disabled={loadingStudents}
                >
                  <option value="">-- Chọn sinh viên (tùy chọn) --</option>
                  {availableStudents.map((student) => (
                    <option key={student._id} value={student._id}>
                      {student.fullName} {student.isAssigned && "(Đã gán)"}
                    </option>
                  ))}
                </select>
                {loadingStudents && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Đang tải danh sách sinh viên...
                  </p>
                )}
              </div>
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
                      Mức Độ Phức Tạp
                    </th>
                    <th className="text-left px-6 py-4 font-bold text-foreground">
                      Trạng Thái
                    </th>
                    <th className="text-left px-6 py-4 font-bold text-foreground">
                      Người Tạo
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
                        {task.createdBy ? (
                          <div className="flex flex-col">
                            <span className="text-foreground font-medium text-sm">
                              {task.createdBy.fullName || "N/A"}
                            </span>
                            <span
                              className={`text-xs mt-1 ${
                                task.createdBy.role === "mentor"
                                  ? "text-blue-600"
                                  : "text-green-600"
                              }`}
                            >
                              {task.createdBy.role === "mentor" ? "Mentor" : "Student"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">N/A</span>
                        )}
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
                      Mức Độ Phức Tạp
                    </label>
                    <p className="text-foreground">
                      {getComplexityLabel(selectedTask.complexity || "medium")}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Trạng Thái
                    </label>
                    <p className="text-foreground">
                      {selectedTask.status || "Open"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Người Tạo
                    </label>
                    {selectedTask.createdBy ? (
                      <div>
                        <p className="text-foreground font-medium">
                          {typeof selectedTask.createdBy === 'object' 
                            ? selectedTask.createdBy.fullName 
                            : 'N/A'}
                        </p>
                        {typeof selectedTask.createdBy === 'object' && (
                          <p className="text-xs text-muted-foreground">
                            {selectedTask.createdBy.role === 'mentor' ? 'Mentor' : 'Student'}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-foreground">N/A</p>
                    )}
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
                                  : ""}
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
                  Chọn một student để gán task này
                </p>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {availableStudents.map((student) => (
                    <div
                      key={student._id}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedStudent === student._id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      }`}
                      onClick={() => selectStudent(student._id)}
                    >
                      <input
                        type="radio"
                        name="selectedStudent"
                        checked={selectedStudent === student._id}
                        onChange={() => selectStudent(student._id)}
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
                <Button onClick={handleAssignSubmit} disabled={loading || !selectedStudent}>
                  Gán Task
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

