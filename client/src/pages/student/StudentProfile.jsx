import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Form, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getAccessToken, clearStorage } from '../../utils/storage';
import authApi from '../../api/authApi';
import './StudentProfile.css';

const StudentProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'password'
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  });
  const fileInputRef = React.useRef(null);

  useEffect(() => {
    // Lấy token từ localStorage
    const token = getAccessToken();
    if (!token) {
      navigate('/login');
      return;
    }

    // Lấy user ID từ localStorage
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    if (!userInfo._id) {
      navigate('/login');
      return;
    }

    // Lấy thông tin chi tiết từ backend
    const fetchUserProfile = async () => {
      try {
        const response = await authApi.getUserProfile(userInfo._id);
        setUser(response.data);
        setFormData(response.data);
      } catch (error) {
        console.error('Lỗi khi lấy thông tin hồ sơ:', error);
        // Fallback to localStorage if API fails
        setUser(userInfo);
        setFormData(userInfo);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      
      // Create clean data object without undefined values
      const cleanData = {};
      Object.keys(formData).forEach(key => {
        if (formData[key] !== undefined && formData[key] !== null) {
          cleanData[key] = formData[key];
        }
      });
      
      const response = await authApi.updateUserProfile(userInfo._id, cleanData);
      setUser(response.data);
      setFormData(response.data);
      setIsEditing(false);
      
      // Cập nhật localStorage với thông tin mới
      localStorage.setItem('userInfo', JSON.stringify(response.data));
      
      toast.success('Cập nhật hồ sơ thành công!');
    } catch (error) {
      console.error('Lỗi khi cập nhật hồ sơ:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật hồ sơ');
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh không được vượt quá 5MB');
      return;
    }

    try {
      // Show preview with base64 immediately
      const reader = new FileReader();
      reader.onload = (event) => {
        const preview = event.target?.result;
        setUser(prev => ({
          ...prev,
          image: preview
        }));
      };
      reader.readAsDataURL(file);

      // Upload file to backend
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      const formDataToSend = new FormData();
      formDataToSend.append('image', file);

      try {
        const response = await authApi.updateUserProfile(userInfo._id, formDataToSend);
        setUser(response.data);
        setFormData(response.data);
        
        // Update localStorage with the response data (not with base64)
        localStorage.setItem('userInfo', JSON.stringify(response.data));
        
        toast.success('Cập nhật ảnh đại diện thành công!');
      } catch (error) {
        console.error('Lỗi khi cập nhật ảnh:', error);
        toast.error(error.response?.data?.message || 'Lỗi khi cập nhật ảnh');
      }
    } catch (error) {
      console.error('Lỗi khi xử lý ảnh:', error);
      toast.error('Lỗi khi xử lý ảnh');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLogout = () => {
    clearStorage();
    navigate('/login');
    toast.success('Đã đăng xuất');
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleChangePassword = async () => {
    // Validate
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Vui lòng điền tất cả các trường');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Mật khẩu mới không khớp');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      await authApi.changePassword(userInfo._id, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      toast.success('Thay đổi mật khẩu thành công!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setActiveTab('profile');
    } catch (error) {
      console.error('Lỗi khi thay đổi mật khẩu:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi thay đổi mật khẩu');
    }
  };

  if (loading) return <div className="p-5 text-center">Đang tải...</div>;

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
              className="avatar bg-light"
              style={{ backgroundImage: `url("${user?.image || 'https://via.placeholder.com/50'}")` }}
            ></div>
            <div>
              <h1 className="h6 fw-bold mb-0 text-dark">{user?.fullName || 'Student'}</h1>
              <small className="text-secondary">MSSV: {user?.studentId || 'N/A'}</small>
            </div>
          </div>

          <nav className="d-flex flex-column gap-2">
            <a href="/student" className="nav-link-custom">
              <span className="material-symbols-outlined">dashboard</span>
              Bảng điều khiển
            </a>
            <a href="#" className="nav-link-custom">
              <span className="material-symbols-outlined">history</span>
              Lịch sử điểm danh
            </a>
            <a href="/student/profile" className="nav-link-custom active">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
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
      <main className="flex-grow-1 p-4 p-lg-5" style={{ backgroundColor: '#f6f7f8' }}>
        <Container fluid="lg">
          {/* Header */}
          <div className="mb-4 mb-lg-5">
            <h1 className="display-6 fw-bold text-dark mb-2">Hồ sơ cá nhân</h1>
            <p className="text-secondary">Quản lý thông tin cá nhân của bạn</p>
          </div>

          <Row className="g-4">
            {/* Avatar Card */}
            <Col lg={4}>
              <Card className="custom-card p-4 text-center">
                <div 
                  className="rounded-circle mx-auto mb-3"
                  onClick={handleAvatarClick}
                  style={{
                    width: '150px',
                    height: '150px',
                    backgroundImage: `url("${user?.image || 'https://via.placeholder.com/150'}")`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    cursor: 'pointer',
                    transition: 'opacity 0.3s ease',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  title="Click để đổi ảnh đại diện"
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      color: 'white',
                      textAlign: 'center',
                      opacity: '0',
                      transition: 'opacity 0.3s ease',
                      pointerEvents: 'none'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                    className="camera-icon"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>camera_alt</span>
                  </div>
                </div>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />

                <h3 className="h5 fw-bold text-dark">{user?.fullName}</h3>
                <p className="text-secondary small mb-3">{user?.email}</p>
                <p className="text-secondary small">
                  <strong>MSSV:</strong> {user?.studentId}
                </p>
                <p className="text-secondary small">
                  <strong>Khoa:</strong> {user?.department}
                </p>
              </Card>
            </Col>

            {/* Profile Form */}
            <Col lg={8}>
              <Card className="custom-card p-4">
                {/* Tabs */}
                <div className="d-flex gap-3 mb-4 border-bottom pb-3">
                  <Button
                    variant={activeTab === 'profile' ? 'primary' : 'light'}
                    size="sm"
                    onClick={() => setActiveTab('profile')}
                    className={activeTab === 'profile' ? 'bg-primary-custom border-0' : 'text-secondary'}
                  >
                    Thông tin cá nhân
                  </Button>
                  <Button
                    variant={activeTab === 'password' ? 'primary' : 'light'}
                    size="sm"
                    onClick={() => setActiveTab('password')}
                    className={activeTab === 'password' ? 'bg-primary-custom border-0' : 'text-secondary'}
                  >
                    Thay đổi mật khẩu
                  </Button>
                </div>

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h4 className="fw-bold text-dark mb-0">Thông tin chi tiết</h4>
                  <Button 
                    variant={isEditing ? "danger" : "primary"}
                    size="sm"
                    onClick={() => {
                      if (isEditing) {
                        setFormData(user);
                      }
                      setIsEditing(!isEditing);
                    }}
                    className="bg-primary-custom border-0"
                  >
                    {isEditing ? 'Hủy' : 'Chỉnh sửa'}
                  </Button>
                </div>

                <Form>
                  <Row className="mb-3">
                    <Form.Group className="col-md-6">
                      <Form.Label className="fw-bold text-dark">Họ và tên</Form.Label>
                      <Form.Control
                        type="text"
                        name="fullName"
                        value={formData.fullName || ''}
                        onChange={handleChange}
                        disabled={!isEditing}
                      />
                    </Form.Group>
                    <Form.Group className="col-md-6">
                      <Form.Label className="fw-bold text-dark">Email</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email || ''}
                        onChange={handleChange}
                        disabled={true}
                      />
                    </Form.Group>
                  </Row>

                  <Row className="mb-3">
                    <Form.Group className="col-md-6">
                      <Form.Label className="fw-bold text-dark">MSSV</Form.Label>
                      <Form.Control
                        type="text"
                        name="studentId"
                        value={formData.studentId || ''}
                        onChange={handleChange}
                        disabled={true}
                      />
                    </Form.Group>
                    <Form.Group className="col-md-6">
                      <Form.Label className="fw-bold text-dark">Khoa</Form.Label>
                      <Form.Control
                        type="text"
                        name="department"
                        value={formData.department || ''}
                        onChange={handleChange}
                        disabled={true}
                      />
                    </Form.Group>
                  </Row>

                  <Row className="mb-3">
                    <Form.Group className="col-md-6">
                      <Form.Label className="fw-bold text-dark">Ngày sinh</Form.Label>
                      <Form.Control
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString().split('T')[0] : ''}
                        onChange={handleChange}
                        disabled={!isEditing}
                      />
                    </Form.Group>
                    <Form.Group className="col-md-6">
                      <Form.Label className="fw-bold text-dark">Giới tính</Form.Label>
                      <Form.Select
                        name="gender"
                        value={formData.gender || ''}
                        onChange={handleChange}
                        disabled={!isEditing}
                      >
                        <option value="">Chọn giới tính</option>
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                        <option value="other">Khác</option>
                      </Form.Select>
                    </Form.Group>
                  </Row>

                  <Row className="mb-3">
                    <Form.Group className="col-md-6">
                      <Form.Label className="fw-bold text-dark">Số điện thoại</Form.Label>
                      <Form.Control
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber || ''}
                        onChange={handleChange}
                        disabled={!isEditing}
                      />
                    </Form.Group>
                    <Form.Group className="col-md-6">
                      <Form.Label className="fw-bold text-dark">Địa chỉ</Form.Label>
                      <Form.Control
                        type="text"
                        name="address"
                        value={formData.address || ''}
                        onChange={handleChange}
                        disabled={!isEditing}
                      />
                    </Form.Group>
                  </Row>

                  <hr />

                  <h5 className="fw-bold text-dark mb-3">Thông tin liên hệ khẩn cấp</h5>

                  <Row className="mb-3">
                    <Form.Group className="col-md-6">
                      <Form.Label className="fw-bold text-dark">Tên</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.emergencyContact?.name || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          emergencyContact: { ...prev.emergencyContact, name: e.target.value }
                        }))}
                        disabled={!isEditing}
                      />
                    </Form.Group>
                    <Form.Group className="col-md-6">
                      <Form.Label className="fw-bold text-dark">Mối quan hệ</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.emergencyContact?.relationship || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          emergencyContact: { ...prev.emergencyContact, relationship: e.target.value }
                        }))}
                        disabled={!isEditing}
                      />
                    </Form.Group>
                  </Row>

                  <Row className="mb-3">
                    <Form.Group className="col-md-6">
                      <Form.Label className="fw-bold text-dark">Số điện thoại</Form.Label>
                      <Form.Control
                        type="tel"
                        value={formData.emergencyContact?.phoneNumber || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          emergencyContact: { ...prev.emergencyContact, phoneNumber: e.target.value }
                        }))}
                        disabled={!isEditing}
                      />
                    </Form.Group>
                  </Row>

                  {isEditing && (
                    <div className="d-flex gap-2 mt-4">
                      <Button 
                        variant="primary"
                        className="bg-primary-custom border-0"
                        onClick={handleSave}
                      >
                        Lưu thay đổi
                      </Button>
                      <Button 
                        variant="secondary"
                        onClick={() => {
                          setFormData(user);
                          setIsEditing(false);
                        }}
                      >
                        Hủy
                      </Button>
                    </div>
                  )}
                </Form>
                  </>
                )}

                {/* Password Tab */}
                {activeTab === 'password' && (
                  <div>
                    <h4 className="fw-bold text-dark mb-4">Thay đổi mật khẩu</h4>
                    <Form>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-bold text-dark">Mật khẩu hiện tại</Form.Label>
                        <div className="input-group">
                          <Form.Control
                            type={showPasswords.currentPassword ? 'text' : 'password'}
                            name="currentPassword"
                            value={passwordData.currentPassword}
                            onChange={handlePasswordChange}
                            placeholder="Nhập mật khẩu hiện tại"
                          />
                          <Button
                            variant="outline-secondary"
                            onClick={() => setShowPasswords(prev => ({
                              ...prev,
                              currentPassword: !prev.currentPassword
                            }))}
                            style={{ borderColor: '#dee2e6' }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                              {showPasswords.currentPassword ? 'visibility_off' : 'visibility'}
                            </span>
                          </Button>
                        </div>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label className="fw-bold text-dark">Mật khẩu mới</Form.Label>
                        <div className="input-group">
                          <Form.Control
                            type={showPasswords.newPassword ? 'text' : 'password'}
                            name="newPassword"
                            value={passwordData.newPassword}
                            onChange={handlePasswordChange}
                            placeholder="Nhập mật khẩu mới"
                          />
                          <Button
                            variant="outline-secondary"
                            onClick={() => setShowPasswords(prev => ({
                              ...prev,
                              newPassword: !prev.newPassword
                            }))}
                            style={{ borderColor: '#dee2e6' }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                              {showPasswords.newPassword ? 'visibility_off' : 'visibility'}
                            </span>
                          </Button>
                        </div>
                      </Form.Group>

                      <Form.Group className="mb-4">
                        <Form.Label className="fw-bold text-dark">Xác nhận mật khẩu mới</Form.Label>
                        <div className="input-group">
                          <Form.Control
                            type={showPasswords.confirmPassword ? 'text' : 'password'}
                            name="confirmPassword"
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordChange}
                            placeholder="Xác nhận mật khẩu mới"
                          />
                          <Button
                            variant="outline-secondary"
                            onClick={() => setShowPasswords(prev => ({
                              ...prev,
                              confirmPassword: !prev.confirmPassword
                            }))}
                            style={{ borderColor: '#dee2e6' }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                              {showPasswords.confirmPassword ? 'visibility_off' : 'visibility'}
                            </span>
                          </Button>
                        </div>
                      </Form.Group>

                      <div className="d-flex gap-2">
                        <Button 
                          variant="primary"
                          className="bg-primary-custom border-0"
                          onClick={handleChangePassword}
                        >
                          Thay đổi mật khẩu
                        </Button>
                        <Button 
                          variant="secondary"
                          onClick={() => setPasswordData({
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: ''
                          })}
                        >
                          Hủy
                        </Button>
                      </div>
                    </Form>
                  </div>
                )}
              </Card>
            </Col>
          </Row>
        </Container>
      </main>
    </div>
  );
};



export default StudentProfile;