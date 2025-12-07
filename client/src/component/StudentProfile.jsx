import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card, Form, Modal, Alert } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../services/api';
import './StudentProfile.css';

const StudentProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    address: '',
    className: '',
    dateOfBirth: '',
    gender: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await authAPI.getProfile();
        console.log('Profile response:', response); // Debug log
        setUser(response.user);
        setStudent(response.student);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Khởi tạo form data
        if (response.user && response.student) {
          setFormData({
            fullName: response.user.fullName || '',
            phoneNumber: response.user.phoneNumber || response.student.phoneNumber || '',
            address: response.student.address || '',
            className: response.student.className || '',
            dateOfBirth: response.student.dateOfBirth 
              ? new Date(response.student.dateOfBirth).toISOString().split('T')[0]
              : '',
            gender: response.student.gender || '',
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        if (error.response?.status === 401) {
          authAPI.logout();
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    authAPI.logout();
    navigate('/login');
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError('');
    setSuccess('');
    // Reset form data về giá trị ban đầu
    if (user && student) {
      setFormData({
        fullName: user.fullName || '',
        phoneNumber: user.phoneNumber || student.phoneNumber || '',
        address: student.address || '',
        className: student.className || '',
        dateOfBirth: student.dateOfBirth 
          ? new Date(student.dateOfBirth).toISOString().split('T')[0]
          : '',
        gender: student.gender || '',
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      // Chỉ gửi các trường có giá trị
      const updateData = {};
      if (formData.fullName && formData.fullName.trim()) {
        updateData.fullName = formData.fullName.trim();
      }
      if (formData.phoneNumber !== undefined) {
        updateData.phoneNumber = formData.phoneNumber.trim() || null;
      }
      if (formData.address !== undefined) {
        updateData.address = formData.address.trim() || null;
      }
      if (formData.className !== undefined) {
        updateData.className = formData.className.trim() || null;
      }
      if (formData.dateOfBirth && formData.dateOfBirth.trim()) {
        updateData.dateOfBirth = formData.dateOfBirth;
      }
      if (formData.gender && formData.gender.trim()) {
        updateData.gender = formData.gender;
      }

      console.log('Updating profile with data:', updateData);

      const response = await authAPI.updateProfile(updateData);
      
      console.log('Update response:', response);
      
      // Cập nhật state
      if (response.user) {
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
      }
      if (response.student) {
        setStudent(response.student);
        // Cập nhật formData với dữ liệu mới
        setFormData({
          fullName: response.user?.fullName || '',
          phoneNumber: response.user?.phoneNumber || response.student?.phoneNumber || '',
          address: response.student?.address || '',
          className: response.student?.className || '',
          dateOfBirth: response.student?.dateOfBirth 
            ? new Date(response.student.dateOfBirth).toISOString().split('T')[0]
            : '',
          gender: response.student?.gender || '',
        });
      }
      
      setSuccess(response.message || 'Cập nhật hồ sơ thành công!');
      setIsEditing(false);
      
      // Ẩn thông báo sau 3 giây
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Update profile error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Cập nhật thất bại. Vui lòng thử lại.';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Kiểm tra file type
    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file ảnh hợp lệ');
      return;
    }

    // Kiểm tra file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Kích thước file không được vượt quá 5MB');
      return;
    }

    setError('');
    setSuccess('');
    setUploadingAvatar(true);

    try {
      const response = await authAPI.uploadAvatar(file);
      
      // Cập nhật state với dữ liệu mới
      if (response.user) {
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
      }
      if (response.student) {
        setStudent(response.student);
      }
      
      setSuccess(response.message || 'Cập nhật avatar thành công!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Upload avatar error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Upload avatar thất bại. Vui lòng thử lại.';
      setError(errorMessage);
    } finally {
      setUploadingAvatar(false);
      // Reset input để có thể chọn lại file cùng tên
      e.target.value = '';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa cập nhật';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // Nếu là string date format "YYYY-MM-DD"
        if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [year, month, day] = dateString.split('-');
          return `${day}/${month}/${year}`;
        }
        return dateString; // Trả về nguyên bản nếu không parse được
      }
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString || 'Chưa cập nhật';
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary-custom" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-secondary">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  const isProfilePage = location.pathname === '/student/profile';

  return (
    <div className="d-flex w-100 overflow-hidden">
      {/* --- Sidebar --- */}
      <aside className="sidebar-wrapper d-flex flex-column flex-shrink-0 p-4 d-none d-lg-flex">
        <div className="d-flex align-items-center gap-2 px-2 mb-5">
          <span className="material-symbols-outlined text-primary-custom fs-2">task_alt</span>
          <h2 className="h4 fw-bold m-0 text-dark">LabHub</h2>
        </div>

        <div className="mb-4">
          <div className="d-flex align-items-center gap-3 mb-4">
            <div 
              className="avatar bg-light d-flex align-items-center justify-content-center"
              style={{ 
                backgroundImage: user?.image 
                  ? `url("${user.image}")` 
                  : 'none',
                backgroundColor: user?.image ? 'transparent' : '#e2e8f0',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {!user?.image && (
                <span className="material-symbols-outlined text-secondary" style={{ fontSize: '24px' }}>person</span>
              )}
            </div>
            <div>
              <h1 className="h6 fw-bold mb-0 text-dark">{user?.fullName || 'Student'}</h1>
              <small className="text-secondary">
                {student?.studentCode ? `MSSV: ${student.studentCode}` : user?.email || ''}
              </small>
            </div>
          </div>

          <nav className="d-flex flex-column gap-2">
            <button 
              onClick={() => navigate('/student')}
              className={`nav-link-custom ${!isProfilePage ? 'active' : ''}`}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: !isProfilePage ? "'FILL' 1" : "'FILL' 0" }}>dashboard</span>
              Bảng điều khiển
            </button>
            <button className="nav-link-custom">
              <span className="material-symbols-outlined">history</span>
              Lịch sử điểm danh
            </button>
            <button 
              onClick={() => navigate('/student/profile')}
              className={`nav-link-custom ${isProfilePage ? 'active' : ''}`}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: isProfilePage ? "'FILL' 1" : "'FILL' 0" }}>person</span>
              Hồ sơ
            </button>
          </nav>
        </div>

        <div className="mt-auto d-flex flex-column gap-3">
          <button className="nav-link-custom">
            <span className="material-symbols-outlined">settings</span>
            Cài đặt
          </button>
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
      <main className="flex-grow-1 p-4 p-lg-5" style={{ backgroundColor: '#f6f7f8' }}>
        <Container fluid="lg">
          {/* Header */}
          <div className="mb-4 mb-lg-5">
            <h1 className="display-6 fw-bold text-dark mb-2">Hồ sơ cá nhân</h1>
            <p className="text-secondary">Quản lý thông tin cá nhân và tài khoản của bạn.</p>
          </div>

          {/* Alert Messages */}
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert variant="success" dismissible onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}

          <Row className="g-4">
            {/* Profile Card */}
            <Col lg={4}>
              <Card className="profile-card custom-card border-0">
                <Card.Body className="p-4 text-center">
                  <div className="profile-avatar-wrapper mb-4">
                    <div 
                      className="profile-avatar mx-auto"
                      style={{ 
                        backgroundImage: user?.image 
                          ? `url("${user.image}")` 
                          : 'none',
                        backgroundColor: user?.image ? 'transparent' : '#e2e8f0',
                        opacity: uploadingAvatar ? 0.6 : 1,
                      }}
                    >
                      {!user?.image && (
                        <span className="material-symbols-outlined text-secondary" style={{ fontSize: '64px' }}>person</span>
                      )}
                      {uploadingAvatar && (
                        <div className="position-absolute top-50 start-50 translate-middle">
                          <div className="spinner-border text-primary-custom" role="status">
                            <span className="visually-hidden">Uploading...</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <label 
                      htmlFor="avatar-upload" 
                      className="btn-edit-avatar"
                      style={{ cursor: uploadingAvatar ? 'not-allowed' : 'pointer', pointerEvents: uploadingAvatar ? 'none' : 'auto' }}
                    >
                      <span className="material-symbols-outlined">camera_alt</span>
                    </label>
                    <input
                      type="file"
                      id="avatar-upload"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      style={{ display: 'none' }}
                      disabled={uploadingAvatar}
                    />
                  </div>
                  <h3 className="h4 fw-bold text-dark mb-1">{user?.fullName || 'Student'}</h3>
                  <p className="text-secondary mb-3">{user?.email || ''}</p>
                  <div className="d-flex align-items-center justify-content-center gap-2 mb-3">
                    <span className={`badge ${user?.status === 'active' ? 'bg-success' : 'bg-secondary'} px-3 py-2`}>
                      {user?.status === 'active' ? 'Đang hoạt động' : 'Không hoạt động'}
                    </span>
                  </div>
                  <Button 
                    variant="outline-primary" 
                    className="w-100 mt-3"
                    onClick={isEditing ? handleCancel : handleEdit}
                    disabled={saving}
                  >
                    <span className="material-symbols-outlined me-2" style={{ verticalAlign: 'middle', fontSize: '20px' }}>
                      {isEditing ? 'close' : 'edit'}
                    </span>
                    {isEditing ? 'Hủy' : 'Chỉnh sửa hồ sơ'}
                  </Button>
                </Card.Body>
              </Card>
            </Col>

            {/* Information Cards */}
            <Col lg={8}>
              <Row className="g-4">
                {/* Thông tin cá nhân */}
                <Col md={12}>
                  <Card className="custom-card border-0">
                    <Card.Header className="bg-white border-0 pb-0 pt-4 px-4">
                      <h4 className="h5 fw-bold text-dark mb-0">
                        <span className="material-symbols-outlined me-2 text-primary-custom" style={{ verticalAlign: 'middle', fontSize: '24px' }}>person</span>
                        Thông tin cá nhân
                      </h4>
                    </Card.Header>
                    <Card.Body className="p-4">
                      {isEditing ? (
                        <Form onSubmit={handleSubmit}>
                          <Row className="g-3">
                            <Col md={6}>
                              <Form.Group>
                                <Form.Label className="info-label">Họ và tên *</Form.Label>
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
                                <Form.Label className="info-label">Email</Form.Label>
                                <Form.Control
                                  type="email"
                                  value={user?.email || ''}
                                  disabled
                                  className="custom-input bg-light"
                                />
                                <Form.Text className="text-muted">Email không thể thay đổi</Form.Text>
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group>
                                <Form.Label className="info-label">Số điện thoại</Form.Label>
                                <Form.Control
                                  type="tel"
                                  name="phoneNumber"
                                  value={formData.phoneNumber}
                                  onChange={handleInputChange}
                                  placeholder="Nhập số điện thoại"
                                  className="custom-input"
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group>
                                <Form.Label className="info-label">Mã số sinh viên</Form.Label>
                                <Form.Control
                                  type="text"
                                  value={student?.studentCode || ''}
                                  disabled
                                  className="custom-input bg-light"
                                />
                                <Form.Text className="text-muted">MSSV không thể thay đổi</Form.Text>
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group>
                                <Form.Label className="info-label">Ngày sinh</Form.Label>
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
                                <Form.Label className="info-label">Giới tính</Form.Label>
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
                            <Col md={6}>
                              <Form.Group>
                                <Form.Label className="info-label">Lớp</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="className"
                                  value={formData.className}
                                  onChange={handleInputChange}
                                  placeholder="Nhập tên lớp"
                                  className="custom-input"
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group>
                                <Form.Label className="info-label">Chuyên ngành</Form.Label>
                                <Form.Control
                                  type="text"
                                  value={
                                    typeof student?.major === 'object' && student.major.name 
                                      ? student.major.name 
                                      : typeof student?.major === 'string' 
                                        ? student.major 
                                        : 'Chưa cập nhật'
                                  }
                                  disabled
                                  className="custom-input bg-light"
                                />
                                <Form.Text className="text-muted">Chuyên ngành không thể thay đổi</Form.Text>
                              </Form.Group>
                            </Col>
                            <Col md={12}>
                              <Form.Group>
                                <Form.Label className="info-label">Địa chỉ</Form.Label>
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
                                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
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
                              <p className="info-value">{user?.fullName || 'Chưa cập nhật'}</p>
                            </div>
                          </Col>
                          <Col md={6}>
                            <div className="info-item">
                              <label className="info-label">Email</label>
                              <p className="info-value">{user?.email || 'Chưa cập nhật'}</p>
                            </div>
                          </Col>
                          <Col md={6}>
                            <div className="info-item">
                              <label className="info-label">Số điện thoại</label>
                              <p className="info-value">{user?.phoneNumber || student?.phoneNumber || 'Chưa cập nhật'}</p>
                            </div>
                          </Col>
                          <Col md={6}>
                            <div className="info-item">
                              <label className="info-label">Mã số sinh viên</label>
                              <p className="info-value">{student?.studentCode || 'Chưa cập nhật'}</p>
                            </div>
                          </Col>
                          {student?.dateOfBirth && (
                            <Col md={6}>
                              <div className="info-item">
                                <label className="info-label">Ngày sinh</label>
                                <p className="info-value">{formatDate(student.dateOfBirth)}</p>
                              </div>
                            </Col>
                          )}
                          {student?.gender && (
                            <Col md={6}>
                              <div className="info-item">
                                <label className="info-label">Giới tính</label>
                                <p className="info-value">
                                  {student.gender === 'male' ? 'Nam' : student.gender === 'female' ? 'Nữ' : 'Khác'}
                                </p>
                              </div>
                            </Col>
                          )}
                          {student?.className && (
                            <Col md={6}>
                              <div className="info-item">
                                <label className="info-label">Lớp</label>
                                <p className="info-value">{student.className}</p>
                              </div>
                            </Col>
                          )}
                          {student?.major && (
                            <Col md={6}>
                              <div className="info-item">
                                <label className="info-label">Chuyên ngành</label>
                                <p className="info-value">
                                  {typeof student.major === 'object' && student.major.name 
                                    ? student.major.name 
                                    : typeof student.major === 'string' 
                                      ? student.major 
                                      : 'Chưa cập nhật'}
                                </p>
                                {typeof student.major === 'object' && student.major.description && (
                                  <small className="text-secondary d-block mt-1">{student.major.description}</small>
                                )}
                              </div>
                            </Col>
                          )}
                          {student?.startDate && (
                            <Col md={6}>
                              <div className="info-item">
                                <label className="info-label">Ngày bắt đầu</label>
                                <p className="info-value">{formatDate(student.startDate)}</p>
                              </div>
                            </Col>
                          )}
                          {student?.address && (
                            <Col md={12}>
                              <div className="info-item">
                                <label className="info-label">Địa chỉ</label>
                                <p className="info-value">{student.address}</p>
                              </div>
                            </Col>
                          )}
                        </Row>
                      )}
                    </Card.Body>
                  </Card>
                </Col>

                {/* Thông tin Lab */}
                {student?.lab && (
                  <Col md={12}>
                    <Card className="custom-card border-0">
                      <Card.Header className="bg-white border-0 pb-0 pt-4 px-4">
                        <h4 className="h5 fw-bold text-dark mb-0">
                          <span className="material-symbols-outlined me-2 text-primary-custom" style={{ verticalAlign: 'middle', fontSize: '24px' }}>science</span>
                          Thông tin Lab
                        </h4>
                      </Card.Header>
                      <Card.Body className="p-4">
                        <Row className="g-3">
                          <Col md={6}>
                            <div className="info-item">
                              <label className="info-label">Tên Lab</label>
                              <p className="info-value">
                                {typeof student.lab === 'object' ? student.lab.name : 'Chưa cập nhật'}
                              </p>
                            </div>
                          </Col>
                          <Col md={6}>
                            <div className="info-item">
                              <label className="info-label">Mã Lab</label>
                              <p className="info-value">
                                {typeof student.lab === 'object' ? student.lab.code : 'Chưa cập nhật'}
                              </p>
                            </div>
                          </Col>
                          <Col md={6}>
                            <div className="info-item">
                              <label className="info-label">Trạng thái</label>
                              <p className="info-value">
                                <span className={`badge ${
                                  student.labStatus === 'approved' ? 'bg-success' :
                                  student.labStatus === 'pending' ? 'bg-warning' :
                                  student.labStatus === 'rejected' ? 'bg-danger' :
                                  'bg-secondary'
                                } px-3 py-2`}>
                                  {student.labStatus === 'approved' ? 'Đã duyệt' :
                                   student.labStatus === 'pending' ? 'Đang chờ' :
                                   student.labStatus === 'rejected' ? 'Từ chối' :
                                   'Chưa tham gia'}
                                </span>
                              </p>
                            </div>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  </Col>
                )}

                {/* Thông tin tài khoản */}
                <Col md={12}>
                  <Card className="custom-card border-0">
                    <Card.Header className="bg-white border-0 pb-0 pt-4 px-4">
                      <h4 className="h5 fw-bold text-dark mb-0">
                        <span className="material-symbols-outlined me-2 text-primary-custom" style={{ verticalAlign: 'middle', fontSize: '24px' }}>account_circle</span>
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
                                {user?.role === 'student' ? 'Sinh viên' : 
                                 user?.role === 'admin' ? 'Quản trị viên' : 
                                 user?.role === 'mentor' ? 'Mentor' : 'Chưa xác định'}
                              </span>
                            </p>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="info-item">
                            <label className="info-label">Ngày tạo tài khoản</label>
                            <p className="info-value">{formatDate(user?.createdAt)}</p>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="info-item">
                            <label className="info-label">Cập nhật lần cuối</label>
                            <p className="info-value">{formatDate(user?.updatedAt)}</p>
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
      </main>
    </div>
  );
};

export default StudentProfile;

