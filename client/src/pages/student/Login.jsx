import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, InputGroup } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import '../../components/css/Login.css';
import authApi from '../../api/authApi';
import {
  setAccessToken,
  setRefreshToken,
  setUserInfo,
} from '../../utils/storage';

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
        emergencyContact,
      } = response.data;

      // Lưu tokens vào localStorage
      setAccessToken(jwt);
      setRefreshToken(refreshToken);

      // Lưu user info vào localStorage
      // const userInfo = {
      //   _id,
      //   email,
      //   fullName,
      //   role,
      //   studentId,
      //   department,
      //   image,
      //   dateOfBirth,
      //   gender,
      //   phoneNumber,
      //   address,
      //   emergencyContact
      // };
      // localStorage.setItem('userInfo', JSON.stringify(userInfo));

      setUserInfo({
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
        emergencyContact,
      });

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
      const errorMessage =
        err.response?.data?.message || err.message || 'Đăng nhập thất bại';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='d-flex flex-column min-vh-100 bg-white'>
      <Row className='g-0 flex-grow-1'>
        {/* --- Left Side: Login Form --- */}
        <Col
          lg={6}
          className='d-flex flex-column justify-content-center align-items-center p-4 p-lg-5 bg-white'
        >
          <div className='w-100' style={{ maxWidth: '448px' }}>
            {/* Header */}
            <div className='d-flex flex-column gap-2 mb-4'>
              <div className='d-flex align-items-center gap-2 mb-2'>
                <span
                  className='material-symbols-outlined text-primary-custom'
                  style={{ fontSize: '36px' }}
                >
                  science
                </span>
                <span className='h4 fw-bold text-dark m-0'>LabHub</span>
              </div>
              <h1
                className='fw-bold text-dark mb-1 display-6'
                style={{ fontSize: '32px' }}
              >
                Chào mừng trở lại
              </h1>
              <p className='text-secondary m-0'>
                Đăng nhập vào hệ thống quản lý của lab.
              </p>
            </div>

            {/* Form */}
            <Form className='d-flex flex-column gap-4' onSubmit={handleSubmit}>
              {/* Email Field */}
              <Form.Group>
                <Form.Label className='fw-medium text-dark'>Email</Form.Label>
                <div className='custom-input-group d-flex align-items-center'>
                  <span className='material-symbols-outlined input-group-text'>
                    mail
                  </span>
                  <Form.Control
                    type='email'
                    placeholder='Nhập email của bạn'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </Form.Group>

              {/* Password Field */}
              <Form.Group>
                <Form.Label className='fw-medium text-dark'>
                  Mật khẩu
                </Form.Label>
                <div className='custom-input-group d-flex align-items-center'>
                  <span className='material-symbols-outlined input-group-text'>
                    lock
                  </span>
                  <Form.Control
                    type={showPassword ? 'text' : 'password'}
                    placeholder='Nhập mật khẩu của bạn'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                  <button
                    type='button'
                    className='btn-toggle pe-3'
                    onClick={togglePassword}
                    aria-label='Toggle password visibility'
                    disabled={loading}
                  >
                    <span className='material-symbols-outlined'>
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </Form.Group>

              {/* Options */}
              <div className='d-flex justify-content-between align-items-center'>
                <Form.Check
                  type='checkbox'
                  id='remember-me'
                  label='Ghi nhớ đăng nhập'
                  className='text-sm fw-medium'
                  disabled={loading}
                />
                <Link to="/forgot-password" className="text-primary-custom text-decoration-underline fw-medium small">
                  Quên mật khẩu?
                </Link>
              </div>

              {/* Submit Button */}
              <Button
                variant='primary'
                className='bg-primary-custom w-100 py-3 fw-medium'
                style={{ height: '56px', borderRadius: '0.5rem' }}
                type='submit'
                disabled={loading}
              >
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </Button>
            </Form>

          </div>
        </Col>

        {/* --- Right Side: Hero Image (Hidden on mobile) --- */}
        <Col
          lg={6}
          className='d-none d-lg-flex hero-section align-items-center justify-content-center p-5'
        >
          <img
            src='https://lh3.googleusercontent.com/aida-public/AB6AXuAHrYA-JbjG4qPmzA_osWfbIQDRi42DEh_pchFoqry2W0w1CyNu3CLumo2831UO8ZG_tCO_tdC2_16aAh9hXv9WTtEh12bd4zuJRyfmYSW-VK8ZrlFJMpPU5RlSiipImlOQMLm3LrhoOG4t-k2ovdIR1NJGMAKIyrTc6weYf9hkHFYYybUCapCDt7ZZ-1AkIGvtUjuPFOC6C-ddok3ecH9d8tKXDCVtluONbnYh-5N2D64uoigF4TVZChaiRQfINT85iBsgbPHue6o'
            alt='Students collaborating'
            className='hero-bg'
          />
          <div className='hero-overlay'></div>

          <div
            className='hero-content text-white text-center'
            style={{ maxWidth: '480px' }}
          >
            <h2 className='fw-bold mb-3 display-5'>Nơi ý tưởng cất cánh.</h2>
            <p className='fs-5 text-light opacity-75'>
              Tham gia cộng đồng của chúng tôi để quản lý, học hỏi và phát triển
              cùng nhau trong môi trường lab năng động và sáng tạo.
            </p>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default Login;
