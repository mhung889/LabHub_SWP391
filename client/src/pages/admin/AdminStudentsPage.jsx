import { useState, useEffect, useRef } from "react";
import studentApi from "@/api/studentApi";
import majorApi from "@/api/majorApi";
import labApi from "@/api/labApi";

export default function AdminStudentsPage() {
  const [students, setStudents] = useState([]);
  const [majors, setMajors] = useState([]);
  const [labs, setLabs] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterMajor, setFilterMajor] = useState("");
  const [filterLab, setFilterLab] = useState("");

  const [editingStudent, setEditingStudent] = useState(null);
  const modalRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    studentId: "",
    major: "",
  });

  const [errors, setErrors] = useState({});

  // =====================================================
  // LOAD DATA
  // =====================================================
  const fetchStudents = async () => {
    try {
      const res = await studentApi.getAll();
      setStudents(res.data);
    } catch (err) {
      console.error("Failed to load students:", err);
    }
  };

  const fetchMajors = async () => {
    try {
      const res = await majorApi.getAll();
      setMajors(res.data.majors || []);
    } catch (err) {
      console.error("Failed to load majors:", err);
    }
  };

  const fetchLabs = async () => {
    try {
      const res = await labApi.getLabs();
      setLabs(res.data || []);
    } catch (err) {
      console.error("Failed to load labs:", err);
    }
  };

  useEffect(() => {
    fetchMajors();
    fetchLabs();
    fetchStudents();
  }, []);

  // =====================================================
  // FILTER LOGIC
  // =====================================================
  const filteredStudents = students.filter((s) => {
    const matchSearch =
      s.user?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentCode?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchMajor =
      !filterMajor || s.major?._id === filterMajor;

    const matchLab =
      !filterLab ||
      (filterLab === "none" && !s.lab) ||
      (s.lab && s.lab._id === filterLab);

    return matchSearch && matchMajor && matchLab;
  });

  // =====================================================
  // MODAL HANDLERS
  // =====================================================
  const openModal = () => {
    const modal = new window.bootstrap.Modal(modalRef.current);
    modal.show();
  };

  const closeModal = () => {
    const modal = window.bootstrap.Modal.getInstance(modalRef.current);
    modal.hide();
  };

  // =====================================================
  // VALIDATION
  // =====================================================
  const validateForm = () => {
    let newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Họ tên không được để trống";

    if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email))
      newErrors.email = "Email không đúng định dạng";

    if (!/^(0[3|5|7|8|9])[0-9]{8}$/.test(formData.phone))
      newErrors.phone = "Số điện thoại không hợp lệ";

    if (!/^HE\d{6}$/.test(formData.studentId))
      newErrors.studentId = "Mã sinh viên phải theo dạng HE + 6 số (VD: HE123456)";

    if (!formData.major) newErrors.major = "Hãy chọn chuyên ngành";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // =====================================================
  // ADD
  // =====================================================
  const handleAddStudent = () => {
    setEditingStudent(null);
    setErrors({});
    setFormData({
      name: "",
      email: "",
      phone: "",
      studentId: "",
      major: "",
    });
    openModal();
  };

  // =====================================================
  // EDIT
  // =====================================================
  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setErrors({});
    setFormData({
      name: student.user?.fullName || "",
      email: student.user?.email || "",
      phone: student.user?.phoneNumber || "",
      studentId: student.studentCode || "",
      major: student.major?._id || "",
    });
    openModal();
  };

  // =====================================================
  // SUBMIT
  // =====================================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const payload = {
      fullName: formData.name,
      email: formData.email,
      phoneNumber: formData.phone,
      studentCode: formData.studentId,
      majorId: formData.major,
      startDate: "2024-01-01",
    };

    try {
      if (editingStudent) {
        await studentApi.update(editingStudent._id, payload);
      } else {
        await studentApi.create({ ...payload, password: "123456" });
      }

      await fetchStudents();
      closeModal();
    } catch (err) {
      console.error("Submit failed:", err);
      alert(err.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  // =====================================================
  // DELETE
  // =====================================================
  const handleDelete = async (id) => {
    if (!confirm("Bạn chắc chắn muốn xóa sinh viên này?")) return;

    try {
      await studentApi.delete(id);
      await fetchStudents();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // =====================================================
  // UI
  // =====================================================
  return (
    <div className="container py-4">

      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold">Quản lý sinh viên</h3>
        <button className="btn btn-primary" onClick={handleAddStudent}>
          + Thêm Sinh Viên
        </button>
      </div>

      {/* FILTER ROW */}
      <div className="row mb-4">

        <div className="col-md-4">
          <label className="form-label fw-semibold">Tìm kiếm</label>
          <input
            className="form-control"
            placeholder="Tên, email, mã SV..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="col-md-4">
          <label className="form-label fw-semibold">Chuyên ngành</label>
          <select
            className="form-select"
            value={filterMajor}
            onChange={(e) => setFilterMajor(e.target.value)}
          >
            <option value="">Tất cả</option>
            {majors.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-4">
          <label className="form-label fw-semibold">Lab</label>
          <select
            className="form-select"
            value={filterLab}
            onChange={(e) => setFilterLab(e.target.value)}
          >
            <option value="">Tất cả</option>
            <option value="none">Chưa gán</option>
            {labs.map((l) => (
              <option key={l._id} value={l._id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* TABLE */}
      <div className="table-responsive">
        <table className="table table-striped align-middle">
          <thead className="table-dark">
            <tr>
              <th>Họ Tên</th>
              <th>Mã SV</th>
              <th>Email</th>
              <th>Điện thoại</th>
              <th>Chuyên ngành</th>
              <th>Lab</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((s) => (
              <tr key={s._id}>
                <td>{s.user?.fullName}</td>
                <td>{s.studentCode}</td>
                <td>{s.user?.email}</td>
                <td>{s.user?.phoneNumber}</td>
                <td>{s.major?.name || "--"}</td>
                <td>
                  {s.lab ? (
                    <span className="badge bg-primary">{s.lab.name}</span>
                  ) : (
                    <span className="text-muted">Chưa gán</span>
                  )}
                </td>
                <td>
                  <button
                    className="btn btn-warning btn-sm me-2"
                    onClick={() => handleEditStudent(s)}
                  >
                    Sửa
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(s._id)}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredStudents.length === 0 && (
          <p className="text-center text-muted py-3">Không tìm thấy sinh viên nào</p>
        )}
      </div>

      {/* MODAL */}
      <div className="modal fade" ref={modalRef} tabIndex="-1">
        <div className="modal-dialog modal-lg">
          <form className="modal-content" onSubmit={handleSubmit}>

            <div className="modal-header">
              <h5 className="modal-title">
                {editingStudent ? "Sửa sinh viên" : "Thêm sinh viên"}
              </h5>
              <button type="button" className="btn-close" onClick={closeModal}></button>
            </div>

            <div className="modal-body">
              <div className="row g-3">

                {/* NAME */}
                <div className="col-md-6">
                  <label className="form-label">Họ tên</label>
                  <input
                    className={`form-control ${errors.name ? "is-invalid" : ""}`}
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                  <div className="invalid-feedback">{errors.name}</div>
                </div>

                {/* STUDENT ID */}
                <div className="col-md-6">
                  <label className="form-label">Mã SV</label>
                  <input
                    className={`form-control ${errors.studentId ? "is-invalid" : ""}`}
                    value={formData.studentId}
                    onChange={(e) =>
                      setFormData({ ...formData, studentId: e.target.value })
                    }
                  />
                  <div className="invalid-feedback">{errors.studentId}</div>
                </div>

                {/* EMAIL */}
                <div className="col-md-6">
                  <label className="form-label">Email</label>
                  <input
                    className={`form-control ${errors.email ? "is-invalid" : ""}`}
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                  <div className="invalid-feedback">{errors.email}</div>
                </div>

                {/* PHONE */}
                <div className="col-md-6">
                  <label className="form-label">SĐT</label>
                  <input
                    className={`form-control ${errors.phone ? "is-invalid" : ""}`}
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                  <div className="invalid-feedback">{errors.phone}</div>
                </div>

                {/* MAJOR */}
                <div className="col-md-12">
                  <label className="form-label">Chuyên ngành</label>
                  <select
                    className={`form-select ${errors.major ? "is-invalid" : ""}`}
                    value={formData.major}
                    onChange={(e) =>
                      setFormData({ ...formData, major: e.target.value })
                    }
                  >
                    <option value="">-- Chọn chuyên ngành --</option>
                    {majors.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <div className="invalid-feedback">{errors.major}</div>
                </div>

              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-primary" type="submit">
                {editingStudent ? "Cập nhật" : "Thêm"}
              </button>
              <button className="btn btn-secondary" type="button" onClick={closeModal}>
                Hủy
              </button>
            </div>

          </form>
        </div>
      </div>

    </div>
  );
}
