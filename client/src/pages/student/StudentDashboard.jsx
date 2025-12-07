import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button, ProgressBar } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getAccessToken, clearStorage } from "../../utils/storage";
import authApi from "../../api/authApi";
import "./StudentDashboard.css";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = getAccessToken();
    if (!token) {
      navigate("/login");
      return;
    }

    // Get user ID from localStorage
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
    if (!userInfo._id) {
      navigate("/login");
      return;
    }

    // Fetch user profile from backend
    const fetchUserProfile = async () => {
      try {
        const response = await authApi.getUserProfile(userInfo._id);
        setUser(response.data);
      } catch (error) {
        console.error("Lỗi khi lấy thông tin user:", error);
        // Fallback to localStorage if API fails
        setUser(userInfo);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [navigate]);

  const handleLogout = () => {
    clearStorage();
    navigate("/login");
    toast.success("Đã đăng xuất");
  };

  if (loading || !user)
    return <div className="p-5 text-center">Đang tải...</div>;

  return (
    <div className="d-flex w-100 overflow-hidden">
      {/* --- Sidebar --- */}
      <aside className="sidebar-wrapper d-flex flex-column flex-shrink-0 p-4 d-none d-lg-flex">
        <div className="d-flex align-items-center gap-2 px-2 mb-5">
          <span className="material-symbols-outlined text-primary-custom fs-2">
            task_alt
          </span>
          <h2 className="h4 fw-bold m-0 text-dark">LabHub</h2>
        </div>

        <div className="mb-4">
          <div className="d-flex align-items-center gap-3 mb-4">
            <div
              className="avatar bg-light"
              style={{
                backgroundImage: `url("${
                  user.image || "https://via.placeholder.com/50"
                }")`,
              }}
            ></div>
            <div>
              <h1 className="h6 fw-bold mb-0 text-dark">{user.fullName}</h1>
              <small className="text-secondary">MSSV: {user.studentId}</small>
            </div>
          </div>

          <nav className="d-flex flex-column gap-2">
            <a href="/student" className="nav-link-custom active">
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                dashboard
              </span>
              Bảng điều khiển
            </a>
            <a href="#" className="nav-link-custom">
              <span className="material-symbols-outlined">history</span>
              Lịch sử điểm danh
            </a>
            <a href="/student/profile" className="nav-link-custom">
              <span className="material-symbols-outlined">person</span>
              Hồ sơ
            </a>
          </nav>
        </div>

        <div className="mt-auto d-flex flex-column gap-3">
          <a href="#" className="nav-link-custom">
            <span className="material-symbols-outlined">settings</span>
            Cài đặt
          </a>
          <Button
            variant="light"
            className="w-100 fw-bold text-secondary py-2"
            onClick={handleLogout}
          >
            Đăng xuất
          </Button>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main
        className="flex-grow-1 p-4 p-lg-5"
        style={{ backgroundColor: "#f6f7f8" }}
      >
        <Container fluid="lg">
          {/* Header */}
          <div className="mb-4 mb-lg-5">
            <h1 className="display-6 fw-bold text-dark mb-2">
              Bảng điều khiển điểm danh
            </h1>
            <p className="text-secondary">
              Chào mừng trở lại, {user.fullName}! Đây là tóm tắt điểm danh của
              bạn.
            </p>
          </div>

          <Row className="g-4 mb-4">
            {/* Card: Face Attendance */}
            <Col md={12} lg={8}>
              <div className="custom-card p-4 d-flex flex-column align-items-center justify-content-center text-center">
                <p className="text-secondary small mb-4">
                  Thứ Hai, ngày 26 tháng 10 năm 2023 - 09:00
                </p>

                <Button
                  variant="primary"
                  className="main-btn bg-primary-custom border-0 px-5 d-flex align-items-center gap-3"
                >
                  <span className="material-symbols-outlined fs-4">
                    photo_camera
                  </span>
                  Điểm danh bằng khuôn mặt
                </Button>

                <p className="text-secondary small mt-4 mb-0">
                  Nhấn nút để điểm danh cho lớp học tiếp theo của bạn.
                </p>
              </div>
            </Col>

            {/* Card: Leave Summary */}
            <Col md={12} lg={4}>
              <div className="custom-card p-4 d-flex flex-column justify-content-between">
                <div>
                  <p className="text-secondary small mb-1">Tóm tắt</p>
                  <h3 className="h5 fw-bold text-dark">Số ngày nghỉ phép</h3>
                </div>

                <div className="text-center my-3">
                  <div className="d-flex align-items-baseline justify-content-center">
                    <span className="display-4 fw-bold text-primary-custom">
                      3
                    </span>
                    <span className="h4 text-secondary fw-normal">/4</span>
                  </div>
                  <p className="text-secondary mb-0">Số ngày còn lại</p>
                </div>

                <div>
                  <div className="d-flex justify-content-between mb-2">
                    <small className="fw-bold text-dark">
                      Số ngày nghỉ phép còn lại
                    </small>
                    <small className="text-dark">75%</small>
                  </div>
                  {/* React Bootstrap ProgressBar */}
                  <ProgressBar
                    now={75}
                    variant="info"
                    style={{ height: "8px", backgroundColor: "#e2e8f0" }}
                    className="rounded-pill"
                  />
                  <style>{`.progress-bar { background-color: #2b8cee !important; }`}</style>
                </div>
              </div>
            </Col>
          </Row>

          <Row className="g-4">
            {/* Today's Schedule */}
            <Col md={12} lg={6}>
              <div className="custom-card p-4">
                <h3 className="h5 fw-bold text-dark mb-4">Lịch học hôm nay</h3>

                <div className="d-flex flex-column gap-3">
                  {/* Item 1 */}
                  <div className="d-flex align-items-center gap-3">
                    <div className="icon-box bg-primary-light">
                      <span className="material-symbols-outlined text-primary-custom">
                        calculate
                      </span>
                    </div>
                    <div className="flex-grow-1">
                      <p className="fw-bold text-dark mb-0">Toán cao cấp</p>
                      <small className="text-secondary">10:00 - 11:30</small>
                    </div>
                    <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-2">
                      Đã điểm danh
                    </span>
                  </div>

                  {/* Item 2 */}
                  <div className="d-flex align-items-center gap-3">
                    <div className="icon-box bg-light">
                      <span className="material-symbols-outlined text-secondary">
                        science
                      </span>
                    </div>
                    <div className="flex-grow-1">
                      <p className="fw-bold text-dark mb-0">Vật lý lượng tử</p>
                      <small className="text-secondary">13:00 - 14:30</small>
                    </div>
                    <span className="badge bg-secondary bg-opacity-10 text-secondary rounded-pill px-3 py-2">
                      Sắp tới
                    </span>
                  </div>
                </div>
              </div>
            </Col>

            {/* Recent Activity */}
            <Col md={12} lg={6}>
              <div className="custom-card p-4">
                <h3 className="h5 fw-bold text-dark mb-4">Hoạt động gần đây</h3>

                <div className="d-flex flex-column gap-3">
                  {/* Activity 1 */}
                  <div className="d-flex align-items-center gap-3">
                    <div className="icon-box bg-primary-light">
                      <span className="material-symbols-outlined text-primary-custom">
                        login
                      </span>
                    </div>
                    <div className="flex-grow-1">
                      <p className="fw-bold text-dark mb-0 fs-6">
                        Đã điểm danh môn Toán cao cấp
                      </p>
                      <small
                        className="text-secondary"
                        style={{ fontSize: "0.75rem" }}
                      >
                        Hôm nay, 09:58
                      </small>
                    </div>
                  </div>

                  {/* Activity 2 */}
                  <div className="d-flex align-items-center gap-3">
                    <div className="icon-box bg-primary-light">
                      <span className="material-symbols-outlined text-primary-custom">
                        login
                      </span>
                    </div>
                    <div className="flex-grow-1">
                      <p className="fw-bold text-dark mb-0 fs-6">
                        Đã điểm danh môn Lịch sử nghệ thuật
                      </p>
                      <small
                        className="text-secondary"
                        style={{ fontSize: "0.75rem" }}
                      >
                        Hôm qua, 13:02
                      </small>
                    </div>
                  </div>

                  {/* Activity 3 */}
                  <div className="d-flex align-items-center gap-3">
                    <div className="icon-box bg-danger bg-opacity-10">
                      <span className="material-symbols-outlined text-danger">
                        calendar_month
                      </span>
                    </div>
                    <div className="flex-grow-1">
                      <p className="fw-bold text-dark mb-0 fs-6">
                        Đã sử dụng một ngày nghỉ phép
                      </p>
                      <small
                        className="text-secondary"
                        style={{ fontSize: "0.75rem" }}
                      >
                        3 ngày trước
                      </small>
                    </div>
                  </div>
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
