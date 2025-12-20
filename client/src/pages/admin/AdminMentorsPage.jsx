import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit2, Trash2, Eye, Search } from "lucide-react";
import MentorDetailModal from "./MentorDetailModal";
import mentorApi from "@/api/mentorApi";
import labApi from "@/api/labApi";

export default function AdminMentorsPage() {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // "active", "inactive", or "" for all
  const [showForm, setShowForm] = useState(false);
  const [editingMentor, setEditingMentor] = useState(null);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phoneNumber: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    image: null,
  });
  const [formErrors, setFormErrors] = useState({});
  const [labs, setLabs] = useState([]);
  const [selectedLabId, setSelectedLabId] = useState("");
  const [imagePreview, setImagePreview] = useState(null);

  const loadMentors = async (page = 1, search = "", status = "") => {
    try {
      setLoading(true);
      const response = await mentorApi.getMentors({
        page,
        limit: pagination.limit,
        search: search || undefined,
        status: status || undefined,
      });
      setMentors(response.data.mentors || []);
      if (response.data.pagination) {
        setPagination({
          ...pagination,
          page: response.data.pagination.page,
          total: response.data.pagination.total,
          totalPages: response.data.pagination.totalPages,
        });
      }
    } catch (error) {
      console.error("Error loading mentors:", error);
      alert(error.response?.data?.message || "Lỗi khi tải danh sách mentor");
    } finally {
      setLoading(false);
    }
  };

  const loadLabs = async () => {
    try {
      const response = await labApi.getLabs({ status: 'active' });
      setLabs(response.data.labs || []);
    } catch (error) {
      console.error("Error loading labs:", error);
      alert(error.response?.data?.message || "Lỗi khi tải danh sách lab");
    }
  };

  useEffect(() => {
    loadMentors(1, searchTerm, statusFilter);
    loadLabs();
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleSearch = async () => {
    await loadMentors(1, searchTerm, statusFilter);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleStatusFilterChange = (e) => {
    const newStatus = e.target.value;
    setStatusFilter(newStatus);
    loadMentors(1, searchTerm, newStatus);
  };

  const handleCloseForm = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setShowForm(false);
  };

  const handleAddMentor = async () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setEditingMentor(null);
    setFormData({
      fullName: "",
      email: "",
      password: "",
      phoneNumber: "",
      dateOfBirth: "",
      gender: "",
      address: "",
      image: null,
    });
    setFormErrors({});
    setSelectedLabId("");
    setImagePreview(null);
    setShowForm(true);
  };

  const handleEditMentor = async (mentor) => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setEditingMentor(mentor);
    setFormData({
      fullName: mentor.fullName || "",
      email: mentor.email || "",
      password: "",
      phoneNumber: mentor.phoneNumber || "",
      dateOfBirth: mentor.dateOfBirth
        ? new Date(mentor.dateOfBirth).toISOString().split("T")[0]
        : "",
      gender: mentor.gender || "",
      address: mentor.address || "",
      image: null,
    });
    setFormErrors({});
    setImagePreview(mentor.image || null);
    
    try {
      const mentorDetail = await mentorApi.getMentorById(mentor._id);
      if (mentorDetail.data.labs && Array.isArray(mentorDetail.data.labs) && mentorDetail.data.labs.length > 0) {
        const firstLab = mentorDetail.data.labs[0];
        setSelectedLabId(firstLab._id || firstLab.id || "");
      } else {
        setSelectedLabId("");
      }
    } catch (error) {
      console.error("Error loading mentor lab:", error);
      setSelectedLabId("");
    }
    
    setShowForm(true);
  };

  const handleViewDetail = async (mentor) => {
    try {
      setLoading(true);
      const response = await mentorApi.getMentorById(mentor._id);
      setSelectedMentor(response.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error("Error loading mentor detail:", error);
      alert(error.response?.data?.message || "Lỗi khi tải thông tin mentor");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.fullName.trim()) {
      errors.fullName = "Họ tên là bắt buộc";
    } else if (formData.fullName.trim().length < 2) {
      errors.fullName = "Họ tên phải có ít nhất 2 ký tự";
    } else if (formData.fullName.trim().length > 100) {
      errors.fullName = "Họ tên không được vượt quá 100 ký tự";
    }
    
    if (!formData.email.trim()) {
      errors.email = "Email là bắt buộc";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errors.email = "Email không đúng định dạng";
      } else if (formData.email.trim().length > 100) {
        errors.email = "Email không được vượt quá 100 ký tự";
      }
    }
    
    if (!editingMentor && !formData.password) {
      errors.password = "Mật khẩu là bắt buộc";
    } else if (formData.password) {
      if (formData.password.length < 8) {
        errors.password = "Mật khẩu phải có ít nhất 8 ký tự";
      } else if (formData.password.length > 64) {
        errors.password = "Mật khẩu không được vượt quá 64 ký tự";
      }
    }
    
    if (formData.phoneNumber && formData.phoneNumber.trim()) {
      const phoneRegex = /^[0-9]{10,11}$/;
      const cleanPhone = formData.phoneNumber.trim().replace(/[\s-]/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        errors.phoneNumber = "Số điện thoại không hợp lệ (10-11 chữ số)";
      } else if (cleanPhone.length > 20) {
        errors.phoneNumber = "Số điện thoại không được vượt quá 20 ký tự";
      }
    }
    
    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      if (isNaN(birthDate.getTime())) {
        errors.dateOfBirth = "Ngày sinh không hợp lệ";
      } else if (birthDate > today) {
        errors.dateOfBirth = "Ngày sinh không thể là tương lai";
      } else {
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        const dayDiff = today.getDate() - birthDate.getDate();
        const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
        if (actualAge < 18) {
          errors.dateOfBirth = "Mentor phải ít nhất 18 tuổi";
        }
      }
    }
    
    if (formData.gender && !['male', 'female', 'other'].includes(formData.gender)) {
      errors.gender = "Giới tính không hợp lệ";
    }
    
    if (formData.address && formData.address.trim().length > 255) {
      errors.address = "Địa chỉ không được vượt quá 255 ký tự";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      const submitData = new FormData();
      submitData.append("fullName", formData.fullName);
      submitData.append("email", formData.email);
      if (formData.password) {
        submitData.append("password", formData.password);
      }
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
      if (formData.image) {
        submitData.append("image", formData.image);
      }

      if (selectedLabId) {
        submitData.append("labId", selectedLabId);
      }

      if (editingMentor) {
        await mentorApi.updateMentor(editingMentor._id, submitData);
        alert("Cập nhật mentor thành công");
      } else {
        await mentorApi.createMentor(submitData);
        alert("Tạo mentor thành công");
      }

      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview(null);
      setShowForm(false);
      await loadMentors(pagination.page, searchTerm, statusFilter);
    } catch (error) {
      console.error("Error saving mentor:", error);
      alert(error.response?.data?.message || "Lỗi khi lưu mentor");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (mentor) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa mentor ${mentor.fullName}?`)) {
      return;
    }

    try {
      setLoading(true);
      await mentorApi.updateMentor(mentor._id, { status: "inactive" });
      alert("Xóa mentor thành công");
      await loadMentors(pagination.page, searchTerm, statusFilter);
    } catch (error) {
      console.error("Error deleting mentor:", error);
      alert(error.response?.data?.message || "Lỗi khi xóa mentor");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert("Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)");
        e.target.value = ''; 
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert("Kích thước file không được vượt quá 5MB");
        e.target.value = '';
        return;
      }
      
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setFormData({ ...formData, image: file });
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
