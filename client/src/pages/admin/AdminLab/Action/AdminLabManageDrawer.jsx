import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

export default function AdminLabManageDrawer({
  isOpen,
  onClose,

  // lab hiện tại
  lab,

  // update lab info
  onUpdateLab,

  // dữ liệu + handler cho phần student
  allStudents = [],       // list tất cả student có thể add (hoặc chưa có lab)
  labStudents = [],       // list student đang ở lab này
  onAddStudent,           // (studentId) => void
  onRemoveStudent,        // (studentId) => void

  loading = false,
}) {
  const [activeTab, setActiveTab] = useState("info"); // "info" | "students"

  const [formData, setFormData] = useState({
    name: "",
    startTime: "",
    endTime: "",
    total: 30,
    status: "active",
    major: "",
    mentor: "",
    description: "",
  });

  const [selectedStudentId, setSelectedStudentId] = useState("");

  // Khi mở drawer với lab mới → fill form
  useEffect(() => {
    if (lab && isOpen) {
      setFormData({
        name: lab.name || "",
        startTime: lab.startTime || "08:00",
        endTime: lab.endTime || "17:00",
        total: lab.total ?? 30,
        status: lab.status || "active",
        major: typeof lab.major === "string" ? lab.major : lab.major?._id || "",
        mentor:
          typeof lab.mentor === "string" ? lab.mentor : lab.mentor?._id || "",
        description: lab.description || "",
      });
    }
  }, [lab, isOpen]);

  if (!isOpen || !lab) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "total" ? parseInt(value || "0", 10) : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!onUpdateLab) return;

    onUpdateLab(lab._id, formData);
  };

  const handleAddStudentClick = () => {
    if (!selectedStudentId || !onAddStudent) return;
    onAddStudent(selectedStudentId);
    setSelectedStudentId("");
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      {/* Drawer */}
      <div className="h-full w-full bg-background shadow-xl md:w-2/3 lg:w-1/2 flex flex-col">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Cập nhật lab
            </h2>
            <p className="text-sm text-muted-foreground">
              {lab.name} •{"    "}
              {lab.status === "active" ? "Đang hoạt động" : "Không hoạt động"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* TABS */}
        <div className="border-b border-border px-4 pt-3">
          <div className="inline-flex rounded-full bg-muted p-1 text-sm">
            <button
              type="button"
              className={`px-4 py-1.5 rounded-full ${
                activeTab === "info"
                  ? "bg-background shadow-sm font-medium"
                  : "text-muted-foreground"
              }`}
              onClick={() => setActiveTab("info")}
            >
              Thông tin lab
            </button>
            <button
              type="button"
              className={`px-4 py-1.5 rounded-full ${
                activeTab === "students"
                  ? "bg-background shadow-sm font-medium"
                  : "text-muted-foreground"
              }`}
              onClick={() => setActiveTab("students")}
            >
              Sinh viên
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "info" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Tên lab
                </label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Nhập tên lab"
                />
              </div>

              {/* Time + Total */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Giờ bắt đầu
                  </label>
                  <Input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Giờ kết thúc
                  </label>
                  <Input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Sức chứa
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="200"
                    name="total"
                    value={formData.total}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Status */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Trạng thái
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  >
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Không hoạt động</option>
                  </select>
                </div>

                {/* Major & mentor nếu cần có thể truyền options từ trên xuống */}
              </div>

              {/* Description */}
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Mô tả
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Đóng
                </Button>
                <Button type="submit" disabled={loading}>
                  Lưu thay đổi
                </Button>
              </div>
            </form>
          )}

          

          {activeTab === "students" && (
            <div className="space-y-4">
              {/* Add student */}
              <div className="rounded-lg bg-muted/60 p-4">
                <p className="mb-2 text-sm font-medium text-foreground">
                  Thêm sinh viên vào lớp
                </p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <select
                    className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                  >
                    <option value="">-- Chọn sinh viên --</option>
                    {allStudents.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.studentCode} - {s.fullName}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    className="shrink-0"
                    onClick={handleAddStudentClick}
                    disabled={!selectedStudentId || loading}
                  >
                    Add
                  </Button>
                </div>
              </div>

              {/* Table students in lab */}
              <div className="overflow-x-auto rounded-lg border border-border bg-background">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/60">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">No</th>
                      <th className="px-3 py-2 text-left font-medium">
                        Mã SV
                      </th>
                      <th className="px-3 py-2 text-left font-medium">
                        FullName
                      </th>
                      <th className="px-3 py-2 text-left font-medium">
                        Email
                      </th>
                    
                      <th className="px-3 py-2 text-center font-medium">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {labStudents.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-3 py-4 text-center text-muted-foreground"
                        >
                          Chưa có sinh viên nào trong lab này.
                        </td>
                      </tr>
                    )}

                    {labStudents.map((s, index) => (
                      <tr key={s._id} className="border-t border-border">
                        <td className="px-3 py-2">{index + 1}</td>
                        <td className="px-3 py-2">{s.studentCode}</td>
                        <td className="px-3 py-2">{s.fullName}</td>
                        <td className="px-3 py-2">{s.email}</td>
                       
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            className="text-destructive hover:opacity-80"
                            onClick={() => onRemoveStudent && onRemoveStudent(s._id)}
                          >
                            🗑
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
