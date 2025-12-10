import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
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

  const [selectedStudent, setSelectedStudent] = useState(null);
  const detailModalRef = useRef(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    studentCode: "",
    name: "",
    email: "",
    phone: "",
    gender: "",
    dob: "",
    address: "",
    emergencyName: "",
    emergencyRelation: "",
    emergencyPhone: "",
    major: "",
    startDate: "",
  });

  const [errors, setErrors] = useState({});

  // LOAD DATA
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
      setLabs(res.data.labs || []);
    } catch (err) {
      console.error("Failed to load labs:", err);
    }
  };

  useEffect(() => {
    fetchMajors();
    fetchLabs();
    fetchStudents();
  }, []);

  // FILTER
  const filteredStudents = students.filter((s) => {
    const matchSearch =
      s.user?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.user?.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchMajor = !filterMajor || s.major?._id === filterMajor;

    const matchLab =
      !filterLab ||
      (filterLab === "none" && !s.lab) ||
      (s.lab && s.lab._id === filterLab);

    return matchSearch && matchMajor && matchLab;
  });

  //TOASTS
  const showSuccessToast = (msg) => {
    toast.success(msg, { icon: null });
  };
  
  const showErrorToast = (msg) => {
    toast.error(msg, { icon: null });
  };

  // MODAL HANDLERS
  const openModal = () => {
    const modal = new window.bootstrap.Modal(modalRef.current);
    modal.show();
  };

  const closeModal = () => {
    const modal = window.bootstrap.Modal.getInstance(modalRef.current);
    modal.hide();
  };

  const openDetailModal = () => {
    const modal = new window.bootstrap.Modal(detailModalRef.current);
    modal.show();
  };

  const closeDetailModal = () => {
    const modal = window.bootstrap.Modal.getInstance(detailModalRef.current);
    modal.hide();
  };

  // VALIDATION
  const validateForm = () => {
    let newErrors = {};

    if (!formData.studentCode.trim())
      newErrors.studentCode = "Mã sinh viên không được để trống";

    if (!formData.name.trim()) newErrors.name = "Họ tên không được để trống";

    if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email))
      newErrors.email = "Email không đúng định dạng";

    if (!/^(0[3|5|7|8|9])[0-9]{8}$/.test(formData.phone))
      newErrors.phone = "Số điện thoại không hợp lệ";

    if (!formData.gender) newErrors.gender = "Hãy chọn giới tính";

    if (!formData.dob) {
      newErrors.dob = "Hãy chọn ngày sinh";
    } else {
      const dobDate = new Date(formData.dob);
      const today = new Date();

      if (isNaN(dobDate.getTime())) {
        newErrors.dob = "Ngày sinh không hợp lệ";
      } else if (dobDate > today) {
        newErrors.dob = "Ngày sinh không được ở tương lai";
      } else {
        const age =
          today.getFullYear() -
          dobDate.getFullYear() -
          (today < new Date(today.getFullYear(), dobDate.getMonth(), dobDate.getDate())
            ? 1
            : 0);

        if (age < 17) {
          newErrors.dob = "Sinh viên phải đủ 17 tuổi";
        }
      }
    }

    if (!formData.address.trim()) newErrors.address = "Hãy nhập địa chỉ";

    if (!formData.major) newErrors.major = "Hãy chọn chuyên ngành";

    if (!formData.startDate) newErrors.startDate = "Hãy chọn ngày bắt đầu";

    if (
      formData.emergencyPhone &&
      !/^(0[3|5|7|8|9])[0-9]{8}$/.test(formData.emergencyPhone)
    )
      newErrors.emergencyPhone = "Số khẩn cấp không hợp lệ";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ADD NEW STUDENT
  const handleAddStudent = () => {
    setEditingStudent(null);
    setErrors({});
    setFormData({
      studentCode: "",
      name: "",
      email: "",
      phone: "",
      gender: "",
      dob: "",
      address: "",
      emergencyName: "",
      emergencyRelation: "",
      emergencyPhone: "",
      major: "",
      startDate: "",
    });
    openModal();
  };

  // EDIT STUDENT
  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setErrors({});
    setFormData({
      studentCode: student.studentCode || "",
      name: student.user?.fullName || "",
      email: student.user?.email || "",
      phone: student.user?.phoneNumber || "",
      gender: student.user?.gender || "",
      dob: student.user?.dateOfBirth?.substring(0, 10) || "",
      address: student.user?.address || "",
      emergencyName: student.user?.emergencyContact?.name || "",
      emergencyRelation: student.user?.emergencyContact?.relationship || "",
      emergencyPhone: student.user?.emergencyContact?.phoneNumber || "",
      major: student.major?._id || "",
      startDate: student.startDate || "",
    });
    openModal();
  };

  // SUBMIT FORM (CREATE / UPDATE)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (isSubmitting) return;
    setIsSubmitting(true);

    const payload = {
      studentCode: formData.studentCode,
      fullName: formData.name,
      email: formData.email.trim(),
      phoneNumber: formData.phone,
      gender: formData.gender,
      dateOfBirth: formData.dob,
      address: formData.address,
      emergencyContact: {
        name: formData.emergencyName,
        relationship: formData.emergencyRelation,
        phoneNumber: formData.emergencyPhone,
      },
      majorId: formData.major,
      startDate: formData.startDate,
    };

    try {
      if (editingStudent) {
        await studentApi.update(editingStudent._id, payload);
        showSuccessToast("Cập nhật sinh viên thành công!");
      } else {
        await studentApi.create(payload);
        showSuccessToast("Thêm sinh viên thành công!");
      }
    
      await fetchStudents();
      closeModal();
    
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Có lỗi xảy ra");
    
    } finally {
      setIsSubmitting(false); 
    }
    
  };

  // DELETE STUDENT
  const handleDelete = async (id) => {
    if (!confirm("Bạn chắc chắn muốn xóa sinh viên này?")) return;

    try {
      await studentApi.delete(id);
      showSuccessToast("Xóa sinh viên thành công!");
      await fetchStudents();
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Xóa thất bại");
    }
  };

  // UI
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
            placeholder="Tên, email..."
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
              <tr
                key={s._id}
                onClick={() => {
                  setSelectedStudent(s);
                  openDetailModal();
                }}
                style={{ cursor: "pointer" }}
              >
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
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditStudent(s);
                    }}
                  >
                    Sửa
                  </button>

                  <button
                    className="btn btn-danger btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(s._id);
                    }}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredStudents.length === 0 && (
          <p className="text-center text-muted py-3">
            Không tìm thấy sinh viên nào
          </p>
        )}
      </div>

      {/* MODAL ADD / EDIT */}
      <div className="modal fade" ref={modalRef} tabIndex="-1">
        <div className="modal-dialog modal-lg">
          <form className="modal-content" onSubmit={handleSubmit}>

            <div className="modal-header">
              <h5 className="modal-title">
                {editingStudent ? "Sửa sinh viên" : "Thêm sinh viên"}
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={closeModal}
              ></button>
            </div>

            <div className="modal-body">
              <div className="row g-3">

                {/* STUDENT CODE */}
                <div className="col-md-6">
                  <label className="form-label">Mã sinh viên</label>
                  <input
                    className={`form-control ${errors.studentCode ? "is-invalid" : ""}`}
                    value={formData.studentCode}
                    onChange={(e) =>
                      setFormData({ ...formData, studentCode: e.target.value })
                    }
                  />
                  <div className="invalid-feedback">{errors.studentCode}</div>
                </div>

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

                {/* GENDER */}
                <div className="col-md-6">
                  <label className="form-label">Giới tính</label>
                  <select
                    className={`form-select ${errors.gender ? "is-invalid" : ""}`}
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({ ...formData, gender: e.target.value })
                    }
                  >
                    <option value="">-- Chọn giới tính --</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                  <div className="invalid-feedback">{errors.gender}</div>
                </div>

                {/* DOB */}
                <div className="col-md-6">
                  <label className="form-label">Ngày sinh</label>
                  <input
                    type="date"
                    className={`form-control ${errors.dob ? "is-invalid" : ""}`}
                    value={formData.dob}
                    onChange={(e) =>
                      setFormData({ ...formData, dob: e.target.value })
                    }
                  />
                  <div className="invalid-feedback">{errors.dob}</div>
                </div>

                {/* ADDRESS */}
                <div className="col-md-6">
                  <label className="form-label">Địa chỉ</label>
                  <input
                    className={`form-control ${errors.address ? "is-invalid" : ""}`}
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                  />
                  <div className="invalid-feedback">{errors.address}</div>
                </div>

                {/* EMERGENCY CONTACT */}
                <h6 className="fw-bold mt-3">Liên hệ khẩn cấp</h6>

                <div className="col-md-4">
                  <label className="form-label">Họ tên</label>
                  <input
                    className="form-control"
                    value={formData.emergencyName}
                    onChange={(e) =>
                      setFormData({ ...formData, emergencyName: e.target.value })
                    }
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label">Quan hệ</label>
                  <input
                    className="form-control"
                    value={formData.emergencyRelation}
                    onChange={(e) =>
                      setFormData({ ...formData, emergencyRelation: e.target.value })
                    }
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label">SĐT khẩn cấp</label>
                  <input
                    className={`form-control ${errors.emergencyPhone ? "is-invalid" : ""}`}
                    value={formData.emergencyPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, emergencyPhone: e.target.value })
                    }
                  />
                  <div className="invalid-feedback">{errors.emergencyPhone}</div>
                </div>

                {/* MAJOR */}
                <div className="col-md-6">
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

                {/* START DATE */}
                <div className="col-md-6">
                  <label className="form-label">Ngày bắt đầu</label>
                  <input
                    type="date"
                    className={`form-control ${errors.startDate ? "is-invalid" : ""}`}
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                  />
                  <div className="invalid-feedback">{errors.startDate}</div>
                </div>

              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
                {editingStudent ? "Cập nhật" : "Thêm"}
              </button>
              <button className="btn btn-secondary" type="button" onClick={closeModal}>
                Hủy
              </button>
            </div>

          </form>
        </div>
      </div>

      {/* DETAIL MODAL */}
      <div className="modal fade" ref={detailModalRef} tabIndex="-1">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">

            <div className="modal-header">
              <h5 className="modal-title">Thông tin chi tiết sinh viên</h5>
              <button type="button" className="btn-close" onClick={closeDetailModal}></button>
            </div>

            <div className="modal-body">
              {selectedStudent ? (
                <div className="row g-3">

                  <div className="col-12 text-center mb-3">
                    <img
                      src={selectedStudent.user?.image}
                      alt="avatar"
                      style={{
                        width: "120px",
                        height: "120px",
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="fw-bold">Họ tên:</label>
                    <div>{selectedStudent.user?.fullName}</div>
                  </div>

                  <div className="col-md-6">
                    <label className="fw-bold">Email:</label>
                    <div>{selectedStudent.user?.email}</div>
                  </div>

                  <div className="col-md-6">
                    <label className="fw-bold">Số điện thoại:</label>
                    <div>{selectedStudent.user?.phoneNumber}</div>
                  </div>

                  <div className="col-md-6">
                    <label className="fw-bold">Giới tính:</label>
                    <div>{selectedStudent.user?.gender}</div>
                  </div>

                  <div className="col-md-6">
                    <label className="fw-bold">Ngày sinh:</label>
                    <div>
                      {selectedStudent.user?.dateOfBirth
                        ? selectedStudent.user.dateOfBirth.substring(0, 10)
                        : "—"}
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="fw-bold">Địa chỉ:</label>
                    <div>{selectedStudent.user?.address}</div>
                  </div>

                  <div className="col-md-6">
                    <label className="fw-bold">Mã sinh viên:</label>
                    <div>{selectedStudent.studentCode}</div>
                  </div>

                  <div className="col-md-6">
                    <label className="fw-bold">Chuyên ngành:</label>
                    <div>{selectedStudent.major?.name}</div>
                  </div>

                  <div className="col-md-6">
                    <label className="fw-bold">Lab:</label>
                    <div>{selectedStudent.lab?.name || "Chưa gán"}</div>
                  </div>

                  <div className="col-md-6">
                    <label className="fw-bold">Ngày bắt đầu:</label>
                    <div>{selectedStudent.startDate}</div>
                  </div>

                  <hr className="mt-3" />

                  <div className="col-12">
                    <h6 className="fw-bold">Liên hệ khẩn cấp:</h6>
                  </div>

                  <div className="col-md-4">
                    <label className="fw-bold">Tên:</label>
                    <div>{selectedStudent.user?.emergencyContact?.name || "—"}</div>
                  </div>

                  <div className="col-md-4">
                    <label className="fw-bold">Quan hệ:</label>
                    <div>{selectedStudent.user?.emergencyContact?.relationship || "—"}</div>
                  </div>

                  <div className="col-md-4">
                    <label className="fw-bold">Số điện thoại:</label>
                    <div>{selectedStudent.user?.emergencyContact?.phoneNumber || "—"}</div>
                  </div>

                </div>
              ) : (
                <p>Không có dữ liệu.</p>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeDetailModal}>
                Đóng
              </button>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
