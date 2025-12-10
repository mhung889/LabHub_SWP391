import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Alert,
  Badge,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { getAccessToken } from "../../utils/storage";
import Sidebar from "../../components/student/sidebar/Sidebar";

const LeaveRequestStudent = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // UI state cho form (chỉ để hiển thị, chưa gọi API)
  const [formData, setFormData] = useState({
    type: "",
    startDate: "",
    endDate: "",
    reason: "",
    note: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      navigate("/login");
      return;
    }

    // Lấy user từ localStorage (mock, chưa cần gọi API)
    const storedUser =
      JSON.parse(localStorage.getItem("user")) ||
      JSON.parse(localStorage.getItem("userInfo") || "{}");

    setUser(storedUser || null);
    setLoading(false);
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Tạm validation nhẹ
    if (!formData.type || !formData.startDate || !formData.reason.trim()) {
      setError("Vui lòng chọn loại nghỉ, ngày bắt đầu và nhập lý do.");
      return;
    }

    // Chưa kết nối API – chỉ hiển thị thông báo demo
    setSuccess("Gửi đơn thành công (demo UI, chưa kết nối API).");

    // Sau này bạn sẽ gọi API tại đây
    // await leaveApi.createLeaveRequest(formData);

    // Clear form nhẹ cho feel
    setFormData((prev) => ({
      ...prev,
      type: "",
      startDate: "",
      endDate: "",
      reason: "",
      note: "",
    }));

    setTimeout(() => setSuccess(""), 2500);
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "100vh" }}
      >
        <div className="text-center">
          <div className="spinner-border text-primary-custom" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-secondary">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex w-100 overflow-hidden">
      {/* Sidebar dùng chung */}
      <Sidebar user={user} />

      {/* Main content */}
      <main
        className="flex-grow-1 p-4 p-lg-5"
        style={{ backgroundColor: "#f6f7f8" }}
      >
        <Container fluid="lg">
          {/* Header */}
          <div className="mb-4 mb-lg-5 d-flex flex-column gap-1">
            <h1 className="display-6 fw-bold text-dark mb-0">
              Đơn xin nghỉ học
            </h1>
            <p className="text-secondary mb-0">
              Tạo và theo dõi các đơn xin nghỉ của bạn.
            </p>
          </div>

          {/* Alert */}
          {error && (
            <Alert
              variant="danger"
              dismissible
              onClose={() => setError("")}
              className="mb-3"
            >
              {error}
            </Alert>
          )}
          {success && (
            <Alert
              variant="success"
              dismissible
              onClose={() => setSuccess("")}
              className="mb-3"
            >
              {success}
            </Alert>
          )}

          <Row className="g-4">
            {/* Form tạo đơn nghỉ */}
            <Col lg={8}>
              <Card className="custom-card border-0">
                <Card.Header className="bg-white border-0 pb-0 pt-4 px-4">
                  <h4 className="h5 fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                    <span
                      className="material-symbols-outlined text-primary-custom"
                      style={{ fontSize: "24px" }}
                    >
                      event_busy
                    </span>
                    Tạo đơn xin nghỉ mới
                  </h4>
                </Card.Header>
                <Card.Body className="p-4">
                  <Form onSubmit={handleSubmit}>
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Loại nghỉ *</Form.Label>
                          <Form.Select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className="custom-input"
                            required
                          >
                            <option value="">Chọn loại nghỉ</option>
                            <option value="personal">
                              Nghỉ vì lý do cá nhân
                            </option>
                            <option value="sick">Nghỉ ốm</option>
                            <option value="family">Nghỉ vì gia đình</option>
                            <option value="other">Khác</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group>
                          <Form.Label>Ngày bắt đầu *</Form.Label>
                          <Form.Control
                            type="date"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleChange}
                            className="custom-input"
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group>
                          <Form.Label>Ngày kết thúc</Form.Label>
                          <Form.Control
                            type="date"
                            name="endDate"
                            value={formData.endDate}
                            onChange={handleChange}
                            className="custom-input"
                          />
                          <Form.Text className="text-muted">
                            Để trống nếu nghỉ 1 ngày
                          </Form.Text>
                        </Form.Group>
                      </Col>

                      <Col md={12}>
                        <Form.Group>
                          <Form.Label>Lý do chi tiết *</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={4}
                            name="reason"
                            value={formData.reason}
                            onChange={handleChange}
                            placeholder="Nhập lý do xin nghỉ..."
                            className="custom-input"
                            required
                          />
                        </Form.Group>
                      </Col>

                      <Col md={12}>
                        <Form.Group>
                          <Form.Label>Ghi chú cho Mentor (không bắt buộc)</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            name="note"
                            value={formData.note}
                            onChange={handleChange}
                            placeholder="Thêm ghi chú nếu cần..."
                            className="custom-input"
                          />
                        </Form.Group>
                      </Col>

                      <Col md={12} className="mt-2">
                        <div className="d-flex justify-content-end gap-2">
                          <Button
                            variant="secondary"
                            type="button"
                            onClick={() => {
                              setFormData({
                                type: "",
                                startDate: "",
                                endDate: "",
                                reason: "",
                                note: "",
                              });
                              setError("");
                              setSuccess("");
                            }}
                          >
                            Xóa nội dung
                          </Button>
                          <Button
                            variant="primary"
                            type="submit"
                            className="bg-primary-custom border-0"
                          >
                            Gửi đơn xin nghỉ
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </Form>
                </Card.Body>
              </Card>
            </Col>

            {/* Tổng quan & lịch sử đơn (mock) */}
            <Col lg={4}>
              {/* Tổng quan trạng thái */}
          
            </Col>
          </Row>
        </Container>
      </main>
    </div>
  );
};

export default LeaveRequestStudent;
