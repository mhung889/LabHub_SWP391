import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Button,
  Card,
  Form,
  Modal,
  Alert,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import authApi from "@/api/authApi";
import mentorApi from "@/api/mentorApi";
import { getAccessToken } from "@/utils/storage";

import "@/components/css/StudentProfile.css";

const MentorProfile = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    address: "",
    dateOfBirth: "",
    gender: "",
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = getAccessToken();
        if (!token) {
          navigate("/login");
          return;
        }

        const profile = await authApi.getProfile();

        if (!profile?.user || profile.user.role !== "mentor") {
          navigate("/403");
          return;
        }

        setUser(profile.user);
        localStorage.setItem("user", JSON.stringify(profile.user));

        setFormData({
          fullName: profile.user.fullName || "",
          phoneNumber: profile.user.phoneNumber || "",
          address: profile.user.address || "",
          dateOfBirth: profile.user.dateOfBirth
            ? new Date(profile.user.dateOfBirth).toISOString().split("T")[0]
            : "",
          gender: profile.user.gender || "",
        });

        try {
          const mentorDetail = await mentorApi.getMentorById(profile.user._id);
          if (mentorDetail?.data) {
            const data = mentorDetail.data;
            setLabs(data.labs || []);
          }
        } catch (err) {
          console.error("Error loading mentor labs:", err);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        if (err.response?.status === 401) {
          authApi.logout();
          navigate("/login");
        } else {
          setError(
            err.response?.data?.message ||
              "Không thể tải thông tin hồ sơ. Vui lòng thử lại sau."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleEdit = () => {
    setIsEditing(true);
    setError("");
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError("");

    if (user) {
      setFormData({
        fullName: user.fullName || "",
        phoneNumber: user.phoneNumber || "",
        address: user.address || "",
        dateOfBirth: user.dateOfBirth
          ? new Date(user.dateOfBirth).toISOString().split("T")[0]
          : "",
        gender: user.gender || "",
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFormErrors({});
    setSaving(true);

    try {
      const updateData = {};

      if (formData.fullName && formData.fullName.trim()) {
        updateData.fullName = formData.fullName.trim();
      }

      // Validate phone number (optional but must be 10-11 digits if filled)
      if (formData.phoneNumber && formData.phoneNumber.trim()) {
        const phoneRegex = /^[0-9]{10}$/;
        const cleanPhone = formData.phoneNumber.trim().replace(/[\s-]/g, "");
        if (!phoneRegex.test(cleanPhone)) {
          setFormErrors((prev) => ({
            ...prev,
            phoneNumber: "Số điện thoại không hợp lệ",
          }));
          setSaving(false);
          return;
        }
        if (cleanPhone.length > 20) {
          setFormErrors((prev) => ({
            ...prev,
            phoneNumber: "Số điện thoại không được vượt quá 20 ký tự",
          }));
          setSaving(false);
          return;
        }
        updateData.phoneNumber = cleanPhone;
      } else if (formData.phoneNumber === "") {
        updateData.phoneNumber = null;
      }
      if (formData.address !== undefined) {
        updateData.address = formData.address.trim() || null;
      }
      if (formData.dateOfBirth && formData.dateOfBirth.trim()) {
        updateData.dateOfBirth = formData.dateOfBirth;
      }
      if (formData.gender && formData.gender.trim()) {
        updateData.gender = formData.gender;
      }

      const response = await authApi.updateProfile(updateData);

      // Refresh profile data after successful update
      try {
        const refreshedProfile = await authApi.getProfile();
        if (refreshedProfile.user) {
          setUser(refreshedProfile.user);
          localStorage.setItem("user", JSON.stringify(refreshedProfile.user));
          setFormData({
            fullName: refreshedProfile.user.fullName || "",
            phoneNumber: refreshedProfile.user.phoneNumber || "",
            address: refreshedProfile.user.address || "",
            dateOfBirth: refreshedProfile.user.dateOfBirth
              ? new Date(refreshedProfile.user.dateOfBirth).toISOString().split("T")[0]
              : "",
            gender: refreshedProfile.user.gender || "",
          });
        }
      } catch (refreshError) {
        console.error("Error refreshing profile:", refreshError);
        // Fallback to response data if refresh fails
        if (response.user) {
          setUser(response.user);
          localStorage.setItem("user", JSON.stringify(response.user));
          setFormData({
            fullName: response.user.fullName || "",
            phoneNumber: response.user.phoneNumber || "",
            address: response.user.address || "",
            dateOfBirth: response.user.dateOfBirth
              ? new Date(response.user.dateOfBirth).toISOString().split("T")[0]
              : "",
            gender: response.user.gender || "",
          });
        }
      }

      toast.success(response.message || "Cập nhật thông tin thành công");
      setIsEditing(false);
    } catch (err) {
      console.error("Update profile error:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Cập nhật thất bại. Vui lòng thử lại.";
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn file ảnh hợp lệ");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Kích thước file không được vượt quá 5MB");
      return;
    }

    setError("");
    setUploadingAvatar(true);

    try {
      const response = await authApi.uploadAvatar(file);

      if (response.user) {
        setUser(response.user);
        localStorage.setItem("user", JSON.stringify(response.user));
      }

      toast.success(response.message || "Cập nhật avatar thành công!");
    } catch (err) {
      console.error("Upload avatar error:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Upload avatar thất bại. Vui lòng thử lại.";
      setError(errorMessage);
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");

    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      setError("Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("Mật khẩu mới và xác nhận mật khẩu không khớp");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }

    setChangingPassword(true);
    try {
      if (!user?._id) {
        setError("Không tìm thấy thông tin người dùng");
        return;
      }

      await authApi.changePassword(user._id, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      toast.success("Đổi mật khẩu thành công");
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      console.error("Change password error:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Đổi mật khẩu thất bại. Vui lòng thử lại.";
      setError(errorMessage);
    } finally {
      setChangingPassword(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Chưa cập nhật";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        if (
          typeof dateString === "string" &&
          dateString.match(/^\d{4}-\d{2}-\d{2}$/)
        ) {
          const [year, month, day] = dateString.split("-");
          return `${day}/${month}/${year}`;
        }
        return dateString;
      }
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      return dateString || "Chưa cập nhật";
    }
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "60vh" }}
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
    <>
      <Container fluid="lg">
        <div className="mb-4 mb-lg-5">
          <h1 className="display-6 fw-bold text-dark mb-2">
            Hồ sơ Mentor
          </h1>
          <p className="text-secondary">
            Quản lý thông tin cá nhân và tài khoản mentor của bạn.
          </p>
        </div>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        <Row className="g-4">
          <Col lg={4}>
            <Card className="profile-card custom-card border-0">
              <Card.Body className="p-4 text-center">
                <div className="profile-avatar-wrapper mb-4">
                  <div
                    className="profile-avatar mx-auto"
                    style={{
                      backgroundImage: user?.image
                        ? `url("${user.image}")`
                        : "none",
                      backgroundColor: user?.image
                        ? "transparent"
                        : "#e2e8f0",
                      opacity: uploadingAvatar ? 0.6 : 1,
                    }}
                  >
                    {!user?.image && (
                      <span
                        className="material-symbols-outlined text-secondary"
                        style={{ fontSize: "64px" }}
                      >
                        person
                      </span>
                    )}
                    {uploadingAvatar && (
                      <div className="position-absolute top-50 start-50 translate-middle">
                        <div
                          className="spinner-border text-primary-custom"
                          role="status"
                        >
                          <span className="visually-hidden">Uploading...</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <label
                    htmlFor="avatar-upload"
                    className="btn-edit-avatar"
                    style={{
                      cursor: uploadingAvatar ? "not-allowed" : "pointer",
                      pointerEvents: uploadingAvatar ? "none" : "auto",
                    }}
                  >
                    <span className="material-symbols-outlined">
                      camera_alt
                    </span>
                  </label>
                  <input
                    type="file"
                    id="avatar-upload"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    style={{ display: "none" }}
                    disabled={uploadingAvatar}
                  />
                </div>
                <h3 className="h4 fw-bold text-dark mb-1">
                  {user?.fullName || "Mentor"}
                </h3>
                <p className="text-secondary mb-3">{user?.email || ""}</p>
                <div className="d-flex align-items-center justify-content-center gap-2 mb-3">
                  <span
                    className={`badge ${
                      user?.status === "active" ? "bg-success" : "bg-secondary"
                    } px-3 py-2`}
                  >
                    {user?.status === "active"
                      ? "Đang hoạt động"
                      : "Không hoạt động"}
                  </span>
                </div>
                <Button
                  variant="outline-primary"
                  className="w-100 mt-3"
                  onClick={isEditing ? handleCancel : handleEdit}
                  disabled={saving}
                >
                  <span
                    className="material-symbols-outlined me-2"
                    style={{ verticalAlign: "middle", fontSize: "20px" }}
                  >
                    {isEditing ? "close" : "edit"}
                  </span>
                  {isEditing ? "Hủy" : "Chỉnh sửa hồ sơ"}
                </Button>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={8}>
            <Row className="g-4">
              <Col md={12}>
                <Card className="custom-card border-0">
                  <Card.Header className="bg-white border-0 pb-0 pt-4 px-4">
                    <h4 className="h5 fw-bold text-dark mb-0">
                      <span
                        className="material-symbols-outlined me-2 text-primary-custom"
                        style={{ verticalAlign: "middle", fontSize: "24px" }}
                      >
                        person
                      </span>
                      Thông tin cá nhân
                    </h4>
                  </Card.Header>
                  <Card.Body className="p-4">
                    {isEditing ? (
                      <Form onSubmit={handleSubmit}>
                        <Row className="g-3">
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label className="info-label">
                                Họ và tên *
                              </Form.Label>
                              <Form.Control
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleInputChange}
                                required
                                className="custom-input"
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label className="info-label">
                                Email
                              </Form.Label>
                              <Form.Control
                                type="email"
                                value={user?.email || ""}
                                disabled
                                className="custom-input bg-light"
                              />
                              <Form.Text className="text-muted">
                                Email không thể thay đổi
                              </Form.Text>
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label className="info-label">
                                Số điện thoại
                              </Form.Label>
                              <Form.Control
                                type="tel"
                                name="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={handleInputChange}
                                placeholder="Nhập số điện thoại (10-11 chữ số)"
                                className={`custom-input ${
                                  formErrors.phoneNumber ? "is-invalid" : ""
                                }`}
                              />
                              {formErrors.phoneNumber && (
                                <div className="invalid-feedback d-block">
                                  {formErrors.phoneNumber}
                                </div>
                              )}
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label className="info-label">
                                Ngày sinh
                              </Form.Label>
                              <Form.Control
                                type="date"
                                name="dateOfBirth"
                                value={formData.dateOfBirth}
                                onChange={handleInputChange}
                                className="custom-input"
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label className="info-label">
                                Giới tính
                              </Form.Label>
                              <Form.Select
                                name="gender"
                                value={formData.gender}
                                onChange={handleInputChange}
                                className="custom-input"
                              >
                                <option value="">Chọn giới tính</option>
                                <option value="male">Nam</option>
                                <option value="female">Nữ</option>
                                <option value="other">Khác</option>
                              </Form.Select>
                            </Form.Group>
                          </Col>
                          <Col md={12}>
                            <Form.Group>
                              <Form.Label className="info-label">
                                Địa chỉ
                              </Form.Label>
                              <Form.Control
                                as="textarea"
                                rows={3}
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                placeholder="Nhập địa chỉ"
                                className="custom-input"
                              />
                            </Form.Group>
                          </Col>
                          <Col md={12}>
                            <div className="d-flex gap-2 justify-content-end mt-3">
                              <Button
                                variant="secondary"
                                onClick={handleCancel}
                                disabled={saving}
                              >
                                Hủy
                              </Button>
                              <Button
                                variant="primary"
                                type="submit"
                                disabled={saving}
                                className="bg-primary-custom"
                              >
                                {saving ? "Đang lưu..." : "Lưu thay đổi"}
                              </Button>
                            </div>
                          </Col>
                        </Row>
                      </Form>
                    ) : (
                      <Row className="g-3">
                        <Col md={6}>
                          <div className="info-item">
                            <label className="info-label">Họ và tên</label>
                            <p className="info-value">
                              {user?.fullName || "Chưa cập nhật"}
                            </p>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="info-item">
                            <label className="info-label">Email</label>
                            <p className="info-value">
                              {user?.email || "Chưa cập nhật"}
                            </p>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="info-item">
                            <label className="info-label">Số điện thoại</label>
                            <p className="info-value">
                              {user?.phoneNumber || "Chưa cập nhật"}
                            </p>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="info-item">
                            <label className="info-label">Ngày sinh</label>
                            <p className="info-value">
                              {user?.dateOfBirth
                                ? formatDate(user.dateOfBirth)
                                : "Chưa cập nhật"}
                            </p>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="info-item">
                            <label className="info-label">Giới tính</label>
                            <p className="info-value">
                              {user?.gender === "male"
                                ? "Nam"
                                : user?.gender === "female"
                                ? "Nữ"
                                : user?.gender === "other"
                                ? "Khác"
                                : "Chưa cập nhật"}
                            </p>
                          </div>
                        </Col>
                        <Col md={12}>
                          <div className="info-item">
                            <label className="info-label">Địa chỉ</label>
                            <p className="info-value">
                              {user?.address || "Chưa cập nhật"}
                            </p>
                          </div>
                        </Col>
                      </Row>
                    )}
                  </Card.Body>
                </Card>
              </Col>

              {labs && labs.length > 0 && (
                <Col md={12}>
                  <Card className="custom-card border-0">
                    <Card.Header className="bg-white border-0 pb-0 pt-4 px-4">
                      <h4 className="h5 fw-bold text-dark mb-0">
                        <span
                          className="material-symbols-outlined me-2 text-primary-custom"
                          style={{
                            verticalAlign: "middle",
                            fontSize: "24px",
                          }}
                        >
                          science
                        </span>
                        Lab đang phụ trách
                      </h4>
                    </Card.Header>
                    <Card.Body className="p-4">
                      <Row className="g-3">
                        {labs.map((lab) => (
                          <Col md={6} key={lab._id}>
                            <div className="info-item">
                              <label className="info-label">Tên Lab</label>
                              <p className="info-value">{lab.name}</p>
                              <label className="info-label mt-2">Mã Lab</label>
                              <p className="info-value">{lab.code}</p>
                              {lab.description && (
                                <small className="text-secondary d-block mt-1">
                                  {lab.description}
                                </small>
                              )}
                            </div>
                          </Col>
                        ))}
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
              )}

              <Col md={12}>
                <Card className="custom-card border-0">
                  <Card.Header className="bg-white border-0 pb-0 pt-4 px-4">
                    <h4 className="h5 fw-bold text-dark mb-0">
                      <span
                        className="material-symbols-outlined me-2 text-primary-custom"
                        style={{ verticalAlign: "middle", fontSize: "24px" }}
                      >
                        account_circle
                      </span>
                      Thông tin tài khoản
                    </h4>
                  </Card.Header>
                  <Card.Body className="p-4">
                    <Row className="g-3">
                      <Col md={6}>
                        <div className="info-item">
                          <label className="info-label">Vai trò</label>
                          <p className="info-value">
                            <span className="badge bg-primary-custom px-3 py-2">
                              Mentor
                            </span>
                          </p>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="info-item">
                          <label className="info-label">
                            Ngày tạo tài khoản
                          </label>
                          <p className="info-value">
                            {formatDate(user?.createdAt)}
                          </p>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="info-item">
                          <label className="info-label">
                            Cập nhật lần cuối
                          </label>
                          <p className="info-value">
                            {formatDate(user?.updatedAt)}
                          </p>
                        </div>
                      </Col>
                      <Col md={12}>
                        <div className="d-flex justify-content-end mt-3">
                          <Button
                            variant="outline-primary"
                            onClick={() => setShowPasswordModal(true)}
                          >
                            <span
                              className="material-symbols-outlined me-2"
                              style={{
                                verticalAlign: "middle",
                                fontSize: "20px",
                              }}
                            >
                              lock
                            </span>
                            Đổi mật khẩu
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>

      <Modal
        show={showPasswordModal}
        onHide={() => {
          setShowPasswordModal(false);
          setPasswordData({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          });
          setError("");
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Đổi mật khẩu</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleChangePassword}>
          <Modal.Body>
            {error && (
              <Alert
                variant="danger"
                dismissible
                onClose={() => setError("")}
              >
                {error}
              </Alert>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Mật khẩu hiện tại *</Form.Label>
              <Form.Control
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                required
                placeholder="Nhập mật khẩu hiện tại"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Mật khẩu mới *</Form.Label>
              <Form.Control
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                required
                minLength={6}
                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Xác nhận mật khẩu mới *</Form.Label>
              <Form.Control
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                required
                minLength={6}
                placeholder="Nhập lại mật khẩu mới"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => {
                setShowPasswordModal(false);
                setPasswordData({
                  currentPassword: "",
                  newPassword: "",
                  confirmPassword: "",
                });
                setError("");
              }}
              disabled={changingPassword}
            >
              Hủy
            </Button>
            <Button variant="primary" type="submit" disabled={changingPassword}>
              {changingPassword ? "Đang xử lý..." : "Đổi mật khẩu"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

export default MentorProfile;


