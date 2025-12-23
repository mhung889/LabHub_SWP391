// Import React hooks để quản lý state và lifecycle
import { useState, useEffect } from "react";
// Import các component UI từ shadcn/ui
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Import các icon từ lucide-react
import { Plus, Edit2, Trash2, Eye, Users, Calendar, Flag } from "lucide-react";
// Import API client để gọi các API liên quan đến task
import taskApi from "@/api/taskApi";
// Import hàm lấy thông tin user từ storage
import { getUserInfo } from "@/utils/storage";

/**
 * Component quản lý task của Mentor
 * Cho phép Mentor xem, tạo, sửa, xóa, gán task cho student
 */
export default function MentorTasksPage() {
  // State lưu thông tin user hiện tại (mentor)
  const [currentUser, setCurrentUser] = useState(null);
  // State lưu danh sách task
  const [tasks, setTasks] = useState([]);
  // State quản lý trạng thái loading
  const [loading, setLoading] = useState(false);
  // State quản lý việc hiển thị form tạo/sửa task
  const [showForm, setShowForm] = useState(false);
  // State lưu task đang được chỉnh sửa (null nếu đang tạo mới)
  const [editingTask, setEditingTask] = useState(null);
  // State lưu task được chọn để xem chi tiết hoặc gán
  const [selectedTask, setSelectedTask] = useState(null);
  // State quản lý việc hiển thị modal chi tiết task
  const [showDetailModal, setShowDetailModal] = useState(false);
  // State quản lý việc hiển thị modal gán task
  const [showAssignModal, setShowAssignModal] = useState(false);
  // State quản lý phân trang
  const [pagination, setPagination] = useState({
    page: 1,        // Trang hiện tại
    limit: 20,      // Số lượng mỗi trang
    total: 0,       // Tổng số task
    totalPages: 0,  // Tổng số trang
  });

  useEffect(() => {
    const userInfo = getUserInfo();
    setCurrentUser(userInfo);
  }, []);
  // State lưu dữ liệu form tạo/sửa task
  const [formData, setFormData] = useState({
    taskTitle: "",      // Tiêu đề task
    description: "",    // Mô tả task
    startDate: "",      // Ngày bắt đầu
    dueDate: "",        // Ngày hết hạn
    priority: "medium", // Độ ưu tiên (mặc định: medium)
    complexity: "medium", // Mức độ phức tạp (mặc định: medium)
    status: "Open",     // Trạng thái (mặc định: Open)
    studentId: "",      // ID student được gán (tùy chọn)
  });
  // State lưu các lỗi validation của form
  const [formErrors, setFormErrors] = useState({});
  // State lưu danh sách student có thể gán cho task
  const [availableStudents, setAvailableStudents] = useState([]);
  // State lưu ID student được chọn để gán task
  const [selectedStudent, setSelectedStudent] = useState("");
  // State quản lý trạng thái loading khi load danh sách student
  const [loadingStudents, setLoadingStudents] = useState(false);

  /**
   * Hàm load danh sách task từ API với phân trang
   * @param {number} page - Số trang (mặc định: 1)
   */
  const loadTasks = async (page = 1) => {
    try {
      // Bật trạng thái loading
      setLoading(true);
      // Gọi API để lấy danh sách task
      const response = await taskApi.getTasks({
        page,                    // Số trang
        limit: pagination.limit, // Số lượng mỗi trang
      });
      // Cập nhật danh sách task từ response
      setTasks(response.data.tasks || []);
      // Cập nhật thông tin phân trang nếu có
      if (response.data.pagination) {
        setPagination({
          ...pagination,                         // Giữ nguyên các giá trị cũ
          page: response.data.pagination.page,   // Cập nhật số trang
          total: response.data.pagination.total, // Cập nhật tổng số task
          totalPages: response.data.pagination.totalPages,  // Cập nhật tổng số trang
        });
      }
    } catch (error) {
      // Xử lý lỗi: log lỗi và hiển thị thông báo
      console.error("Error loading tasks:", error);
      alert(error.response?.data?.message || "Lỗi khi tải danh sách task");
    } finally {
      // Tắt trạng thái loading dù thành công hay thất bại
      setLoading(false);
    }
  };

  // useEffect chạy khi component mount: load danh sách task và thông tin user
  useEffect(() => {
    // Load danh sách task từ trang 1
    loadTasks(1);
    // Lấy thông tin user hiện tại từ storage
    const userInfo = getUserInfo();
    setCurrentUser(userInfo);
  }, []);  // Chỉ chạy 1 lần khi component mount

  /**
   * Hàm load danh sách student có thể gán cho task
   */
  const loadStudents = async () => {
    try {
      // Bật trạng thái loading students
      setLoadingStudents(true);
      // Lấy danh sách student từ task assignment API
      // (Workaround: lấy từ task đầu tiên để có danh sách student trong lab)
      const response = await taskApi.getTasks({ page: 1, limit: 1 });
      // Nếu có task, lấy danh sách student từ task đó
      if (response.data.tasks && response.data.tasks.length > 0) {
        const studentsResponse = await taskApi.getAssignedStudents(response.data.tasks[0]._id);
        // Cập nhật danh sách student có thể gán
        setAvailableStudents(studentsResponse.data.students || []);
      } else {
        // Nếu không có task, set danh sách rỗng
        setAvailableStudents([]);
      }
    } catch (error) {
      // Xử lý lỗi: log lỗi và set danh sách rỗng
      console.error("Error loading students:", error);
      setAvailableStudents([]);
    } finally {
      // Tắt trạng thái loading students dù thành công hay thất bại
      setLoadingStudents(false);
    }
  };

  /**
   * Hàm mở form để tạo task mới
   */
  const handleAddTask = async () => {
    // Reset editingTask về null (đang tạo mới)
    setEditingTask(null);
    // Reset form data về giá trị mặc định
    setFormData({
      taskTitle: "",      // Tiêu đề rỗng
      description: "",    // Mô tả rỗng
      startDate: "",      // Ngày bắt đầu rỗng
      dueDate: "",        // Ngày hết hạn rỗng
      priority: "medium", // Độ ưu tiên mặc định: medium
      complexity: "medium", // Mức độ phức tạp mặc định: medium
      status: "Open",     // Trạng thái mặc định: Open
      studentId: "",      // Không có student được gán
    });
    // Reset lỗi validation
    setFormErrors({});
    // Load danh sách student có thể gán
    await loadStudents();
    // Hiển thị form
    setShowForm(true);
  };

  /**
   * Hàm mở form để chỉnh sửa task
   * @param {Object} task - Object chứa thông tin task cần chỉnh sửa
   */
  const handleEditTask = async (task) => {
    // Set task đang được chỉnh sửa
    setEditingTask(task);
    // Load danh sách student có thể gán
    await loadStudents();
    try {
      // Lấy danh sách student và tìm student đã được gán cho task này
      const studentsResponse = await taskApi.getAssignedStudents(task._id);
      const assignedStudent = studentsResponse.data.students.find((s) => s.isAssigned);
      // Điền form với dữ liệu của task
      setFormData({
        taskTitle: task.taskTitle || "",              // Tiêu đề (mặc định: rỗng)
        description: task.description || "",          // Mô tả (mặc định: rỗng)
        startDate: task.startDate
          ? new Date(task.startDate).toISOString().split("T")[0]  // Chuyển đổi ngày bắt đầu sang format YYYY-MM-DD
          : "",                                        // Ngày bắt đầu (mặc định: rỗng)
        dueDate: task.dueDate
          ? new Date(task.dueDate).toISOString().split("T")[0]    // Chuyển đổi ngày hết hạn sang format YYYY-MM-DD
          : "",                                        // Ngày hết hạn (mặc định: rỗng)
        priority: task.priority || "medium",          // Độ ưu tiên (mặc định: medium)
        complexity: task.complexity || "medium",      // Mức độ phức tạp (mặc định: medium)
        status: task.status || "Open",                // Trạng thái (mặc định: Open)
        studentId: assignedStudent ? assignedStudent._id : "",  // ID student đã được gán (nếu có)
      });
    } catch (error) {
      // Nếu lỗi khi load student, vẫn điền form nhưng không có studentId
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
        studentId: "",  // Không có studentId nếu lỗi
      });
    }
    // Reset lỗi validation
    setFormErrors({});
    // Hiển thị form
    setShowForm(true);
  };

  /**
   * Hàm xem chi tiết task
   * @param {Object} task - Object chứa thông tin task cần xem
   */
  const handleViewDetail = async (task) => {
    try {
      // Bật trạng thái loading
      setLoading(true);
      // Gọi API để lấy thông tin chi tiết task
      const response = await taskApi.getTaskById(task._id);
      // Set task được chọn để hiển thị trong modal
      setSelectedTask(response.data);
      // Hiển thị modal chi tiết
      setShowDetailModal(true);
    } catch (error) {
      // Xử lý lỗi: log lỗi và hiển thị thông báo
      console.error("Error loading task detail:", error);
      alert(error.response?.data?.message || "Lỗi khi tải thông tin task");
    } finally {
      // Tắt trạng thái loading dù thành công hay thất bại
      setLoading(false);
    }
  };

  /**
   * Hàm mở modal để gán task cho student
   * @param {Object} task - Object chứa thông tin task cần gán
   */
  const handleAssignTask = async (task) => {
    try {
      // Bật trạng thái loading
      setLoading(true);
      // Lấy danh sách student có thể gán cho task này
      const response = await taskApi.getAssignedStudents(task._id);
      // Cập nhật danh sách student
      setAvailableStudents(response.data.students || []);
      // Set task được chọn
      setSelectedTask(task);
      // Tìm student đã được gán cho task này (nếu có)
      const alreadyAssigned = response.data.students.find((s) => s.isAssigned);
      // Set student được chọn (student đã gán hoặc rỗng)
      setSelectedStudent(alreadyAssigned ? alreadyAssigned._id : "");
      // Hiển thị modal gán task
      setShowAssignModal(true);
    } catch (error) {
      // Xử lý lỗi: log lỗi và hiển thị thông báo
      console.error("Error loading students:", error);
      alert(error.response?.data?.message || "Lỗi khi tải danh sách student");
    } finally {
      // Tắt trạng thái loading dù thành công hay thất bại
      setLoading(false);
    }
  };

  /**
   * Hàm validate form trước khi submit
   * @returns {boolean} - true nếu form hợp lệ, false nếu có lỗi
   */
  const validateForm = () => {
    // Khởi tạo object chứa các lỗi validation
    const errors = {};
    // Validate taskTitle: bắt buộc, tối đa 200 ký tự
    if (!formData.taskTitle.trim()) {
      errors.taskTitle = "Tiêu đề task là bắt buộc";
    } else if (formData.taskTitle.trim().length > 200) {
      errors.taskTitle = "Tiêu đề không được vượt quá 200 ký tự";
    }
    // Validate startDate: bắt buộc
    if (!formData.startDate) {
      errors.startDate = "Ngày bắt đầu là bắt buộc";
    }
    // Validate dueDate: bắt buộc
    if (!formData.dueDate) {
      errors.dueDate = "Ngày hết hạn là bắt buộc";
    }
    // Validate startDate phải nhỏ hơn hoặc bằng dueDate
    if (formData.startDate && formData.dueDate) {
      // Chuyển đổi sang đối tượng Date để so sánh
      const start = new Date(formData.startDate);
      const due = new Date(formData.dueDate);
      // Kiểm tra startDate không được lớn hơn dueDate
      if (start > due) {
        errors.dueDate = "Ngày hết hạn phải lớn hơn hoặc bằng ngày bắt đầu";
      }
    }
    // Cập nhật state với các lỗi validation
    setFormErrors(errors);
    // Trả về true nếu không có lỗi, false nếu có lỗi
    return Object.keys(errors).length === 0;
  };

  /**
   * Hàm xử lý khi submit form tạo/sửa task
   * @param {Event} e - Event object từ form submit
   */
  const handleSubmit = async (e) => {
    // Ngăn chặn hành vi mặc định của form (reload page)
    e.preventDefault();
    // Validate form trước khi submit, nếu không hợp lệ thì dừng lại
    if (!validateForm()) return;

    try {
      // Bật trạng thái loading
      setLoading(true);
      // Chuẩn bị dữ liệu submit, đảm bảo status luôn có giá trị hợp lệ
      const submitData = {
        ...formData,                    // Spread tất cả dữ liệu form
        status: formData.status || "Open",  // Đảm bảo status luôn có giá trị (mặc định: Open)
      };
      
      // Nếu đang chỉnh sửa task, gọi API update
      if (editingTask) {
        await taskApi.updateTask(editingTask._id, submitData);
        alert("Cập nhật task thành công");
      } else {
        // Nếu đang tạo mới, gọi API create
        await taskApi.createTask(submitData);
        alert("Tạo task thành công");
      }
      // Ẩn form
      setShowForm(false);
      // Reset editingTask
      setEditingTask(null);
      // Load lại danh sách task
      await loadTasks(pagination.page);
    } catch (error) {
      // Xử lý lỗi: log lỗi và hiển thị thông báo
      console.error("Error saving task:", error);
      alert(error.response?.data?.message || "Lỗi khi lưu task");
    } finally {
      // Tắt trạng thái loading dù thành công hay thất bại
      setLoading(false);
    }
  };

  /**
   * Hàm xử lý khi submit form gán task cho student
   */
  const handleAssignSubmit = async () => {
    // Kiểm tra đã chọn student chưa
    if (!selectedStudent) {
      alert("Vui lòng chọn một student");
      return;  // Nếu chưa chọn, dừng lại
    }

    try {
      // Bật trạng thái loading
      setLoading(true);
      // Gọi API để gán task cho student
      await taskApi.assignTask(selectedTask._id, {
        studentId: selectedStudent,  // ID của student được chọn
      });
      // Hiển thị thông báo thành công
      alert("Gán task thành công");
      // Ẩn modal gán task
      setShowAssignModal(false);
      // Reset student được chọn
      setSelectedStudent("");
      // Load lại danh sách task
      await loadTasks(pagination.page);
    } catch (error) {
      // Xử lý lỗi: log lỗi và hiển thị thông báo
      console.error("Error assigning task:", error);
      alert(error.response?.data?.message || "Lỗi khi gán task");
    } finally {
      // Tắt trạng thái loading dù thành công hay thất bại
      setLoading(false);
    }
  };

  /**
   * Hàm xóa task
   * @param {Object} task - Object chứa thông tin task cần xóa
   */
  const handleDelete = async (task) => {
    // Xác nhận trước khi xóa
    if (!confirm(`Bạn có chắc chắn muốn xóa task "${task.taskTitle}"?`)) {
      return;  // Nếu không xác nhận, dừng lại
    }

    try {
      // Bật trạng thái loading
      setLoading(true);
      // Gọi API delete để xóa task
      await taskApi.deleteTask(task._id);
      // Hiển thị thông báo thành công
      alert("Xóa task thành công");
      // Load lại danh sách task
      await loadTasks(pagination.page);
    } catch (error) {
      // Xử lý lỗi: log lỗi và hiển thị thông báo
      console.error("Error deleting task:", error);
      alert(error.response?.data?.message || "Lỗi khi xóa task");
    } finally {
      // Tắt trạng thái loading dù thành công hay thất bại
      setLoading(false);
    }
  };

  /**
   * Hàm chọn student để gán task
   * @param {string} studentId - ID của student được chọn
   */
  const selectStudent = (studentId) => {
    // Cập nhật student được chọn
    setSelectedStudent(studentId);
  };

  /**
   * Hàm lấy màu CSS cho độ ưu tiên
   * @param {string} priority - Độ ưu tiên: "high", "medium", "low"
   * @returns {string} - Class CSS tương ứng với màu
   */
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-500/10 text-red-600";      // Màu đỏ cho độ ưu tiên cao
      case "medium":
        return "bg-yellow-500/10 text-yellow-600";  // Màu vàng cho độ ưu tiên trung bình
      case "low":
        return "bg-green-500/10 text-green-600";    // Màu xanh lá cho độ ưu tiên thấp
      default:
        return "bg-gray-500/10 text-gray-600";      // Màu xám mặc định
    }
  };

  /**
   * Hàm lấy nhãn tiếng Việt cho độ ưu tiên
   * @param {string} priority - Độ ưu tiên: "high", "medium", "low"
   * @returns {string} - Nhãn tiếng Việt tương ứng
   */
  const getPriorityLabel = (priority) => {
    switch (priority) {
      case "high":
        return "Cao";        // Độ ưu tiên cao
      case "medium":
        return "Trung bình"; // Độ ưu tiên trung bình
      case "low":
        return "Thấp";       // Độ ưu tiên thấp
      default:
        return priority;     // Trả về giá trị gốc nếu không khớp
    }
  };

  /**
   * Hàm lấy nhãn tiếng Việt cho mức độ phức tạp
   * @param {string} complexity - Mức độ phức tạp: "easy", "medium", "complex", "veryComplex"
   * @returns {string} - Nhãn tiếng Việt tương ứng
   */
  const getComplexityLabel = (complexity) => {
    switch (complexity) {
      case "easy":
        return "Dễ";              // Mức độ dễ
      case "medium":
        return "Trung bình";      // Mức độ trung bình
      case "complex":
        return "Phức tạp";        // Mức độ phức tạp
      case "veryComplex":
        return "Rất phức tạp";    // Mức độ rất phức tạp
      default:
        return complexity;        // Trả về giá trị gốc nếu không khớp
    }
  };

  /**
   * Hàm lấy màu CSS cho mức độ phức tạp
   * @param {string} complexity - Mức độ phức tạp: "easy", "medium", "complex", "veryComplex"
   * @returns {string} - Class CSS tương ứng với màu
   */
  const getComplexityColor = (complexity) => {
    switch (complexity) {
      case "easy":
        return "bg-green-500/10 text-green-600";      // Màu xanh lá cho mức độ dễ
      case "medium":
        return "bg-blue-500/10 text-blue-600";       // Màu xanh dương cho mức độ trung bình
      case "complex":
        return "bg-orange-500/10 text-orange-600";    // Màu cam cho mức độ phức tạp
      case "veryComplex":
        return "bg-red-500/10 text-red-600";          // Màu đỏ cho mức độ rất phức tạp
      default:
        return "bg-gray-500/10 text-gray-600";        // Màu xám mặc định
    }
  };

  /**
   * Hàm lấy màu CSS cho trạng thái task
   * @param {string} status - Trạng thái: "Open", "To do", "In progress", "Reviewing", "Done", "Cancel"
   * @returns {string} - Class CSS tương ứng với màu
   */
  const getStatusColor = (status) => {
    switch (status) {
      case "Open":
        return "bg-blue-500/10 text-blue-600";        // Màu xanh dương cho trạng thái Open
      case "To do":
        return "bg-gray-500/10 text-gray-600";        // Màu xám cho trạng thái To do
      case "In progress":
        return "bg-yellow-500/10 text-yellow-600";    // Màu vàng cho trạng thái In progress
      case "Reviewing":
        return "bg-purple-500/10 text-purple-600";    // Màu tím cho trạng thái Reviewing
      case "Done":
        return "bg-emerald-500/10 text-emerald-600";  // Màu xanh lá cho trạng thái Done
      case "Cancel":
        return "bg-red-500/10 text-red-600";          // Màu đỏ cho trạng thái Cancel
      default:
        return "bg-gray-500/10 text-gray-600";        // Màu xám mặc định
    }
  };

  /**
   * Hàm format ngày tháng sang định dạng tiếng Việt
   * @param {string|Date} dateString - Chuỗi ngày tháng hoặc Date object
   * @returns {string} - Ngày tháng đã được format (hoặc "N/A" nếu không có)
   */
  const formatDate = (dateString) => {
    // Nếu không có dateString, trả về "N/A"
    if (!dateString) return "N/A";
    // Chuyển đổi dateString sang đối tượng Date
    const date = new Date(dateString);
    // Format sang định dạng tiếng Việt (dd/mm/yyyy)
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

