import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import './Login.css';
import authApi from '../../api/authApi';
import { setAccessToken, setRefreshToken } from '../../utils/storage';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Vui lòng cung cấp email và mật khẩu');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.login({ email, password });
      const { 
        jwt, 
        refreshToken, 
        role, 
        _id, 
        fullName, 
        studentId, 
        department, 
        image,
        dateOfBirth,
        gender,
        phoneNumber,
        address,
        emergencyContact
      } = response.data;

      // Lưu tokens vào localStorage
      setAccessToken(jwt);
      setRefreshToken(refreshToken);

      // Lưu user info vào localStorage
      const userInfo = {
        _id,
        email,
        fullName,
        role,
        studentId,
        department,
        image,
        dateOfBirth,
        gender,
        phoneNumber,
        address,
        emergencyContact
      };
      localStorage.setItem('userInfo', JSON.stringify(userInfo));

      toast.success('Đăng nhập thành công!');

      // Điều hướng dựa trên role
      if (role === 'admin') {
        navigate('/admin');
      } else if (role === 'mentor') {
        navigate('/mentor');
      } else {
        navigate('/student');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Đăng nhập thất bại';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-white">
      <Row className="g-0 flex-grow-1">
        
        {/* --- Left Side: Login Form --- */}
        <Col lg={6} className="d-flex flex-column justify-content-center align-items-center p-4 p-lg-5 bg-white">
          <div className="w-100" style={{ maxWidth: '448px' }}>
            
            {/* Header */}
            <div className="d-flex flex-column gap-2 mb-4">
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary-custom" style={{ fontSize: '36px' }}>science</span>
                <span className="h4 fw-bold text-dark m-0">LabHub</span>
              </div>
              <h1 className="fw-bold text-dark mb-1 display-6" style={{ fontSize: '32px' }}>Chào mừng trở lại</h1>
              <p className="text-secondary m-0">Đăng nhập vào hệ thống quản lý của lab.</p>
            </div>

            {/* Form */}
            <Form className="d-flex flex-column gap-4" onSubmit={handleSubmit}>
              {/* Email Field */}
              <Form.Group>
                <Form.Label className="fw-medium text-dark">Email</Form.Label>
                <div className="custom-input-group d-flex align-items-center">
                  <span className="material-symbols-outlined input-group-text">mail</span>
                  <Form.Control 
                    type="email" 
                    placeholder="Nhập email của bạn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </Form.Group>

              {/* Password Field */}
              <Form.Group>
                <Form.Label className="fw-medium text-dark">Mật khẩu</Form.Label>
                <div className="custom-input-group d-flex align-items-center">
                  <span className="material-symbols-outlined input-group-text">lock</span>
                  <Form.Control 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Nhập mật khẩu của bạn"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                  <button 
                    type="button" 
                    className="btn-toggle pe-3" 
                    onClick={togglePassword}
                    aria-label="Toggle password visibility"
                    disabled={loading}
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </Form.Group>

              {/* Options */}
              <div className="d-flex justify-content-between align-items-center">
                <Form.Check 
                  type="checkbox"
                  id="remember-me"
                  label="Ghi nhớ đăng nhập"
                  className="text-sm fw-medium"
                  disabled={loading}
                />
                <a href="#" className="text-primary-custom text-decoration-underline fw-medium small">
                  Quên mật khẩu?
                </a>
              </div>

              {/* Submit Button */}
              <Button 
                variant="primary" 
                className="bg-primary-custom w-100 py-3 fw-medium"
                style={{ height: '56px', borderRadius: '0.5rem' }}
                type="submit"
                disabled={loading}
              >
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </Button>
            </Form>

            {/* Divider */}
            {/* <div className="d-flex align-items-center py-4">
              <div className="flex-grow-1 border-top"></div>
              <span className="mx-3 text-secondary small">Hoặc đăng nhập với</span>
              <div className="flex-grow-1 border-top"></div>
            </div> */}

            {/* Social Login */}
            {/* <Row className="g-3">
              <Col xs={6}>
                <Button variant="light" className="btn-social w-100" disabled={loading}>
                  <svg className="h-5 w-5" style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24">
                    <g clipPath="url(#clip0_3033_244)">
                      <path d="M22.0002 12.2727C22.0002 11.4545 21.9275 10.6364 21.782 9.81818H12.0002V14.4545H17.7275C17.5002 15.8182 16.7275 16.9773 15.5457 17.7273V20.2727H19.0911C20.9275 18.5795 22.0002 15.6818 22.0002 12.2727Z" fill="#4285F4"/>
                      <path d="M12 22C14.9091 22 17.3864 21.0455 19.0909 19.4545L15.5455 16.9091C14.5455 17.6136 13.3636 18 12 18C9.45455 18 7.27273 16.3182 6.54545 14.0909H2.86364V16.6364C4.54545 19.8636 8.00001 22 12 22Z" fill="#34A853"/>
                      <path d="M6.45455 14.0909C6.22727 13.3864 6.09091 12.6364 6.09091 11.8182C6.09091 11 6.22727 10.25 6.45455 9.54545V7H2.86364C2.31818 8.5 2 10.1364 2 11.8182C2 13.5 2.31818 15.1364 2.86364 16.6364L6.45455 14.0909Z" fill="#FBBC05"/>
                      <path d="M12 6.00001C13.4545 6.00001 14.7273 6.54546 15.7273 7.45455L19.1818 4.00001C17.3864 2.27273 14.9091 1.22728 12 1.22728C8.00001 1.22728 4.54545 3.45455 2.86364 6.68182L6.54545 9.22728C7.27273 6.90909 9.45455 5.22728 12 5.22728V6.00001Z" fill="#EA4335"/>
                    </g>
                    <defs>
                      <clipPath id="clip0_3033_244"><rect fill="white" height="20" transform="translate(2 2)" width="20"/></clipPath>
                    </defs>
                  </svg>
                  Google
                </Button>
              </Col>
              <Col xs={6}>
                <Button variant="light" className="btn-social w-100" disabled={loading}>
                  <svg className="h-5 w-5" style={{ width: '20px', height: '20px' }} fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 1.25C5.504 1.25 0.25 6.504 0.25 13C0.25 18.254 3.796 22.618 8.656 23.684C9.281 23.798 9.52 23.414 9.52 23.088C9.52 22.792 9.508 21.936 9.502 20.84C6.276 21.574 5.52 19.336 5.52 19.336C4.954 17.892 4.094 17.498 4.094 17.498C2.96 16.704 4.184 16.716 4.184 16.716C5.438 16.804 6.074 18.006 6.074 18.006C7.19 19.894 8.99 19.346 9.554 19.068C9.664 18.272 9.982 17.744 10.334 17.44C7.526 17.126 4.582 16.01 4.582 11.354C4.582 10.038 5.066 8.956 5.846 8.118C5.724 7.804 5.306 6.51 5.966 4.81C5.966 4.81 7.022 4.464 9.5 6.11C10.514 5.826 11.594 5.684 12.674 5.68C13.754 5.684 14.834 5.826 15.848 6.11C18.326 4.464 19.382 4.81 19.382 4.81C20.042 6.51 19.624 7.804 19.502 8.118C20.282 8.956 20.766 10.038 20.766 11.354C20.766 16.022 17.822 17.126 15.002 17.44C15.424 17.81 15.824 18.574 15.824 19.728C15.824 21.436 15.81 22.84 15.81 23.182C15.81 23.512 16.046 23.89 16.682 23.776C21.538 22.614 25.08 18.252 25.08 13C25.08 6.504 19.826 1.25 13.33 1.25H12Z" transform="translate(-1 -1) scale(0.96)"/>
                  </svg>
                  GitHub
                </Button>
              </Col>
            </Row> */}
          </div>
        </Col>

        {/* --- Right Side: Hero Image (Hidden on mobile) --- */}
        <Col lg={6} className="d-none d-lg-flex hero-section align-items-center justify-content-center p-5">
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAHrYA-JbjG4qPmzA_osWfbIQDRi42DEh_pchFoqry2W0w1CyNu3CLumo2831UO8ZG_tCO_tdC2_16aAh9hXv9WTtEh12bd4zuJRyfmYSW-VK8ZrlFJMpPU5RlSiipImlOQMLm3LrhoOG4t-k2ovdIR1NJGMAKIyrTc6weYf9hkHFYYybUCapCDt7ZZ-1AkIGvtUjuPFOC6C-ddok3ecH9d8tKXDCVtluONbnYh-5N2D64uoigF4TVZChaiRQfINT85iBsgbPHue6o" 
            alt="Students collaborating" 
            className="hero-bg"
          />
          <div className="hero-overlay"></div>
          
          <div className="hero-content text-white text-center" style={{ maxWidth: '480px' }}>
            <h2 className="fw-bold mb-3 display-5">Nơi ý tưởng cất cánh.</h2>
            <p className="fs-5 text-light opacity-75">
              Tham gia cộng đồng của chúng tôi để quản lý, học hỏi và phát triển cùng nhau trong môi trường lab năng động và sáng tạo.
            </p>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default Login;