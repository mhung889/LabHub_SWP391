import React, { useEffect, useState } from 'react';
import {
  getNotifications,
  createNotification,
  updateNotification,
  deleteNotification,
} from '../../api/notificationApi';
import labApi from '../../api/labApi';
import mentorApi from '../../api/mentorApi';
import { getUserInfo } from '../../utils/storage';
import { Card, Button, Form, Modal, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Eye, Edit2, Trash2 } from 'lucide-react';

export default function MentorNotificationsPage() {
  const [list, setList] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    title: '',
    content: '',
    isImportant: false,
    lab: '',
  });
  const [target, setTarget] = useState('lab'); // 'lab' or 'student'
  const [students, setStudents] = useState([]);
  const [recipientStudent, setRecipientStudent] = useState('');
  const [labs, setLabs] = useState([]);
  const [myLab, setMyLab] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewSelected, setViewSelected] = useState(null);

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const loadMyLab = async () => {
      try {
        const user = getUserInfo();
        if (!user || user.role !== 'mentor' || !user._id) return;
        const res = await mentorApi.getMentorById(user._id);
        // mentorApi returns mentor info with `labs` array
        const mentorLabs =
          (res.data && (res.data.labs || res.data)) || res.data?.labs || [];
        if (Array.isArray(mentorLabs) && mentorLabs.length > 0) {
          setMyLab(mentorLabs[0]);
        } else {
          setMyLab(null);
        }
      } catch (err) {
        console.warn('Could not load mentor lab', err);
      }
    };
    loadMyLab();
  }, []);

  useEffect(() => {
    const loadLabs = async () => {
      try {
        const res = await labApi.getLabs({ status: 'active' });
        // server returns { labs: [...] }
        const items = (res.data && (res.data.labs || res.data)) || [];
        setLabs(items);
      } catch (err) {
        console.warn('Could not load labs', err);
      }
    };
    loadLabs();
  }, []);

  useEffect(() => {
    // load students for myLab when needed
    const loadStudents = async () => {
      try {
        if (!myLab || !myLab._id) return;
        const res = await labApi.getStudentsByLabId(myLab._id);
        const items = (res.data && (res.data.students || res.data)) || [];
        setStudents(items);
      } catch (err) {
        console.warn('Could not load students for lab', err);
      }
    };
    loadStudents();
  }, [myLab]);

  const load = async (q = '', lab = '') => {
    try {
      const params = {};
      if (q) params.search = q;
      if (lab) params.lab = lab;
      const res = await getNotifications(params);
      setList(res.data.notifications || []);
      setPage(1);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Lỗi');
    }
  };

  const openNew = () => {
    if (!myLab) {
      alert('Bạn chưa có phòng');
      return;
    }
    setEditing(null);
    setForm({
      title: '',
      content: '',
      isImportant: false,
      lab: myLab._id || myLab.id || '',
    });
    setTarget('lab');
    setRecipientStudent('');
    setShowModal(true);
  };
  const openEdit = (n) => {
    const labId =
      n.lab && (typeof n.lab === 'string' ? n.lab : n.lab._id || n.lab);
    setEditing(n);
    setForm({
      title: n.title,
      content: n.content,
      isImportant: !!n.isImportant,
      lab: labId || '',
    });
    setTarget(n.target || (n.recipientStudent ? 'student' : 'lab'));
    setRecipientStudent(
      n.recipientStudent && typeof n.recipientStudent === 'string'
        ? n.recipientStudent
        : n.recipientStudent?._id || ''
    );
    setShowModal(true);
  };

  const save = async () => {
    try {
      const payload = { ...form };
      if (target === 'student') {
        // set recipientStudent and keep lab for context
        payload.recipientStudent = recipientStudent;
      }

      if (editing) {
        await updateNotification(editing._id, payload);
      } else {
        await createNotification(payload);
      }
      setShowModal(false);
      load(search);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Lỗi lưu');
    }
  };

  const remove = async (id) => {
    if (!confirm('Xóa thông báo này?')) return;
    await deleteNotification(id);
    load(search);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    load(search);
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>Quản lý Thông báo</h1>
        <div>
          <Button onClick={openNew}>+ Tạo thông báo</Button>
        </div>
      </div>

      <Card className='p-4 mb-3'>
        <Form
          onSubmit={handleSearch}
          className='d-flex gap-2 align-items-center'
        >
          <Form.Control
            placeholder='Tìm kiếm...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button type='submit'>Tìm</Button>
          {/* <Button
            variant='secondary'
            type='button'
            onClick={() => {
              setSearch('');
              load();
            }}
          >
            Xóa
          </Button> */}
        </Form>
      </Card>

      <div>
        {list
          .slice((page - 1) * pageSize, page * pageSize)
          .map((n) => (
          <Card key={n._id} className='p-3 mb-2'>
            <div className='d-flex justify-content-between'>
              <div>
                <h5 className='mb-1'>
                  {n.title && n.title.length > 20 ? n.title.slice(0, 20) + '...' : n.title}  
                  {n.isImportant && <Badge bg='warning' text='dark' className='ms-2'>Quan trọng</Badge>}
                  {n.target === 'student' ? (
                    <Badge bg='secondary' className='ms-2'>Sinh viên</Badge>
                  ) : (
                    <Badge bg='info' className='ms-2'>Phòng Lab</Badge>
                  )}
                </h5>
                <div className='text-muted small'>
                  {new Date(n.createdAt).toLocaleString()}
                </div>
                <p className='mt-2 mb-0'>
                  {n.content && n.content.length > 20 ? n.content.slice(0, 20) + '...' : n.content}
                </p>
              </div>
              <div className='d-flex align-items-center ms-3'>
                <div className='d-flex gap-2'>
                  <Button
                    size='sm'
                    variant='outline-secondary'
                    onClick={() => { setViewSelected(n); setShowViewModal(true); }}
                    title='Xem thông báo'
                  >
                    <Eye size={16} />
                  </Button>
                  <Button
                    size='sm'
                    variant='outline-primary'
                    onClick={() => openEdit(n)}
                    title='Sửa thông báo'
                  >
                    <Edit2 size={16} />
                  </Button>
                  <Button
                    size='sm'
                    variant='outline-danger'
                    onClick={() => remove(n._id)}
                    title='Xóa thông báo'
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {list.length > pageSize && (
        <div className='d-flex justify-content-between align-items-center mt-3'>
          <div className='text-muted small'>
            Trang {page} / {Math.ceil(list.length / pageSize)}
          </div>
          <div className='d-flex gap-2'>
            <Button
              variant='outline-secondary'
              size='sm'
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Trước
            </Button>
            <Button
              variant='outline-secondary'
              size='sm'
              disabled={page === Math.ceil(list.length / pageSize)}
              onClick={() =>
                setPage((p) => Math.min(Math.ceil(list.length / pageSize), p + 1))
              }
            >
              Sau
            </Button>
          </div>
        </div>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editing ? 'Sửa thông báo' : 'Tạo thông báo'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className='mb-2'>
              <Form.Label>Tiêu đề</Form.Label>
              <Form.Control
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </Form.Group>
            <Form.Group className='mb-2'>
              <Form.Label>Nội dung</Form.Label>
              <Form.Control
                as='textarea'
                rows={4}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
            </Form.Group>
            <Form.Group className='mb-2'>
              <Form.Check
                type='checkbox'
                label='Quan trọng'
                checked={!!form.isImportant}
                onChange={(e) => setForm({ ...form, isImportant: e.target.checked })}
              />
            </Form.Group>
            <Form.Group className='mb-2'>
              <Form.Label>Phòng Lab</Form.Label>
              <Form.Control
                value={
                  myLab
                    ? myLab.name || myLab.title || myLab.labName || myLab.code
                    : ''
                }
                disabled
              />
            </Form.Group>
            <Form.Group className='mb-2'>
              <Form.Label>Đối tượng</Form.Label>
              <div>
                <Form.Check
                  inline
                  label='Phòng Lab'
                  type='radio'
                  name='target'
                  id='target-lab'
                  checked={target === 'lab'}
                  onChange={() => setTarget('lab')}
                />
                <Form.Check
                  inline
                  label='Sinh viên'
                  type='radio'
                  name='target'
                  id='target-student'
                  checked={target === 'student'}
                  onChange={() => setTarget('student')}
                />
              </div>
            </Form.Group>
            {target === 'student' && (
              <Form.Group className='mb-2'>
                <Form.Label>Chọn sinh viên</Form.Label>
                <Form.Select
                  value={recipientStudent}
                  onChange={(e) => setRecipientStudent(e.target.value)}
                >
                  <option value=''>-- Chọn --</option>
                  {students.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.fullName || s.studentCode || s._id}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant='secondary' onClick={() => setShowModal(false)}>
            Đóng
          </Button>
          <Button onClick={save}>{editing ? 'Lưu' : 'Tạo'}</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <div style={{ wordBreak: 'break-word', maxWidth: '100%' }}>{viewSelected?.title}</div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <div className='text-muted small mb-2' style={{ wordBreak: 'break-word' }}>{viewSelected?.sender?.fullName || ''} — {viewSelected ? new Date(viewSelected.createdAt).toLocaleString() : ''}</div>
          <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{viewSelected?.content}</div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant='secondary' onClick={() => setShowViewModal(false)}>Đóng</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
