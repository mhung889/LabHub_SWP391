import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit2, Trash2, Search, X, Users, Building2 } from "lucide-react";
import majorApi from "@/api/majorApi";

export default function AdminMajorsPage() {
  const [majors, setMajors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingMajor, setEditingMajor] = useState(null);
  const [selectedMajor, setSelectedMajor] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    loadMajors();
  }, [pagination.page, searchTerm]);

  const loadMajors = async () => {
    try {
      setLoading(true);
      const response = await majorApi.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm || undefined,
      });
      setMajors(response.data.majors || []);
      if (response.data.pagination) {
        setPagination({
          ...pagination,
          ...response.data.pagination,
        });
      }
    } catch (error) {
      console.error("Error loading majors:", error);
      alert(error.response?.data?.message || "Lỗi khi tải danh sách chuyên ngành");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination({ ...pagination, page: 1 });
    loadMajors();
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleAddMajor = () => {
    setEditingMajor(null);
    setFormData({
      name: "",
      code: "",
      description: "",
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleEditMajor = (major) => {
    setEditingMajor(major);
    setFormData({
      name: major.name || "",
      code: major.code || "",
      description: major.description || "",
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleViewDetail = async (major) => {
    try {
      setLoading(true);
      const response = await majorApi.getById(major._id);
      setSelectedMajor(response.data.major);
      setShowDetail(true);
    } catch (error) {
      console.error("Error loading major detail:", error);
      alert(error.response?.data?.message || "Lỗi khi tải thông tin chuyên ngành");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = "Tên chuyên ngành là bắt buộc";
    } else if (formData.name.trim().length < 2) {
      errors.name = "Tên chuyên ngành phải có ít nhất 2 ký tự";
    }

    if (!formData.code.trim()) {
      errors.code = "Mã chuyên ngành là bắt buộc";
    } else if (formData.code.trim().length < 2) {
      errors.code = "Mã chuyên ngành phải có ít nhất 2 ký tự";
    } else {
      // Auto uppercase code
      setFormData({ ...formData, code: formData.code.trim().toUpperCase() });
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      const submitData = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim(),
      };

      if (editingMajor) {
        await majorApi.update(editingMajor._id, submitData);
        alert("Cập nhật chuyên ngành thành công");
      } else {
        await majorApi.create(submitData);
        alert("Tạo chuyên ngành thành công");
      }

      setShowForm(false);
      loadMajors();
    } catch (error) {
      console.error("Error saving major:", error);
      alert(error.response?.data?.message || "Lỗi khi lưu chuyên ngành");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMajor = async (major) => {
    if (!confirm(`Bạn có chắc muốn xóa chuyên ngành "${major.name}"?`)) {
      return;
    }

    try {
      setLoading(true);
      await majorApi.delete(major._id);
      alert("Xóa chuyên ngành thành công");
      loadMajors();
    } catch (error) {
      console.error("Error deleting major:", error);
      alert(error.response?.data?.message || "Lỗi khi xóa chuyên ngành");
    } finally {
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Số Lab</p>
                    <p className="font-semibold text-lg">
                      {selectedMajor.labCount || 0}
                    </p>
                  </div>
                </div>
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

