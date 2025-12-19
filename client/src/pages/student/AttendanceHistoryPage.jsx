import React, { useEffect, useState } from 'react';
import studentApi from '../../api/studentApi';
import { toast } from 'sonner';
import Sidebar from '../../components/student/sidebar/Sidebar';
import authApi from '../../api/authApi';
import { getAccessToken } from '../../utils/storage';
import { useNavigate } from 'react-router-dom';

const AttendanceHistoryPage = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      navigate('/login');
      return;
    }
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

    const fetchInitialData = async () => {
      try {
        const userRes = await authApi.getUserProfile(userInfo._id);
        setUser(userRes.data);

        const historyRes = await studentApi.getAttendanceHistory();
        setHistory(historyRes.data);
        setFilteredHistory(historyRes.data);
      } catch (err) {
        console.error(err);
        toast.error('Không thể tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [navigate]);

  useEffect(() => {
    let result = [...history];
    if (filterStatus !== 'all') {
      result = result.filter(item => item.status === filterStatus);
    }
    if (filterDate) {
      result = result.filter(item => {
        const itemDate = new Date(item.date).toISOString().split('T')[0];
        return itemDate === filterDate;
      });
    }
    setFilteredHistory(result);
  }, [filterStatus, filterDate, history]);

  // ==========================================
  // CẬP NHẬT TÊN TRẠNG THÁI TẠI ĐÂY
  // ==========================================
  const getStatusBadge = (status) => {
    const statusMap = {
      completed: { text: 'Hoàn thành', class: 'bg-success-subtle text-success' },
      partial: { text: 'Chưa đủ giờ', class: 'bg-info-subtle text-info' },
      absent: { text: 'Vắng', class: 'bg-danger-subtle text-danger' },
      leave: { text: 'Nghỉ phép', class: 'bg-secondary-subtle text-secondary' },
      pending: { text: 'Chưa kết thúc', class: 'bg-warning-subtle text-warning' },
    };
    const config = statusMap[status] || { text: status, class: 'bg-light text-dark' };
    return <span className={`badge ${config.class} px-3 py-2`}>{config.text}</span>;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  return (
    <div className='d-flex w-100 overflow-hidden'>
      <Sidebar user={user} />

      <main className='flex-grow-1 p-4 p-lg-5' style={{ backgroundColor: '#f6f7f8', minHeight: '100vh' }}>
        <div className="container-fluid">
          <div className="mb-4">
            <h2 className="fw-bold text-dark">Lịch sử điểm danh</h2>
            <p className="text-secondary">Theo dõi quá trình thực tập và chuyên cần của bạn</p>
          </div>

          {/* Bộ lọc */}
          <div className="card border-0 shadow-sm p-3 mb-4">
            <div className="row g-3 align-items-end">
              <div className="col-md-4">
                <label className="form-label small fw-bold text-secondary">Lọc theo ngày</label>
                <input 
                  type="date" 
                  className="form-control border-light-subtle"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-bold text-secondary">Trạng thái</label>
                <select 
                  className="form-select border-light-subtle"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="completed">Hoàn thành</option>
                  <option value="partial">Chưa đủ giờ</option>
                  <option value="absent">Vắng</option>
                  <option value="leave">Nghỉ phép</option>
                  <option value="pending">Chưa kết thúc</option>
                </select>
              </div>
              <div className="col-md-2">
                <button 
                  className="btn btn-outline-secondary w-100"
                  onClick={() => { setFilterDate(''); setFilterStatus('all'); }}
                >
                  Đặt lại
                </button>
              </div>
            </div>
          </div>

          {/* Bảng dữ liệu */}
          <div className="card border-0 shadow-sm">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="ps-4">Ngày</th>
                    <th>Giờ vào</th>
                    <th>Giờ ra</th>
                    <th>Tổng giờ</th>
                    <th className="pe-4 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.length > 0 ? (
                    filteredHistory.map((item) => (
                      <tr key={item._id}>
                        <td className="ps-4 fw-medium">
                          {new Date(item.date).toLocaleDateString('vi-VN')}
                        </td>
                        <td>
                          <span className="text-primary fw-semibold">
                            {item.checkInTime ? new Date(item.checkInTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                          </span>
                        </td>
                        <td>
                          <span className="text-primary fw-semibold">
                            {item.checkOutTime ? new Date(item.checkOutTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                          </span>
                        </td>
                        <td>{item.totalHours ? `${item.totalHours}h` : '0h'}</td>
                        <td className="pe-4 text-center">{getStatusBadge(item.status)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center py-5 text-secondary">
                        Không tìm thấy dữ liệu phù hợp với bộ lọc.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AttendanceHistoryPage;