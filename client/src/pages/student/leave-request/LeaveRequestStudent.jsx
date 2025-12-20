import React, { useEffect, useMemo, useState } from 'react';
import {
  Container,
  Card,
  Button,
  Form,
  Badge,
  Table,
  Row,
  Col,
} from 'react-bootstrap';
import { Eye, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import authApi from '@/api/authApi';
import Sidebar from '../../../components/student/sidebar/Sidebar';
import { getAccessToken } from '../../../utils/storage';
import leaveRequestApi from '../../../api/leaveRequestApi';
import CreateLeaveRequestModal from './CreateLeaveRequestModal';
import LeaveRequestDetailModal from './LeaveRequestDetailModal';

/* ================= helpers ================= */

const statusBadge = (s) => {
  switch (s) {
    case 'pending':
      return (
        <Badge bg='warning' text='dark'>
          Pending
        </Badge>
      );
    case 'approved':
      return <Badge bg='success'>Approved</Badge>;
    case 'rejected':
      return <Badge bg='danger'>Rejected</Badge>;
    case 'cancelled':
      return <Badge bg='secondary'>Cancelled</Badge>;
    default:
      return (
        <Badge bg='light' text='dark'>
          {s}
        </Badge>
      );
  }
};

const leaveTypeLabel = (t) => {
  switch (t) {
    case 'personal':
      return 'Nghỉ cá nhân';
    case 'sick':
      return 'Nghỉ ốm';
    case 'schoolActivity':
      return 'Hoạt động trường';
    default:
      return t;
  }
};

const pickLabId = (u) =>
  u?.student?.lab?._id || u?.student?.lab || u?.lab?._id || u?.lab || '';

/* ================= component ================= */

export default function LeaveRequestStudent() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [labId, setLabId] = useState('');

  // list
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);

  // filters
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [leaveType, setLeaveType] = useState('');

  // modal create
  const [openCreate, setOpenCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  //modal detail
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  /* ================= init user ================= */

  useEffect(() => {
    const initUser = async () => {
      const token = getAccessToken();
      if (!token) {
        navigate('/login');
        return;
      }

      // lấy user từ localStorage
      const storedUser =
        JSON.parse(localStorage.getItem('user')) ||
        JSON.parse(localStorage.getItem('userInfo') || 'null');

      if (storedUser) {
        setUser(storedUser);
        setLabId(pickLabId(storedUser));

        // nếu đã có lab thì không cần gọi profile
        if (pickLabId(storedUser)) return;
      }

      // thiếu lab hoặc chưa có user
      try {
        const res = await authApi.getProfile();
        const freshUser = {
          ...res.user,
          student: res.student,
        };

        setUser(freshUser);
        setLabId(pickLabId(freshUser));
        localStorage.setItem('user', JSON.stringify(freshUser));
      } catch (err) {
        authApi.logout();
        navigate('/login');
      }
    };

    initUser();
  }, [navigate]);

  /* ================= load my leave requests ================= */

  const loadMine = async () => {
    setLoading(true);
    try {
      const res = await leaveRequestApi.getMine();
      const data = res?.data?.leaveRequests || [];
      setRequests(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error(
        e?.response?.data?.message || 'Không tải được danh sách đơn.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (getAccessToken()) loadMine();
  }, []);

  /* ================= filters ================= */

  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    return requests.filter((r) => {
      const okStatus = status ? r.status === status : true;
      const okType = leaveType ? r.leaveType === leaveType : true;

      const hay = `${r?.reason || ''} ${r?.note || ''} ${
        r?.lab?.name || ''
      }`.toLowerCase();
      const okQ = keyword ? hay.includes(keyword) : true;

      return okStatus && okType && okQ;
    });
  }, [requests, q, status, leaveType]);

  /* ================= actions ================= */

  const onSubmitCreate = async (payload, setFormErr) => {
    setSubmitting(true);
    try {
      await leaveRequestApi.create(payload);
      toast.success('Gửi đơn thành công');
      await loadMine();
      setOpenCreate(false);
    } catch (e) {
      const msg = e?.response?.data?.message || 'Tạo đơn thất bại.';
      setFormErr?.(msg);
      // toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Bạn chắc chắn muốn hủy đơn này?')) return;
    try {
      await leaveRequestApi.cancel(id);
      toast.success('Hủy đơn thành công');
      await loadMine();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Hủy đơn thất bại.');
    }
  };

  /* ================= render ================= */

  return (
    <div className='d-flex w-100 overflow-hidden'>
      <Sidebar user={user} />

      <main
        className='flex-grow-1 p-4 p-lg-5'
        style={{ backgroundColor: '#f6f7f8' }}
      >
        <Container fluid='lg'>
          {/* Header */}
          <div className='d-flex justify-content-between align-items-start mb-4'>
            <h1 className='h3 fw-bold text-dark'>Đơn Xin Nghỉ</h1>
            <Button
              onClick={() => setOpenCreate(true)}
              className='bg-primary-custom border-0'
            >
              + Tạo đơn nghỉ
            </Button>
          </div>

          {/* Filters */}
          <Card className='border-0 mb-3'>
            <Card.Body>
              <Row className='g-2'>
                <Col lg={6}>
                  <Form.Control
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder='Search by reason or lab name...'
                    className='custom-input'
                  />
                </Col>
                <Col lg={3}>
                  <Form.Select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value=''>Status (All)</option>
                    <option value='pending'>Pending</option>
                    <option value='approved'>Approved</option>
                    <option value='rejected'>Rejected</option>
                    <option value='cancelled'>Cancelled</option>
                  </Form.Select>
                </Col>
                {/* <Col lg={3}>
                  <Form.Select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                  >
                    <option value=''>Leave Type (All)</option>
                    <option value='personal'>Nghỉ cá nhân</option>
                    <option value='sick'>Nghỉ ốm</option>
                    <option value='schoolActivity'>Hoạt động trường</option>
                  </Form.Select>
                </Col> */}
              </Row>
            </Card.Body>
          </Card>

          {/* Table */}
          <Card className='border-0'>
            <Card.Body className='p-0'>
              <Table hover responsive className='mb-0 align-middle'>
                <thead>
                  <tr>
                    <th>Lab</th>
                    {/* <th>Leave Type</th> */}
                    <th>Start</th>
                    <th>End</th>
                    <th>Days</th>
                    <th>Status</th>

                    <th className='text-end'>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className='text-center py-4'>
                        Đang tải...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className='text-center py-4'>
                        Không có đơn nào.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((r) => (
                      <tr key={r._id}>
                        <td>{r?.lab?.name || '-'}</td>
                        {/* <td>{leaveTypeLabel(r.leaveType)}</td> */}
                        <td>
                          {new Date(r.startDate).toLocaleDateString('vi-VN')}
                        </td>
                        <td>
                          {new Date(r.endDate).toLocaleDateString('vi-VN')}
                        </td>
                        <td>{r.totalDays}</td>
                        <td>{statusBadge(r.status)}</td>

                        <td className='text-end'>
                          <div className='d-flex justify-content-end gap-2'>
                            {/* View detail */}
                            <Button
                              size='sm'
                              variant='outline-secondary'
                              onClick={() => {
                                setSelectedRequest(r);
                                setOpenDetail(true);
                              }}
                            >
                              <Eye size={16} />
                            </Button>

                            {r.status === 'pending' && (
                              <Button
                                size='sm'
                                variant='outline-danger'
                                onClick={() => handleCancel(r._id)}
                              >
                                <XCircle size={16} />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Container>

        {/* Create Modal */}
        <CreateLeaveRequestModal
          show={openCreate}
          onClose={() => setOpenCreate(false)}
          onSubmit={onSubmitCreate}
          submitting={submitting}
          labId={labId}
        />

        {/* Detail Modal */}
        <LeaveRequestDetailModal
          show={openDetail}
          onClose={() => setOpenDetail(false)}
          data={selectedRequest}
          role={'student'}
        />
      </main>
    </div>
  );
}
