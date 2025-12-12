import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col } from 'react-bootstrap';
import { toast } from 'sonner';
import authApi from '../../api/authApi';
import { useNavigate, useSearchParams } from 'react-router-dom';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      toast.error('Token không hợp lệ');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      toast.error('Vui lòng nhập đầy đủ');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu không khớp');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({ token, newPassword });
      toast.success('Đặt lại mật khẩu thành công');
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
          <h3 className="mb-3">Đặt lại mật khẩu</h3>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Mật khẩu mới</Form.Label>
              <Form.Control
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới"
                disabled={loading}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Xác nhận mật khẩu</Form.Label>
              <Form.Control
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Xác nhận mật khẩu"
                disabled={loading}
              />
            </Form.Group>

            <Button type="submit" className="w-100" disabled={loading || !token}>
              {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
            </Button>
          </Form>
        </Col>
      </Row>
    </div>
  );
};

export default ResetPassword;
