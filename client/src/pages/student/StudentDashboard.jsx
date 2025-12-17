import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, ProgressBar } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getAccessToken, clearStorage } from '../../utils/storage';
import authApi from '../../api/authApi';
import attendanceApi from '../../api/attendanceApi'; // 🟢 Thêm API check-face
import '../../components/css/StudentDashboard.css';
import Sidebar from '../../components/student/sidebar/Sidebar';
import leaveRequestApi from '@/api/leaveRequestApi';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const MAX_LEAVE_DAYS = 4;

  const [leaveStats, setLeaveStats] = useState({
    usedDays: 0,
    remainingDays: MAX_LEAVE_DAYS,
    percentRemaining: 100,
  });

  // lấy ngày tháng
  const [nowText, setNowText] = useState('');

  useEffect(() => {
    const formatNow = () => {
      const now = new Date();

      const weekday = now.toLocaleDateString('vi-VN', { weekday: 'long' });
      const date = now.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
      const time = now.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      const weekdayCap = weekday.charAt(0).toUpperCase() + weekday.slice(1);

      setNowText(`${weekdayCap}, ngày ${date} - ${time}`);
    };

    formatNow();
    const interval = setInterval(formatNow, 60 * 1000);

    return () => clearInterval(interval);
  }, []);
  // end ngày tháng

  // ==========================================
  // LẤY PROFILE USER
  // ==========================================
  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      navigate('/login');
      return;
    }

    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    if (!userInfo._id) {
      navigate('/login');
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const response = await authApi.getUserProfile(userInfo._id);
        setUser(response.data);
      } catch (error) {
        console.error('Lỗi khi lấy thông tin user:', error);
        setUser(userInfo);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [navigate]);

  // Leave request
  useEffect(() => {
    if (!user?._id) return;

    const fetchLeaveStats = async () => {
      try {
        const res = await leaveRequestApi.getMine();
        const leaveRequests = res.data?.leaveRequests || [];

        const now = new Date();
        const startOfMonth = new Date(
          now.getFullYear(),
          now.getMonth(),
          1,
          0,
          0,
          0,
          0
        );
        const endOfMonth = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          1,
          0,
          0,
          0,
          0
        );

        const approvedThisMonth = leaveRequests.filter((r) => {
          if (r.status !== 'approved') return false;
          const s = new Date(r.startDate);
          return s >= startOfMonth && s < endOfMonth;
        });

        const usedDays = approvedThisMonth.reduce(
          (sum, r) => sum + (Number(r.totalDays) || 0),
          0
        );

        const remainingDays = Math.max(MAX_LEAVE_DAYS - usedDays, 0);
        const percentRemaining = Math.round(
          (remainingDays / MAX_LEAVE_DAYS) * 100
        );

        setLeaveStats({ usedDays, remainingDays, percentRemaining });
      } catch (err) {
        console.error(err);
        setLeaveStats({
          usedDays: 0,
          remainingDays: MAX_LEAVE_DAYS,
          percentRemaining: 100,
        });
      }
    };

    fetchLeaveStats();
  }, [user]);

  // ==========================================
  // XỬ LÝ CLICK ĐIỂM DANH KHUÔN MẶT
  // ==========================================
  const handleAttendanceClick = async () => {
    try {
      const res = await attendanceApi.checkFaceStatus();

      if (!res.data.registered) {
        toast.info('Bạn chưa đăng ký khuôn mặt. Vui lòng đăng ký trước.');
        return navigate('/student/register-face');
      }

      return navigate('/student/attendance');
    } catch (err) {
      console.error(err);
      toast.error('Không thể kiểm tra trạng thái khuôn mặt.');
    }
  };

  // ==========================================
  // LOADING
  // ==========================================
  if (loading || !user)
    return <div className='p-5 text-center'>Đang tải...</div>;

  // ==========================================
  // RENDER UI
  // ==========================================
  return (
    <div className='d-flex w-100 overflow-hidden'>
      <Sidebar user={user} />

      <main
        className='flex-grow-1 p-4 p-lg-5'
        style={{ backgroundColor: '#f6f7f8' }}
      >
        <Container fluid='lg'>
          {/* Header */}
          <div className='mb-4 mb-lg-5'>
            <h1 className='display-6 fw-bold text-dark mb-2'>
              Bảng tổng quan cá nhân
            </h1>
            <p className='text-secondary'>Chào mừng , {user.fullName}!</p>
          </div>

          <Row className='g-4 mb-4'>
            {/* Card: Face Attendance */}
            <Col md={12} lg={8}>
              <div className='custom-card p-4 d-flex flex-column align-items-center justify-content-center text-center'>
                <p className='text-secondary small mb-4'>{nowText}</p>

                <Button
                  variant='primary'
                  onClick={handleAttendanceClick}
                  className='main-btn bg-primary-custom border-0 px-5 d-flex align-items-center gap-3'
                >
                  <span className='material-symbols-outlined fs-4'>
                    photo_camera
                  </span>
                  Điểm danh bằng khuôn mặt
                </Button>

                <p className='text-secondary small mt-4 mb-0'>
                  Nhấn nút để điểm danh bằng khuôn mặt để đăng ký cho lần vào
                  đầu tiên của bạn.
                </p>
              </div>
            </Col>

            {/* Card: Leave Summary */}
            <Col md={12} lg={4}>
              <div className='custom-card p-4 d-flex flex-column justify-content-between'>
                <div>
                  <p className='text-secondary small mb-1'>Tóm tắt</p>
                  <h3 className='h5 fw-bold text-dark'>Số ngày nghỉ phép</h3>
                </div>

                <div className='text-center my-3'>
                  <div className='d-flex align-items-baseline justify-content-center'>
                    <span className='display-4 fw-bold text-primary-custom'>
                      {leaveStats.remainingDays}
                    </span>
                    <span className='h4 text-secondary fw-normal'>
                      /{MAX_LEAVE_DAYS}
                    </span>
                  </div>
                  <p className='text-secondary mb-0'>Số ngày còn lại</p>
                </div>

                <div>
                  <div className='d-flex justify-content-between mb-2'>
                    <small className='fw-bold text-dark'>
                      Số ngày nghỉ phép còn lại
                    </small>
                    <small className='text-dark'>
                      {' '}
                      {leaveStats.percentRemaining}%{' '}
                    </small>
                  </div>

                  <ProgressBar
                    now={leaveStats.percentRemaining}
                    variant='info'
                    style={{ height: '8px', backgroundColor: '#e2e8f0' }}
                    className='rounded-pill'
                  />

                  <style>{`.progress-bar { background-color: #2b8cee !important; }`}</style>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </main>
    </div>
  );
};

export default StudentDashboard;
