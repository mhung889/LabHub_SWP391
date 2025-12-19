import React, { useEffect, useState } from 'react';
import evaluationApi from '@/api/evaluationApi';
import labApi from '@/api/labApi';
import { toast } from 'sonner';
import { Loader2, Search, Eye, FileSpreadsheet, Filter, RefreshCcw } from "lucide-react";
import * as XLSX from 'xlsx';

export default function AdminEvaluationReportListPage() {
  const [evaluations, setEvaluations] = useState([]);
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLab, setSelectedLab] = useState('all');
  
  const [showModal, setShowModal] = useState(false);
  const [viewDetail, setViewDetail] = useState(null);

  // Tải danh sách đánh giá mỗi khi Lab được chọn thay đổi
  useEffect(() => {
    fetchEvaluations();
  }, [selectedLab]);
  useEffect(() => {
    const fetchLabs = async () => {
      try {
        // Đổi từ getAllLabs() sang getLabs() 
        // Thêm tham số status=active nếu bạn chỉ muốn lọc các lab đang hoạt động
        const res = await labApi.getLabs({ status: 'active' }); 
        
        console.log("Dữ liệu Lab trả về từ API:", res.data);
  
        /**
         * Kiểm tra cấu trúc dữ liệu:
         * Thông thường API trả về { success: true, labs: [...] } hoặc { data: [...] }
         */
        if (res.data && res.data.labs) {
          setLabs(res.data.labs);
        } else if (res.data && res.data.data) {
          setLabs(res.data.data);
        } else if (Array.isArray(res.data)) {
          setLabs(res.data);
        }
      } catch (error) {
        console.error("Lỗi khi tải Lab:", error);
        toast.error("Không thể tải danh sách phòng Lab");
      }
    };
    fetchLabs();
  }, []);
  const fetchEvaluations = async () => {
    setLoading(true);
    try {
      const res = await evaluationApi.getAdminEvaluations(selectedLab);
      setEvaluations(res.data.data || []);
    } catch (error) {
      toast.error("Không thể tải dữ liệu báo cáo");
    } finally {
      setLoading(false);
    }
  };

  // Hàm xử lý xuất Excel
  const exportToExcel = () => {
    if (filteredData.length === 0) {
      return toast.warning("Không có dữ liệu để xuất");
    }

    const dataToExport = filteredData.map(item => ({
      "Mã SV": item.student?.studentCode,
      "Họ Tên": item.student?.user?.fullName,
      "Phòng Lab": item.lab?.name || "N/A",
      "Nghỉ không phép": item.attendanceSnapshot?.absentCount || 0,
      "Quên Check-in/out": item.attendanceSnapshot?.partialCount || 0,
      "Nghỉ có phép": item.attendanceSnapshot?.leaveCount || 0,
      "Điểm Đề Xuất": item.suggestedScore,
      "Điểm Chốt": item.finalScore,
      "Mentor Đánh Giá": item.mentor?.fullName,
      "Nội dung nhận xét": item.content,
      "Ngày chấm": new Date(item.createdAt).toLocaleDateString('vi-VN')
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DanhSachDanhGia");

    const fileName = `Bao_Cao_Danh_Gia_${new Date().getTime()}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success("Đã xuất file Excel thành công");
  };

  const filteredData = evaluations.filter(item => {
    const fullName = item.student?.user?.fullName?.toLowerCase() || "";
    const studentCode = item.student?.studentCode?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || studentCode.includes(search);
  });

  const handleViewDetail = (item) => {
    setViewDetail(item);
    setShowModal(true);
  };

  return (
    <div className="container-fluid py-4">
      {/* Header & Filters */}
      <div className="card shadow-sm mb-4 border-0">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-4 mb-3 mb-md-0">
              <h4 className="mb-0 fw-bold text-primary">Báo Cáo Đánh Giá</h4>
              <p className="text-muted small mb-0">Quản lý kết quả từ {labs.length} phòng Lab</p>
            </div>
            
            <div className="col-md-8 d-flex flex-wrap gap-2 justify-content-md-end">
              <button className="btn btn-success d-flex align-items-center gap-2 shadow-sm" onClick={exportToExcel}>
                <FileSpreadsheet size={18}/> Xuất Excel
              </button>
              
              <button className="btn btn-outline-primary" onClick={fetchEvaluations}>
                <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
              </button>

              <div className="input-group" style={{ maxWidth: '200px' }}>
                <span className="input-group-text bg-light border-end-0"><Filter size={16}/></span>
                <select 
                  className="form-select border-start-0 shadow-none bg-light text-truncate"
                  value={selectedLab}
                  onChange={(e) => setSelectedLab(e.target.value)}
                >
                  <option value="all">Tất cả Lab</option>
                  {labs.map(lab => (
                    <option key={lab._id} value={lab._id}>{lab.name}</option>
                  ))}
                </select>
              </div>

              <div className="input-group" style={{ maxWidth: '250px' }}>
                <span className="input-group-text bg-white border-end-0"><Search size={18}/></span>
                <input 
                  type="text" 
                  className="form-control border-start-0 ps-0 shadow-none" 
                  placeholder="Tìm tên, mã SV..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="card shadow-sm border-0 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light text-secondary">
              <tr>
                <th className="ps-4">Sinh Viên</th>
                <th>Phòng Lab</th>
                <th className="text-center">Chuyên cần (V/M/P)</th>
                <th className="text-center">Điểm ĐX</th>
                <th className="text-center">Điểm Chốt</th>
                <th>Mentor</th>
                <th className="text-end pe-4">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    <Loader2 className="spinner-border text-primary me-2" />
                    <span className="text-muted">Đang tải dữ liệu...</span>
                  </td>
                </tr>
              ) : filteredData.length > 0 ? (
                filteredData.map((item) => (
                  <tr key={item._id}>
                    <td className="ps-4">
                      <div className="fw-bold text-dark">{item.student?.user?.fullName}</div>
                      <div className="text-muted small">{item.student?.studentCode}</div>
                    </td>
                    <td>
                      <span className="badge bg-light text-primary border">{item.lab?.name}</span>
                    </td>
                    <td className="text-center">
                      <div className="d-flex justify-content-center gap-1">
                        <span className="badge bg-danger-subtle text-danger" title="Vắng">{item.attendanceSnapshot?.absentCount}</span>
                        <span className="badge bg-warning-subtle text-warning" title="Muộn/Quên">{item.attendanceSnapshot?.partialCount}</span>
                        <span className="badge bg-primary-subtle text-primary" title="Phép">{item.attendanceSnapshot?.leaveCount}</span>
                      </div>
                    </td>
                    <td className="text-center text-muted small">{item.suggestedScore}</td>
                    <td className="text-center">
                      <span className={`fw-bold py-1 px-3 rounded-pill ${item.finalScore >= 5 ? 'bg-success text-white' : 'bg-danger text-white'}`}>
                        {item.finalScore}
                      </span>
                    </td>
                    <td><div className="small fw-medium text-dark">{item.mentor?.fullName}</div></td>
                    <td className="text-end pe-4">
                      <button 
                        className="btn btn-sm btn-white border shadow-sm rounded-pill" 
                        onClick={() => handleViewDetail(item)}
                      >
                        <Eye size={16} className="me-1 text-primary"/> Chi tiết
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted italic">
                    Không tìm thấy bản ghi đánh giá nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail */}
      {showModal && (
        <div className="modal show d-block shadow" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-light border-0">
                <h5 className="modal-title fw-bold">Chi tiết đánh giá</h5>
                <button type="button" className="btn-close shadow-none" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="mb-4">
                  <div className="h5 fw-bold text-dark mb-0">{viewDetail?.student?.user?.fullName}</div>
                  <span className="text-muted small">Mã SV: {viewDetail?.student?.studentCode} | Phòng: {viewDetail?.lab?.name}</span>
                </div>

                <div className="p-3 bg-light rounded border mb-4">
                  <label className="text-muted small d-block mb-2 text-uppercase fw-bold">Nhận xét từ Mentor ({viewDetail?.mentor?.fullName})</label>
                  <p className="mb-0 italic text-dark" style={{ lineHeight: '1.6' }}>"{viewDetail?.content}"</p>
                </div>

                <div className="row text-center border-top pt-3">
                  <div className="col-6 border-end">
                    <label className="text-muted small d-block mb-1">Ngày đánh giá</label>
                    <div className="fw-medium text-dark">{new Date(viewDetail?.createdAt).toLocaleDateString('vi-VN')}</div>
                  </div>
                  <div className="col-6">
                    <label className="text-muted small d-block mb-1">Xếp loại</label>
                    <div className={`fw-bold ${viewDetail?.finalScore >= 5 ? 'text-success' : 'text-danger'}`}>
                      {viewDetail?.finalScore >= 5 ? 'ĐẠT YÊU CẦU' : 'KHÔNG ĐẠT'}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0 p-3">
                <button className="btn btn-primary w-100 py-2 fw-bold" onClick={() => setShowModal(false)}>Đóng</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}