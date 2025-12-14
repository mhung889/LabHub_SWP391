import React, { useState } from 'react';
import { Form, Button, Row, Col } from 'react-bootstrap';
import { toast } from 'sonner';
import authApi from '../../api/authApi';
import { useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Vui lòng nhập email');
      return;
    }

    setLoading(true);
    try {
      await authApi.forgotPassword({ email });
      toast.success('Nếu email tồn tại, link đặt lại mật khẩu đã được gửi');
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Lỗi';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-white justify-content-center align-items-center">
      <Row className="w-100" style={{ maxWidth: 480 }}>
        <Col>
          <h3 className="mb-3">Quên mật khẩu</h3>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email của bạn"
                disabled={loading}
              />
            </Form.Group>

            <Button type="submit" className="w-100" disabled={loading}>
              {loading ? 'Đang gửi...' : 'Gửi link đặt lại'}
            </Button>
          </Form>
        </Col>
      </Row>
    </div>
  );
};

export default ForgotPassword;
