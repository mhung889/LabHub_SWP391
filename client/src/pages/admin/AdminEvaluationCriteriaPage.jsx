import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit2, Trash2, X } from "lucide-react";
import evaluationApi from "@/api/evaluationApi";

export default function AdminEvaluationCriteriaPage() {
  const [criterias, setCriterias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCriteria, setEditingCriteria] = useState(null);
  const [formData, setFormData] = useState({
    criterionName: "",
    description: "",
    weight: "",
    maxScore: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [totalWeight, setTotalWeight] = useState(0);

  useEffect(() => {
    loadCriterias();
  }, []);

  useEffect(() => {
    const total = criterias.reduce((sum, c) => sum + (c.weight || 0), 0);
    setTotalWeight(total);
  }, [criterias]);

  const loadCriterias = async () => {
    try {
      setLoading(true);
      const response = await evaluationApi.getEvaluationCriterias({ includeInactive: true });
      setCriterias(response.data.criterias || []);
    } catch (error) {
      console.error("Error loading criterias:", error);
      alert(error.response?.data?.message || "Lỗi khi tải danh sách tiêu chí");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCriteria = () => {
    setEditingCriteria(null);
    setFormData({
      criterionName: "",
      description: "",
      weight: "",
      maxScore: "",
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleEditCriteria = (criteria) => {
    setEditingCriteria(criteria);
    setFormData({
      criterionName: criteria.criterionName || "",
      description: criteria.description || "",
      weight: criteria.weight || "",
      maxScore: criteria.maxScore || "",
    });
    setFormErrors({});
    setShowForm(true);
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.criterionName.trim()) {
      errors.criterionName = "Tên tiêu chí là bắt buộc";
    }

    if (!formData.weight || formData.weight === "") {
      errors.weight = "Trọng số là bắt buộc";
    } else {
      const weight = parseFloat(formData.weight);
      if (isNaN(weight) || weight < 0 || weight > 100) {
        errors.weight = "Trọng số phải từ 0 đến 100";
      } else {
        const currentTotal = criterias
          .filter((c) => editingCriteria ? c._id !== editingCriteria._id : true)
          .reduce((sum, c) => sum + (c.weight || 0), 0);
        if (currentTotal + weight > 100) {
          errors.weight = `Tổng trọng số không được vượt quá 100%. Hiện tại: ${currentTotal + weight}%`;
        }
      }
    }

    if (!formData.maxScore || formData.maxScore === "") {
      errors.maxScore = "Điểm tối đa là bắt buộc";
    } else {
      const maxScore = parseFloat(formData.maxScore);
      if (isNaN(maxScore) || maxScore <= 0) {
        errors.maxScore = "Điểm tối đa phải lớn hơn 0";
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
      const submitData = {
        criterionName: formData.criterionName.trim(),
        description: formData.description.trim(),
        weight: parseFloat(formData.weight),
        maxScore: parseFloat(formData.maxScore),
      };

      if (editingCriteria) {
        await evaluationApi.updateEvaluationCriteria(editingCriteria._id, submitData);
        alert("Cập nhật tiêu chí thành công");
      } else {
        await evaluationApi.createEvaluationCriteria(submitData);
        alert("Tạo tiêu chí thành công");
      }

      setShowForm(false);
      loadCriterias();
    } catch (error) {
      console.error("Error saving criteria:", error);
      alert(error.response?.data?.message || "Lỗi khi lưu tiêu chí");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCriteria = async (criteria) => {
    if (!confirm(`Bạn có chắc muốn xóa tiêu chí "${criteria.criterionName}"?`)) {
      return;
    }

    try {
      setLoading(true);
      await evaluationApi.deleteEvaluationCriteria(criteria._id);
      alert("Xóa tiêu chí thành công");
      loadCriterias();
    } catch (error) {
      console.error("Error deleting criteria:", error);
      alert(error.response?.data?.message || "Lỗi khi xóa tiêu chí");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (criteria) => {
    try {
      setLoading(true);
      await evaluationApi.updateEvaluationCriteria(criteria._id, {
        isActive: !criteria.isActive,
      });
      loadCriterias();
    } catch (error) {
      console.error("Error toggling criteria:", error);
      alert(error.response?.data?.message || "Lỗi khi cập nhật tiêu chí");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Quản Lý Tiêu Chí Đánh Giá</h1>
        <Button onClick={handleAddCriteria} className="gap-2">
          <Plus className="w-4 h-4" />
          Thêm Tiêu Chí
        </Button>
      </div>

      <Card className="p-4">
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Tổng trọng số: <span className="font-bold">{totalWeight}%</span>
            {totalWeight !== 100 && (
              <span className="ml-2 text-orange-600">
                (Cần {100 - totalWeight}% để đạt 100%)
              </span>
            )}
          </p>
        </div>

        {loading && criterias.length === 0 ? (
          <div className="text-center py-8">Đang tải...</div>
        ) : criterias.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Chưa có tiêu chí nào
          </div>
        ) : (
          <div className="space-y-2">
            {criterias.map((criteria) => (
              <div
                key={criteria._id}
                className={`p-4 border rounded-lg flex items-center justify-between ${
                  !criteria.isActive ? "opacity-50" : ""
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{criteria.criterionName}</h3>
                    {!criteria.isActive && (
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded">Đã vô hiệu hóa</span>
                    )}
                  </div>
                  {criteria.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {criteria.description}
                    </p>
                  )}
                  <div className="flex gap-4 mt-2 text-sm">
                    <span>Trọng số: <strong>{criteria.weight}%</strong></span>
                    <span>Điểm tối đa: <strong>{criteria.maxScore}</strong></span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(criteria)}
                  >
                    {criteria.isActive ? "Vô hiệu hóa" : "Kích hoạt"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditCriteria(criteria)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteCriteria(criteria)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl p-6 m-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingCriteria ? "Chỉnh Sửa Tiêu Chí" : "Thêm Tiêu Chí Mới"}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tên tiêu chí <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.criterionName}
                  onChange={(e) =>
                    setFormData({ ...formData, criterionName: e.target.value })
                  }
                  placeholder="Nhập tên tiêu chí"
                />
                {formErrors.criterionName && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.criterionName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Mô tả</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Nhập mô tả (tùy chọn)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Trọng số (%) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) =>
                      setFormData({ ...formData, weight: e.target.value })
                    }
                    placeholder="0-100"
                  />
                  {formErrors.weight && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.weight}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Điểm tối đa <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min="1"
                    step="0.1"
                    value={formData.maxScore}
                    onChange={(e) =>
                      setFormData({ ...formData, maxScore: e.target.value })
                    }
                    placeholder="Điểm tối đa"
                  />
                  {formErrors.maxScore && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.maxScore}</p>
                  )}
                </div>
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
                  {loading ? "Đang lưu..." : editingCriteria ? "Cập nhật" : "Tạo mới"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

