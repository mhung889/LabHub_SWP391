import React, { useEffect, useState } from 'react';
import evaluationApi from '@/api/evaluationApi';
import { toast } from 'sonner';
import {
  Loader2,
  ClipboardCheck,
  AlertCircle,
  UserCheck,
  Search,
  Eye,
} from "lucide-react";
import Pagination from 'react-bootstrap/Pagination';

export default function MentorEvaluationPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');

  const [finalScore, setFinalScore] = useState('');
  const [content, setContent] = useState('');

  // =====================
  // PAGINATION STATE
  // =====================
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await evaluationApi.getStudentsByLab();
      setStudents(res.data.data || []);
    } catch (error) {
      toast.error("Không thể tải danh sách sinh viên");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEvaluation = async (student) => {
    setSelectedStudent(student);
    try {
      const res = await evaluationApi.getEvaluationPreview(
        student.labId,
        student._id
      );
      const data = res.data.data;
      setPreviewData(data);

      if (student.isEvaluated && data.existingEvaluation) {
        setFinalScore(data.existingEvaluation.finalScore);
        setContent(data.existingEvaluation.content);
      } else {
        setFinalScore(data.suggestedScore);
        setContent('');
      }

      setIsModalOpen(true);
    } catch (error) {
      toast.error("Lỗi khi tải thông tin đánh giá");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedStudent.isEvaluated) return;

    if (!finalScore || !content.trim()) {
      return toast.warning("Vui lòng điền đủ thông tin");
    }

    setSubmitting(true);
    try {
      await evaluationApi.submitEvaluation({
        studentId: selectedStudent._id,
        labId: selectedStudent.labId,
        finalScore: parseFloat(finalScore),
        content: content.trim(),
        stats: previewData.stats,
        suggestedScore: previewData.suggestedScore,
      });

      toast.success("Đã lưu đánh giá thành công");
      setIsModalOpen(false);
      fetchStudents();
    } catch (error) {
      toast.error("Lỗi khi lưu đánh giá");
    } finally {
      setSubmitting(false);
    }
  };

  // =====================
  // FILTER + PAGINATION
  // =====================
  const filteredStudents = students.filter((s) =>
    s.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.studentCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);

  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset về trang 1 khi search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // =====================
  // LOADING
  // =====================
  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center py-5">
        <Loader2 className="spinner-border text-primary mb-2" style={{ width: '3rem', height: '3rem' }} />
        <p className="text-muted">Đang tải danh sách sinh viên...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Header & Search */}
      <div className="card shadow-sm mb-4 border-0">
        <div className="card-body d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <h4 className="card-title mb-1 d-flex align-items-center gap-2 fw-bold text-primary">
              <UserCheck /> Quản lý Đánh giá Intern
            </h4>
            <p className="text-muted mb-0 small">
              Đánh giá năng lực và chuyên cần của sinh viên thực tập
            </p>
          </div>

          <div className="input-group" style={{ maxWidth: '350px' }}>
            <span className="input-group-text bg-light border-end-0">
              <Search size={18} className="text-muted" />
            </span>
            <input
              type="text"
              className="form-control bg-light border-start-0 ps-0 shadow-none"
              placeholder="Tìm mã SV hoặc tên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card shadow-sm border-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light text-secondary">
              <tr>
                <th className="px-4">Mã SV</th>
                <th>Họ và Tên</th>
                <th>Trạng thái</th>
                <th className="text-end px-4">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStudents.map((student) => (
                <tr key={student._id}>
                  <td className="px-4 fw-bold">{student.studentCode}</td>
                  <td>{student.user?.fullName}</td>
                  <td>
                    {student.isEvaluated ? (
                      <span className="badge rounded-pill bg-success-subtle text-success border border-success px-3">
                        Hoàn thành
                      </span>
                    ) : (
                      <span className="badge rounded-pill bg-warning-subtle text-warning border border-warning px-3">
                        Chờ đánh giá
                      </span>
                    )}
                  </td>
                  <td className="text-end px-4">
                    <button
                      onClick={() => handleOpenEvaluation(student)}
                      className={`btn btn-sm rounded-pill px-3 shadow-sm ${
                        student.isEvaluated ? 'btn-outline-primary' : 'btn-primary'
                      }`}
                    >
                      {student.isEvaluated ? (
                        <>
                          <Eye size={14} className="me-1" /> Xem lại
                        </>
                      ) : (
                        "Đánh giá ngay"
                      )}
                    </button>
                  </td>
                </tr>
              ))}

              {paginatedStudents.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-4 text-muted">
                    Không có sinh viên phù hợp
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="card-footer bg-white border-0 d-flex justify-content-end">
            <Pagination className="mb-0">
              <Pagination.Prev
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              />
              {[...Array(totalPages)].map((_, i) => (
                <Pagination.Item
                  key={i + 1}
                  active={currentPage === i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </Pagination.Item>
              ))}
              <Pagination.Next
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              />
            </Pagination>
          </div>
        )}
      </div>

      {/* Modal Evaluation */}
      {isModalOpen && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0">
              <div className="modal-header border-0 bg-light">
                <h5 className="modal-title d-flex align-items-center gap-2 fw-bold">
                  <ClipboardCheck className="text-primary" /> 
                  {selectedStudent?.isEvaluated ? "Chi tiết đánh giá" : "Đánh giá thực tập sinh"}
                </h5>
                <button type="button" className="btn-close shadow-none" onClick={() => setIsModalOpen(false)}></button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-4">
                    <h6 className="fw-bold mb-1">{selectedStudent?.user?.fullName}</h6>
                    <span className="text-muted small">Mã số: {selectedStudent?.studentCode}</span>
                  </div>

                  <div className="row g-3 mb-4">
                    <div className="col-4">
                      <div className="card bg-danger-subtle border-0 text-center py-2">
                        <h4 className="mb-0 text-danger fw-bold">{previewData?.stats.absent}</h4>
                        <small className="text-danger fw-bold" style={{ fontSize: '9px' }}>VẮNG</small>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="card bg-warning-subtle border-0 text-center py-2">
                        <h4 className="mb-0 text-warning fw-bold">{previewData?.stats.partial}</h4>
                        <small className="text-warning fw-bold" style={{ fontSize: '9px' }}>QUÊN CHECK</small>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="card bg-primary-subtle border-0 text-center py-2">
                        <h4 className="mb-0 text-primary fw-bold">{previewData?.stats.leave}</h4>
                        <small className="text-primary fw-bold" style={{ fontSize: '9px' }}>CÓ PHÉP</small>
                      </div>
                    </div>
                  </div>

                  {!selectedStudent?.isEvaluated && (
                    <div className="alert alert-info d-flex align-items-start gap-2 border-0 shadow-sm mb-4">
                      <AlertCircle size={20} className="mt-1" />
                      <span className="small"><em>{previewData?.recommendation}</em></span>
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label fw-bold text-secondary small text-uppercase">Điểm đánh giá chốt</label>
                    <input 
                      type="number" step="0.1" max="10" min="0" required
                      className="form-control form-control-lg fw-bold border-2"
                      value={finalScore} onChange={(e) => setFinalScore(e.target.value)}
                      disabled={selectedStudent?.isEvaluated}
                    />
                  </div>

                  <div className="mb-0">
                    <label className="form-label fw-bold text-secondary small text-uppercase">Nhận xét chi tiết</label>
                    <textarea 
                      required className="form-control border-2 shadow-none" 
                      rows="3" placeholder="Nhập nhận xét về thái độ và kết quả công việc..."
                      value={content} onChange={(e) => setContent(e.target.value)}
                      disabled={selectedStudent?.isEvaluated}
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer border-0 p-3">
                  <button type="button" className="btn btn-light px-4 fw-bold" onClick={() => setIsModalOpen(false)}>
                    {selectedStudent?.isEvaluated ? "Đóng" : "Hủy bỏ"}
                  </button>
                  {!selectedStudent?.isEvaluated && (
                    <button type="submit" disabled={submitting} className="btn btn-primary px-4 fw-bold">
                      {submitting ? <Loader2 className="spinner-border spinner-border-sm me-2" /> : null}
                      Lưu kết quả
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}