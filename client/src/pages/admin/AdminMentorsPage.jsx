// Import React hooks để quản lý state và lifecycle
import { useState, useEffect } from "react";
// Import các component UI từ shadcn/ui
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Import các icon từ lucide-react
import { Plus, Edit2, Trash2, Eye, Search } from "lucide-react";
// Import modal hiển thị chi tiết mentor
import MentorDetailModal from "./MentorDetailModal";
// Import API client để gọi các API liên quan đến mentor
import mentorApi from "@/api/mentorApi";
// Import API client để gọi các API liên quan đến lab
import labApi from "@/api/labApi";

/**
 * Component quản lý mentor của Admin
 * Cho phép Admin xem, tạo, sửa, xóa mentor
 */
export default function AdminMentorsPage() {
  // State lưu danh sách mentor
  const [mentors, setMentors] = useState([]);
  // State quản lý trạng thái loading
  const [loading, setLoading] = useState(false);
  // State lưu từ khóa tìm kiếm
  const [searchTerm, setSearchTerm] = useState("");
  // State lưu bộ lọc trạng thái: "active", "inactive", hoặc "" (tất cả)
  const [statusFilter, setStatusFilter] = useState(""); // "active", "inactive", or "" for all
  // State quản lý việc hiển thị form tạo/sửa mentor
  const [showForm, setShowForm] = useState(false);
  // State lưu mentor đang được chỉnh sửa (null nếu đang tạo mới)
  const [editingMentor, setEditingMentor] = useState(null);
  // State lưu mentor được chọn để xem chi tiết
  const [selectedMentor, setSelectedMentor] = useState(null);
  // State quản lý việc hiển thị modal chi tiết mentor
  const [showDetailModal, setShowDetailModal] = useState(false);
  // State quản lý phân trang
  const [pagination, setPagination] = useState({
    page: 1,        // Trang hiện tại
    limit: 20,      // Số lượng mỗi trang
    total: 0,       // Tổng số mentor
    totalPages: 0,  // Tổng số trang
  });
  // State lưu dữ liệu form tạo/sửa mentor
  const [formData, setFormData] = useState({
    fullName: "",       // Họ tên
    email: "",          // Email
    password: "",       // Mật khẩu
    phoneNumber: "",    // Số điện thoại
    dateOfBirth: "",    // Ngày sinh
    gender: "",         // Giới tính
    address: "",        // Địa chỉ
    image: null,        // File ảnh
  });
  // State lưu các lỗi validation của form
  const [formErrors, setFormErrors] = useState({});
  // State lưu danh sách lab (để gán cho mentor)
  const [labs, setLabs] = useState([]);
  // State lưu ID lab được chọn để gán cho mentor
  const [selectedLabId, setSelectedLabId] = useState("");
  // State lưu URL preview ảnh trước khi upload
  const [imagePreview, setImagePreview] = useState(null);

  /**
   * Hàm load danh sách mentor từ API với phân trang, tìm kiếm và lọc trạng thái
   * @param {number} page - Số trang (mặc định: 1)
   * @param {string} search - Từ khóa tìm kiếm (mặc định: "")
   * @param {string} status - Trạng thái lọc (mặc định: "")
   */
  const loadMentors = async (page = 1, search = "", status = "") => {
    try {
      // Bật trạng thái loading
      setLoading(true);
      // Gọi API để lấy danh sách mentor
      const response = await mentorApi.getMentors({
        page,                                    // Số trang
        limit: pagination.limit,                 // Số lượng mỗi trang
        search: search || undefined,             // Từ khóa tìm kiếm (undefined nếu rỗng)
        status: status || undefined,             // Trạng thái lọc (undefined nếu rỗng)
      });
      // Cập nhật danh sách mentor từ response
      setMentors(response.data.mentors || []);
      // Cập nhật thông tin phân trang nếu có
      if (response.data.pagination) {
        setPagination({
          ...pagination,                         // Giữ nguyên các giá trị cũ
          page: response.data.pagination.page,   // Cập nhật số trang
          total: response.data.pagination.total, // Cập nhật tổng số mentor
          totalPages: response.data.pagination.totalPages,  // Cập nhật tổng số trang
        });
      }
    } catch (error) {
      // Xử lý lỗi: log lỗi và hiển thị thông báo
      console.error("Error loading mentors:", error);
      alert(error.response?.data?.message || "Lỗi khi tải danh sách mentor");
    } finally {
      // Tắt trạng thái loading dù thành công hay thất bại
      setLoading(false);
    }
  };

  /**
   * Hàm load danh sách lab active từ API
   */
  const loadLabs = async () => {
    try {
      // Gọi API để lấy danh sách lab active
      const response = await labApi.getLabs({ status: 'active' });
      // Cập nhật danh sách lab từ response
      setLabs(response.data.labs || []);
    } catch (error) {
      // Xử lý lỗi: log lỗi và hiển thị thông báo
      console.error("Error loading labs:", error);
      alert(error.response?.data?.message || "Lỗi khi tải danh sách lab");
    }
  };

  // useEffect chạy khi component mount: load danh sách mentor và lab
  useEffect(() => {
    // Load danh sách mentor với từ khóa tìm kiếm và trạng thái hiện tại
    loadMentors(1, searchTerm, statusFilter);
    // Load danh sách lab
    loadLabs();
  }, []);  // Chỉ chạy 1 lần khi component mount

  // useEffect cleanup: giải phóng URL preview ảnh khi component unmount hoặc imagePreview thay đổi
  useEffect(() => {
    return () => {
      // Nếu có imagePreview, giải phóng URL để tránh memory leak
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);  // Chạy lại khi imagePreview thay đổi

  /**
   * Hàm xử lý khi người dùng click nút tìm kiếm
   */
  const handleSearch = async () => {
    // Load lại danh sách mentor từ trang 1 với từ khóa và trạng thái hiện tại
    await loadMentors(1, searchTerm, statusFilter);
  };

  /**
   * Hàm xử lý khi người dùng thay đổi từ khóa tìm kiếm
   * @param {Event} e - Event object từ input
   */
  const handleSearchChange = (e) => {
    // Cập nhật từ khóa tìm kiếm với giá trị mới từ input
    setSearchTerm(e.target.value);
  };

  /**
   * Hàm xử lý khi người dùng nhấn phím trong ô tìm kiếm
   * @param {Event} e - Event object từ input
   */
  const handleSearchKeyPress = (e) => {
    // Nếu nhấn phím Enter, thực hiện tìm kiếm
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  /**
   * Hàm xử lý khi người dùng thay đổi bộ lọc trạng thái
   * @param {Event} e - Event object từ select
   */
  const handleStatusFilterChange = (e) => {
    // Lấy giá trị trạng thái mới từ select
    const newStatus = e.target.value;
    // Cập nhật trạng thái lọc
    setStatusFilter(newStatus);
    // Load lại danh sách mentor từ trang 1 với trạng thái mới
    loadMentors(1, searchTerm, newStatus);
  };

  /**
   * Hàm đóng form tạo/sửa mentor
   */
  const handleCloseForm = () => {
    // Nếu có imagePreview, giải phóng URL
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    // Reset imagePreview
    setImagePreview(null);
    // Ẩn form
    setShowForm(false);
  };

  /**
   * Hàm mở form để tạo mentor mới
   */
  const handleAddMentor = async () => {
    // Nếu có imagePreview, giải phóng URL
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    // Reset editingMentor về null (đang tạo mới)
    setEditingMentor(null);
    // Reset form data về giá trị mặc định
    setFormData({
      fullName: "",       // Họ tên rỗng
      email: "",          // Email rỗng
      password: "",       // Mật khẩu rỗng
      phoneNumber: "",    // Số điện thoại rỗng
      dateOfBirth: "",    // Ngày sinh rỗng
      gender: "",         // Giới tính rỗng
      address: "",        // Địa chỉ rỗng
      image: null,        // Không có ảnh
    });
    // Reset lỗi validation
    setFormErrors({});
    // Reset lab được chọn
    setSelectedLabId("");
    // Reset imagePreview
    setImagePreview(null);
    // Hiển thị form
    setShowForm(true);
  };

  /**
   * Hàm mở form để chỉnh sửa mentor
   * @param {Object} mentor - Object chứa thông tin mentor cần chỉnh sửa
   */
  const handleEditMentor = async (mentor) => {
    // Nếu có imagePreview, giải phóng URL
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    // Set mentor đang được chỉnh sửa
    setEditingMentor(mentor);
    // Điền form với dữ liệu của mentor
    setFormData({
      fullName: mentor.fullName || "",              // Họ tên (mặc định: rỗng)
      email: mentor.email || "",                   // Email (mặc định: rỗng)
      password: "",                                 // Mật khẩu luôn rỗng (không hiển thị)
      phoneNumber: mentor.phoneNumber || "",       // Số điện thoại (mặc định: rỗng)
      dateOfBirth: mentor.dateOfBirth
        ? new Date(mentor.dateOfBirth).toISOString().split("T")[0]  // Chuyển đổi ngày sinh sang format YYYY-MM-DD
        : "",                                       // Ngày sinh (mặc định: rỗng)
      gender: mentor.gender || "",                 // Giới tính (mặc định: rỗng)
      address: mentor.address || "",                // Địa chỉ (mặc định: rỗng)
      image: null,                                  // Không có ảnh mới (giữ ảnh cũ)
    });
    // Reset lỗi validation
    setFormErrors({});
    // Set imagePreview với ảnh hiện tại của mentor
    setImagePreview(mentor.image || null);
    
    // Load thông tin chi tiết mentor để lấy lab được gán
    try {
      const mentorDetail = await mentorApi.getMentorById(mentor._id);
      // Nếu mentor có lab được gán, lấy lab đầu tiên
      if (mentorDetail.data.labs && Array.isArray(mentorDetail.data.labs) && mentorDetail.data.labs.length > 0) {
        const firstLab = mentorDetail.data.labs[0];
        // Set lab được chọn (có thể là _id hoặc id)
        setSelectedLabId(firstLab._id || firstLab.id || "");
      } else {
        // Nếu không có lab, reset về rỗng
        setSelectedLabId("");
      }
    } catch (error) {
      // Xử lý lỗi: log lỗi và reset lab về rỗng
      console.error("Error loading mentor lab:", error);
      setSelectedLabId("");
    }
    
    // Hiển thị form
    setShowForm(true);
  };

  /**
   * Hàm xem chi tiết mentor
   * @param {Object} mentor - Object chứa thông tin mentor cần xem
   */
  const handleViewDetail = async (mentor) => {
    try {
      // Bật trạng thái loading
      setLoading(true);
      // Gọi API để lấy thông tin chi tiết mentor
      const response = await mentorApi.getMentorById(mentor._id);
      // Set mentor được chọn để hiển thị trong modal
      setSelectedMentor(response.data);
      // Hiển thị modal chi tiết
      setShowDetailModal(true);
    } catch (error) {
      // Xử lý lỗi: log lỗi và hiển thị thông báo
      console.error("Error loading mentor detail:", error);
      alert(error.response?.data?.message || "Lỗi khi tải thông tin mentor");
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
    
    // Validate fullName: bắt buộc, tối thiểu 2 ký tự, tối đa 100 ký tự
    if (!formData.fullName.trim()) {
      errors.fullName = "Họ tên là bắt buộc";
    } else if (formData.fullName.trim().length < 2) {
      errors.fullName = "Họ tên phải có ít nhất 2 ký tự";
    } else if (formData.fullName.trim().length > 100) {
      errors.fullName = "Họ tên không được vượt quá 100 ký tự";
    }
    
    // Validate email: bắt buộc, đúng định dạng, tối đa 100 ký tự
    if (!formData.email.trim()) {
      errors.email = "Email là bắt buộc";
    } else {
      // Regex để kiểm tra định dạng email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errors.email = "Email không đúng định dạng";
      } else if (formData.email.trim().length > 100) {
        errors.email = "Email không được vượt quá 100 ký tự";
      }
    }
    
    // Validate password: bắt buộc khi tạo mới, tối thiểu 8 ký tự, tối đa 64 ký tự
    if (!editingMentor && !formData.password) {
      // Nếu đang tạo mới và không có password, báo lỗi
      errors.password = "Mật khẩu là bắt buộc";
    } else if (formData.password) {
      // Nếu có password, validate độ dài
      if (formData.password.length < 8) {
        errors.password = "Mật khẩu phải có ít nhất 8 ký tự";
      } else if (formData.password.length > 64) {
        errors.password = "Mật khẩu không được vượt quá 64 ký tự";
      }
    }
    
    // Validate phoneNumber: nếu có thì phải đúng định dạng (10-11 chữ số), tối đa 20 ký tự
    if (formData.phoneNumber && formData.phoneNumber.trim()) {
      // Regex để kiểm tra số điện thoại: 10-11 chữ số
      const phoneRegex = /^[0-9]{10,11}$/;
      // Loại bỏ khoảng trắng và dấu gạch ngang
      const cleanPhone = formData.phoneNumber.trim().replace(/[\s-]/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        errors.phoneNumber = "Số điện thoại không hợp lệ (10-11 chữ số)";
      } else if (cleanPhone.length > 20) {
        errors.phoneNumber = "Số điện thoại không được vượt quá 20 ký tự";
      }
    }
    
    // Validate dateOfBirth: nếu có thì phải hợp lệ, không được là tương lai, mentor phải ít nhất 18 tuổi
    if (formData.dateOfBirth) {
      // Chuyển đổi dateOfBirth sang đối tượng Date
      const birthDate = new Date(formData.dateOfBirth);
      // Lấy ngày hiện tại
      const today = new Date();
      // Kiểm tra date có hợp lệ không
      if (isNaN(birthDate.getTime())) {
        errors.dateOfBirth = "Ngày sinh không hợp lệ";
      } else if (birthDate > today) {
        // Kiểm tra ngày sinh không được là tương lai
        errors.dateOfBirth = "Ngày sinh không thể là tương lai";
      } else {
        // Tính tuổi dựa trên năm
        const age = today.getFullYear() - birthDate.getFullYear();
        // Tính chênh lệch tháng và ngày
        const monthDiff = today.getMonth() - birthDate.getMonth();
        const dayDiff = today.getDate() - birthDate.getDate();
        // Tính tuổi thực tế (tính cả tháng và ngày)
        const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
        // Kiểm tra mentor phải ít nhất 18 tuổi
        if (actualAge < 18) {
          errors.dateOfBirth = "Mentor phải ít nhất 18 tuổi";
        }
      }
    }
    
    // Validate gender: nếu có thì phải là một trong các giá trị hợp lệ
    if (formData.gender && !['male', 'female', 'other'].includes(formData.gender)) {
      errors.gender = "Giới tính không hợp lệ";
    }
    
    // Validate address: nếu có thì không được vượt quá 255 ký tự
    if (formData.address && formData.address.trim().length > 255) {
      errors.address = "Địa chỉ không được vượt quá 255 ký tự";
    }
    
    // Cập nhật state với các lỗi validation
    setFormErrors(errors);
    // Trả về true nếu không có lỗi, false nếu có lỗi
    return Object.keys(errors).length === 0;
  };

  /**
   * Hàm xử lý khi submit form tạo/sửa mentor
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
      // Tạo FormData để gửi dữ liệu (hỗ trợ upload file)
      const submitData = new FormData();
      // Thêm các field vào FormData
      submitData.append("fullName", formData.fullName);
      submitData.append("email", formData.email);
      // Chỉ thêm password nếu có (khi tạo mới hoặc đổi mật khẩu)
      if (formData.password) {
        submitData.append("password", formData.password);
      }
      // Thêm các field tùy chọn nếu có
      if (formData.phoneNumber) {
        submitData.append("phoneNumber", formData.phoneNumber);
      }
      if (formData.dateOfBirth) {
        submitData.append("dateOfBirth", formData.dateOfBirth);
      }
      if (formData.gender) {
        submitData.append("gender", formData.gender);
      }
      if (formData.address) {
        submitData.append("address", formData.address);
      }
      // Thêm file ảnh nếu có
      if (formData.image) {
        submitData.append("image", formData.image);
      }

      // Thêm labId nếu có lab được chọn
      if (selectedLabId) {
        submitData.append("labId", selectedLabId);
      }

      // Nếu đang chỉnh sửa mentor, gọi API update
      if (editingMentor) {
        await mentorApi.updateMentor(editingMentor._id, submitData);
        alert("Cập nhật mentor thành công");
      } else {
        // Nếu đang tạo mới, gọi API create
        await mentorApi.createMentor(submitData);
        alert("Tạo mentor thành công");
      }

      // Cleanup: giải phóng URL preview ảnh
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      // Reset imagePreview
      setImagePreview(null);
      // Ẩn form
      setShowForm(false);
      // Load lại danh sách mentor
      await loadMentors(pagination.page, searchTerm, statusFilter);
    } catch (error) {
      // Xử lý lỗi: log lỗi và hiển thị thông báo
      console.error("Error saving mentor:", error);
      alert(error.response?.data?.message || "Lỗi khi lưu mentor");
    } finally {
      // Tắt trạng thái loading dù thành công hay thất bại
      setLoading(false);
    }
  };

  /**
   * Hàm xóa mentor (thực chất là set status = "inactive")
   * @param {Object} mentor - Object chứa thông tin mentor cần xóa
   */
  const handleDelete = async (mentor) => {
    // Xác nhận trước khi xóa
    if (!confirm(`Bạn có chắc chắn muốn xóa mentor ${mentor.fullName}?`)) {
      return;  // Nếu không xác nhận, dừng lại
    }

    try {
      // Bật trạng thái loading
      setLoading(true);
      // Gọi API update để set status = "inactive" (soft delete)
      await mentorApi.updateMentor(mentor._id, { status: "inactive" });
      // Hiển thị thông báo thành công
      alert("Xóa mentor thành công");
      // Load lại danh sách mentor
      await loadMentors(pagination.page, searchTerm, statusFilter);
    } catch (error) {
      // Xử lý lỗi: log lỗi và hiển thị thông báo
      console.error("Error deleting mentor:", error);
      alert(error.response?.data?.message || "Lỗi khi xóa mentor");
    } finally {
      // Tắt trạng thái loading dù thành công hay thất bại
      setLoading(false);
    }
  };

  /**
   * Hàm xử lý khi người dùng chọn file ảnh
   * @param {Event} e - Event object từ input file
   */
  const handleImageChange = (e) => {
    // Lấy file đầu tiên từ input
    const file = e.target.files[0];
    // Nếu có file được chọn
    if (file) {
      // Danh sách các loại file ảnh được phép
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      // Kiểm tra loại file có hợp lệ không
      if (!allowedTypes.includes(file.type)) {
        // Nếu không hợp lệ, hiển thị thông báo và reset input
        alert("Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)");
        e.target.value = '';  // Reset input file
        return;  // Dừng lại
      }
      
      // Kiểm tra kích thước file: không được vượt quá 5MB
      if (file.size > 5 * 1024 * 1024) {
        // Nếu quá lớn, hiển thị thông báo và reset input
        alert("Kích thước file không được vượt quá 5MB");
        e.target.value = '';  // Reset input file
        return;  // Dừng lại
      }
      
      // Nếu có imagePreview cũ, giải phóng URL để tránh memory leak
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      
      // Tạo URL preview từ file mới
      const previewUrl = URL.createObjectURL(file);
      // Cập nhật imagePreview
      setImagePreview(previewUrl);
      // Cập nhật formData với file mới
      setFormData({ ...formData, image: file });
      // Xóa lỗi validation của image (nếu có)
      setFormErrors({ ...formErrors, image: undefined }); 
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 max-w-md">
            <Input
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyPress={handleSearchKeyPress}
              placeholder="Tìm kiếm mentor..."
              className="pl-10"
            />
          </div>
          <div className="flex-shrink-0">
            <select
              className="w-full sm:w-48 px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              value={statusFilter}
              onChange={handleStatusFilterChange}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Không hoạt động</option>
            </select>
          </div>
          <Button
            onClick={handleSearch}
            variant="outline"
            className="gap-2 whitespace-nowrap"
            disabled={loading}
          >
            <Search className="w-4 h-4" />
            Tìm kiếm
          </Button>
        </div>
        <Button
          onClick={() => {
            if (showForm) {
              handleCloseForm();
            } else {
              handleAddMentor();
            }
          }}
          className="gap-2 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          {showForm ? "Ẩn Form" : "Thêm Mentor"}
        </Button>
      </div>

      {showForm && (
        <Card className="p-6 bg-muted/50">
          <h3 className="text-lg font-bold text-foreground mb-4">
            {editingMentor ? "Sửa Mentor" : "Thêm Mentor Mới"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Họ Tên <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Nhập họ tên"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  required
                  maxLength={100}
                />
                {formErrors.fullName && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.fullName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  placeholder="Nhập email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  disabled={!!editingMentor}
                  maxLength={100}
                />
                {formErrors.email && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.email}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {editingMentor ? "Mật Khẩu Mới (để trống nếu không đổi)" : "Mật Khẩu"} 
                  {!editingMentor && <span className="text-red-500">*</span>}
                </label>
                <Input
                  type="password"
                  placeholder={editingMentor ? "Nhập mật khẩu mới (tối thiểu 8 ký tự)" : "Nhập mật khẩu (tối thiểu 8 ký tự)"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required={!editingMentor}
                  minLength={8}
                  maxLength={64}
                />
                {formErrors.password && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.password}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Số Điện Thoại
                </label>
                <Input
                  placeholder="Nhập số điện thoại (10-11 chữ số)"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, phoneNumber: e.target.value })
                  }
                  maxLength={20}
                />
                {formErrors.phoneNumber && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.phoneNumber}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Ngày Sinh
                </label>
                <Input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) =>
                    setFormData({ ...formData, dateOfBirth: e.target.value })
                  }
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                />
                {formErrors.dateOfBirth && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.dateOfBirth}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Giới Tính
                </label>
                <select
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData({ ...formData, gender: e.target.value })
                  }
                >
                  <option value="">Chọn giới tính</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Địa Chỉ
                </label>
                <Input
                  placeholder="Nhập địa chỉ"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  maxLength={255}
                />
                {formErrors.address && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.address}</p>
                )}
              </div>
              {/* <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Gán Lab
                </label>
                <select
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  value={selectedLabId}
                  onChange={(e) => setSelectedLabId(e.target.value)}
                >
                  <option value="">-- Chọn Lab --</option>
                  {labs
                    .filter(lab => lab.status === 'active')
                    .map((lab) => (
                      <option key={lab._id} value={lab._id}>
                        {lab.code} - {lab.name} {lab.major ? `(${lab.major})` : ''}
                      </option>
                    ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Mỗi mentor chỉ có thể được gán cho 1 lab
                </p>
              </div> */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Ảnh Đại Diện
                </label>
                <Input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleImageChange}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Chấp nhận: JPEG, PNG, GIF, WebP (tối đa 5MB)
                </p>
                {imagePreview && (
                  <div className="mt-3">
                    <p className="text-sm text-muted-foreground mb-2">
                      {formData.image ? `Ảnh mới: ${formData.image.name} (${(formData.image.size / 1024 / 1024).toFixed(2)} MB)` : "Ảnh hiện tại"}
                    </p>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg border border-border"
                    />
                  </div>
                )}
                {formErrors.image && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.image}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="gap-2" disabled={loading}>
                <Plus className="w-4 h-4" />
                {editingMentor ? "Cập Nhật" : "Tạo Mentor"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseForm}
                disabled={loading}
              >
                Hủy
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        {loading && mentors.length === 0 ? (
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
                      Họ Tên
                    </th>
                    <th className="text-left px-6 py-4 font-bold text-foreground">
                      Email
                    </th>
                    <th className="text-left px-6 py-4 font-bold text-foreground">
                      Số ĐT
                    </th>
                    <th className="text-left px-6 py-4 font-bold text-foreground">
                      Lab
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
                  {mentors.map((mentor) => (
                    <tr
                      key={mentor._id}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-foreground font-medium">
                        {mentor.fullName}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {mentor.email}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {mentor.phoneNumber || "Chưa cập nhật"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                          {mentor.labCount || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                            mentor.status === "active"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : "bg-red-500/10 text-red-600"
                          }`}
                        >
                          {mentor.status === "active" ? "Hoạt động" : "Không hoạt động"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDetail(mentor)}
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditMentor(mentor)}
                            title="Sửa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(mentor)}
                            title="Xóa"
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

            {mentors.length === 0 && (
              <div className="p-12 text-center text-muted-foreground">
                Không tìm thấy mentor nào
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Trang {pagination.page} / {pagination.totalPages} (Tổng: {pagination.total} mentor)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadMentors(pagination.page - 1, searchTerm, statusFilter)}
                    disabled={pagination.page <= 1 || loading}
                  >
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadMentors(pagination.page + 1, searchTerm, statusFilter)}
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

      {/* Detail Modal */}
      <MentorDetailModal
        mentor={selectedMentor}
        open={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedMentor(null);
        }}
      />
    </div>
  );
}
