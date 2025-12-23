// Import React hooks để quản lý state và lifecycle
import { useState, useEffect } from "react";
// Import các component UI từ shadcn/ui
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Import các icon từ lucide-react
import { Plus, Edit2, Trash2, Search, X, Users, Building2 } from "lucide-react";
// Import API client để gọi các API liên quan đến major
import majorApi from "@/api/majorApi";

/**
 * Component quản lý chuyên ngành (major) của Admin
 * Cho phép Admin xem, tạo, sửa, xóa chuyên ngành
 */
export default function AdminMajorsPage() {
  // State lưu danh sách chuyên ngành
  const [majors, setMajors] = useState([]);
  // State quản lý trạng thái loading
  const [loading, setLoading] = useState(false);
  // State lưu từ khóa tìm kiếm
  const [searchTerm, setSearchTerm] = useState("");
  // State quản lý việc hiển thị form tạo/sửa chuyên ngành
  const [showForm, setShowForm] = useState(false);
  // State lưu chuyên ngành đang được chỉnh sửa (null nếu đang tạo mới)
  const [editingMajor, setEditingMajor] = useState(null);
  // State lưu chuyên ngành được chọn để xem chi tiết
  const [selectedMajor, setSelectedMajor] = useState(null);
  // State quản lý việc hiển thị modal chi tiết chuyên ngành
  const [showDetail, setShowDetail] = useState(false);
  // State quản lý phân trang
  const [pagination, setPagination] = useState({
    page: 1,        // Trang hiện tại
    limit: 20,      // Số lượng mỗi trang
    total: 0,       // Tổng số chuyên ngành
    totalPages: 0,  // Tổng số trang
  });
  // State lưu dữ liệu form tạo/sửa chuyên ngành
  const [formData, setFormData] = useState({
    name: "",         // Tên chuyên ngành
    code: "",         // Mã chuyên ngành
    description: "", // Mô tả chuyên ngành
  });
  // State lưu các lỗi validation của form
  const [formErrors, setFormErrors] = useState({});

  // useEffect chạy khi component mount hoặc khi pagination.page hoặc searchTerm thay đổi
  useEffect(() => {
    // Load danh sách chuyên ngành
    loadMajors();
  }, [pagination.page, searchTerm]);  // Chạy lại khi pagination.page hoặc searchTerm thay đổi

  /**
   * Hàm load danh sách chuyên ngành từ API với phân trang và tìm kiếm
   */
  const loadMajors = async () => {
    try {
      // Bật trạng thái loading
      setLoading(true);
      // Gọi API để lấy danh sách chuyên ngành
      const response = await majorApi.getAll({
        page: pagination.page,                    // Số trang
        limit: pagination.limit,                   // Số lượng mỗi trang
        search: searchTerm || undefined,           // Từ khóa tìm kiếm (undefined nếu rỗng)
      });
      // Cập nhật danh sách chuyên ngành từ response
      setMajors(response.data.majors || []);
      // Cập nhật thông tin phân trang nếu có
      if (response.data.pagination) {
        setPagination({
          ...pagination,                          // Giữ nguyên các giá trị cũ
          ...response.data.pagination,            // Cập nhật với dữ liệu mới từ API
        });
      }
    } catch (error) {
      // Xử lý lỗi: log lỗi và hiển thị thông báo
      console.error("Error loading majors:", error);
      alert(error.response?.data?.message || "Lỗi khi tải danh sách chuyên ngành");
    } finally {
      // Tắt trạng thái loading dù thành công hay thất bại
      setLoading(false);
    }
  };

  /**
   * Hàm xử lý khi người dùng click nút tìm kiếm
   */
  const handleSearch = () => {
    // Reset về trang 1 khi tìm kiếm
    setPagination({ ...pagination, page: 1 });
    // Load lại danh sách chuyên ngành
    loadMajors();
  };

  /**
   * Hàm xử lý khi người dùng nhấn phím trong ô tìm kiếm
   * @param {Event} e - Event object từ input
   */
  const handleSearchKeyPress = (e) => {
    // Nếu nhấn phím Enter, thực hiện tìm kiếm
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  /**
   * Hàm mở form để tạo chuyên ngành mới
   */
  const handleAddMajor = () => {
    // Reset editingMajor về null (đang tạo mới)
    setEditingMajor(null);
    // Reset form data về giá trị mặc định
    setFormData({
      name: "",         // Tên rỗng
      code: "",         // Mã rỗng
      description: "",  // Mô tả rỗng
    });
    // Reset lỗi validation
    setFormErrors({});
    // Hiển thị form
    setShowForm(true);
  };

  /**
   * Hàm mở form để chỉnh sửa chuyên ngành
   * @param {Object} major - Object chứa thông tin chuyên ngành cần chỉnh sửa
   */
  const handleEditMajor = (major) => {
    // Set chuyên ngành đang được chỉnh sửa
    setEditingMajor(major);
    // Điền form với dữ liệu của chuyên ngành
    setFormData({
      name: major.name || "",              // Tên (mặc định: rỗng)
      code: major.code || "",              // Mã (mặc định: rỗng)
      description: major.description || "", // Mô tả (mặc định: rỗng)
    });
    // Reset lỗi validation
    setFormErrors({});
    // Hiển thị form
    setShowForm(true);
  };

  /**
   * Hàm xem chi tiết chuyên ngành
   * @param {Object} major - Object chứa thông tin chuyên ngành cần xem
   */
  const handleViewDetail = async (major) => {
    try {
      // Bật trạng thái loading
      setLoading(true);
      // Gọi API để lấy thông tin chi tiết chuyên ngành
      const response = await majorApi.getById(major._id);
      // Set chuyên ngành được chọn để hiển thị trong modal
      setSelectedMajor(response.data.major);
      // Hiển thị modal chi tiết
      setShowDetail(true);
    } catch (error) {
      // Xử lý lỗi: log lỗi và hiển thị thông báo
      console.error("Error loading major detail:", error);
      alert(error.response?.data?.message || "Lỗi khi tải thông tin chuyên ngành");
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

    // Validate name: bắt buộc, tối thiểu 2 ký tự
    if (!formData.name.trim()) {
      errors.name = "Tên chuyên ngành là bắt buộc";
    } else if (formData.name.trim().length < 2) {
      errors.name = "Tên chuyên ngành phải có ít nhất 2 ký tự";
    }

    // Validate code: bắt buộc, tối thiểu 2 ký tự, tự động chuyển sang chữ hoa
    if (!formData.code.trim()) {
      errors.code = "Mã chuyên ngành là bắt buộc";
    } else if (formData.code.trim().length < 2) {
      errors.code = "Mã chuyên ngành phải có ít nhất 2 ký tự";
    } else {
      // Tự động chuyển code sang chữ hoa
      setFormData({ ...formData, code: formData.code.trim().toUpperCase() });
    }

    // Cập nhật state với các lỗi validation
    setFormErrors(errors);
    // Trả về true nếu không có lỗi, false nếu có lỗi
    return Object.keys(errors).length === 0;
  };

  /**
   * Hàm xử lý khi submit form tạo/sửa chuyên ngành
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
      // Chuẩn bị dữ liệu submit (trim và uppercase code)
      const submitData = {
        name: formData.name.trim(),                        // Tên đã trim
        code: formData.code.trim().toUpperCase(),         // Mã chuyển sang chữ hoa và trim
        description: formData.description.trim(),          // Mô tả đã trim
      };

      // Nếu đang chỉnh sửa chuyên ngành, gọi API update
      if (editingMajor) {
        await majorApi.update(editingMajor._id, submitData);
        alert("Cập nhật chuyên ngành thành công");
      } else {
        // Nếu đang tạo mới, gọi API create
        await majorApi.create(submitData);
        alert("Tạo chuyên ngành thành công");
      }

      // Ẩn form
      setShowForm(false);
      // Load lại danh sách chuyên ngành
      loadMajors();
    } catch (error) {
      // Xử lý lỗi: log lỗi và hiển thị thông báo
      console.error("Error saving major:", error);
      alert(error.response?.data?.message || "Lỗi khi lưu chuyên ngành");
    } finally {
      // Tắt trạng thái loading dù thành công hay thất bại
      setLoading(false);
    }
  };

  /**
   * Hàm xóa chuyên ngành
   * @param {Object} major - Object chứa thông tin chuyên ngành cần xóa
   */
  const handleDeleteMajor = async (major) => {
    // Xác nhận trước khi xóa
    if (!confirm(`Bạn có chắc muốn xóa chuyên ngành "${major.name}"?`)) {
      return;  // Nếu không xác nhận, dừng lại
    }

    try {
      // Bật trạng thái loading
      setLoading(true);
      // Gọi API delete để xóa chuyên ngành
      await majorApi.delete(major._id);
      // Hiển thị thông báo thành công
      alert("Xóa chuyên ngành thành công");
      // Load lại danh sách chuyên ngành
      loadMajors();
    } catch (error) {
      // Xử lý lỗi: log lỗi và hiển thị thông báo
      console.error("Error deleting major:", error);
      alert(error.response?.data?.message || "Lỗi khi xóa chuyên ngành");
    } finally {
      // Tắt trạng thái loading dù thành công hay thất bại
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Quản Lý Chuyên Ngành</h1>
        <Button onClick={handleAddMajor} className="gap-2">
          <Plus className="w-4 h-4" />
          Thêm Chuyên Ngành
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              placeholder="Tìm kiếm theo tên hoặc mã chuyên ngành..."
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch}>Tìm Kiếm</Button>
        </div>
      </Card>

      {/* Majors List */}
      <Card className="p-4">
        {loading && majors.length === 0 ? (
          <div className="text-center py-8">Đang tải...</div>
        ) : majors.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Không có chuyên ngành nào
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Mã</th>
                    <th className="text-left p-2">Tên Chuyên Ngành</th>
                    <th className="text-left p-2">Mô Tả</th>
                    <th className="text-left p-2">Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {majors.map((major) => (
                    <tr key={major._id} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        <span className="font-mono font-semibold">{major.code}</span>
                      </td>
                      <td className="p-2">
                        <p className="font-medium">{major.name}</p>
                      </td>
                      <td className="p-2">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {major.description || "—"}
                        </p>
                      </td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetail(major)}
                          >
                            <Search className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditMajor(major)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteMajor(major)}
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

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-muted-foreground">
                  Trang {pagination.page} / {pagination.totalPages} (Tổng:{" "}
                  {pagination.total} chuyên ngành)
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
                    ←
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPagination({ ...pagination, page: pagination.page + 1 })
                    }
                    disabled={pagination.page >= pagination.totalPages}
                  >
                    →
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl p-6 m-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingMajor ? "Chỉnh Sửa Chuyên Ngành" : "Thêm Chuyên Ngành Mới"}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tên Chuyên Ngành <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Nhập tên chuyên ngành"
                />
                {formErrors.name && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Mã Chuyên Ngành <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="Nhập mã chuyên ngành (VD: CNTT, KT)"
                  style={{ textTransform: "uppercase" }}
                />
                {formErrors.code && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.code}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Mô Tả</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-md"
                  rows={4}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Nhập mô tả (tùy chọn)"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading
                    ? "Đang lưu..."
                    : editingMajor
                    ? "Cập nhật"
                    : "Tạo mới"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && selectedMajor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl p-6 m-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Chi Tiết Chuyên Ngành</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowDetail(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Mã Chuyên Ngành
                </label>
                <p className="font-mono font-semibold text-lg">{selectedMajor.code}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Tên Chuyên Ngành
                </label>
                <p className="font-semibold text-lg">{selectedMajor.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Mô Tả
                </label>
                <p className="text-sm">
                  {selectedMajor.description || "Không có mô tả"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Số Sinh Viên</p>
                    <p className="font-semibold text-lg">
                      {selectedMajor.studentCount || 0}
                    </p>
                  </div>
                </div>
                {/* <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Số Lab</p>
                    <p className="font-semibold text-lg">
                      {selectedMajor.labCount || 0}
                    </p>
                  </div>
                </div> */}
              </div>

              <div className="flex justify-end pt-4">
                <Button variant="outline" onClick={() => setShowDetail(false)}>
                  Đóng
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

