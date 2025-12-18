import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/student/sidebar/Sidebar';
import { Container, Card, Form, Button, Badge, Modal } from 'react-bootstrap';
import { getAccessToken } from '../../utils/storage';
import { getStudentNotifications, markNotificationRead } from '../../api/notificationApi';

export default function StudentNotifications() {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(storedUser);
    load();
  }, []);

  const load = async (q = '') => {
    try {
      const res = await getStudentNotifications({ search: q });
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Lỗi tải thông báo');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    load(search);
  };

  const openNotification = async (n) => {
    try {
      let wasUnread = !n.isRead;
      if (wasUnread) {
        await markNotificationRead(n._id);
        // update local list immediately
        setNotifications((prev) =>
          prev.map((item) => (item._id === n._id ? { ...item, isRead: true } : item))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
        // notify other components (Sidebar)
        try {
          const ev = new CustomEvent('notificationRead', { detail: { id: n._id, unreadCount: Math.max(0, unreadCount - 1) } });
          window.dispatchEvent(ev);
        } catch (e) {
          // ignore
        }
      }
      // open modal with updated item
      setSelected({ ...n, isRead: true });
      setShowModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);

  const handleClose = () => {
    setShowModal(false);
    setSelected(null);
  };

  return (
    <div className="d-flex w-100 overflow-hidden">
      <Sidebar user={user} />
      <main className="flex-grow-1 p-4 p-lg-5" style={{ backgroundColor: '#f6f7f8' }}>
        <Container fluid="lg">
          <div className="mb-4 d-flex align-items-center justify-content-between">
            <div>
              <h1 className="display-6 fw-bold">Thông báo</h1>
              <p className="text-secondary mb-0">Danh sách thông báo từ Mentor</p>
            </div>
            <div>
              <Badge bg="primary">Chưa đọc: {unreadCount}</Badge>
            </div>
          </div>

          <Card className="p-3 mb-3">
            <Form onSubmit={handleSearch} className="d-flex gap-2">
              <Form.Control placeholder="Tìm kiếm..." value={search} onChange={(e)=>setSearch(e.target.value)} />
              <Button type="submit">Tìm</Button>
            </Form>
          </Card>

          <div className="d-flex flex-column gap-2">
            {notifications.length === 0 && <div className="text-muted">Không có thông báo</div>}
            {notifications.map((n) => (
              <Card key={n._id} className={`p-3 ${n.isRead ? '' : 'border border-primary'}`}>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                            <h5 className="mb-1">
                              {n.title && n.title.length > 20 ? n.title.slice(0, 20) + '...' : n.title}
                              {!n.isRead && <Badge bg="danger" className="ms-2">Mới</Badge>}
                              {n.isImportant && <Badge bg="warning" text="dark" className="ms-2">Quan trọng</Badge>}
                              {n.target === 'student' ? (
                                <Badge bg="secondary" className="ms-2">Riêng</Badge>
                              ) : (
                                <Badge bg="info" className="ms-2">Lab</Badge>
                              )}
                            </h5>
                    <div className="text-muted small">{new Date(n.createdAt).toLocaleString()}</div>
                    <p className="mt-2 mb-0">
                      {n.content && n.content.length > 20
                        ? n.content.slice(0, 20) + '...'
                        : n.content}
                    </p>
                  </div>
                  <div className="ms-3 d-flex flex-column gap-2">
                    <Button size="sm" onClick={()=>openNotification(n)}>Xem</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          <Modal show={showModal} onHide={handleClose} centered>
            <Modal.Header closeButton>
              <Modal.Title>
                <div style={{ wordBreak: 'break-word', maxWidth: '100%' }}>{selected?.title}</div>
              </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <div className="text-muted small mb-2" style={{ wordBreak: 'break-word' }}>{selected?.sender?.fullName || ''} — {selected ? new Date(selected.createdAt).toLocaleString() : ''}</div>
              <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{selected?.content}</div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleClose}>Đóng</Button>
            </Modal.Footer>
          </Modal>
        </Container>
      </main>
    </div>
  );
}
