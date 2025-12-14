import React, { useEffect, useState } from 'react';
import { getNotifications, createNotification, updateNotification, deleteNotification } from '../../api/notificationApi';
import labApi from '../../api/labApi';
import mentorApi from '../../api/mentorApi';
import { getUserInfo } from '../../utils/storage';
import { Card, Button, Form, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

export default function MentorNotificationsPage(){
  const [list, setList] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title:'', content:'', isImportant:false, lab: ''});
  const [labs, setLabs] = useState([]);
  const [myLab, setMyLab] = useState(null);

  useEffect(()=>{ load() },[])

  useEffect(() => {
    const loadMyLab = async () => {
      try {
        const user = getUserInfo();
        if (!user || user.role !== 'mentor' || !user._id) return;
        const res = await mentorApi.getMentorById(user._id);
        // mentorApi returns mentor info with `labs` array
        const mentorLabs = (res.data && (res.data.labs || res.data)) || res.data?.labs || [];
        if (Array.isArray(mentorLabs) && mentorLabs.length > 0) {
          setMyLab(mentorLabs[0]);
        } else {
          setMyLab(null);
        }
      } catch (err) {
        console.warn('Could not load mentor lab', err);
      }
    }
    loadMyLab();
  }, []);

  useEffect(()=>{
    const loadLabs = async ()=>{
      try{
        const res = await labApi.getLabs({ status: 'active' });
        // server returns { labs: [...] }
        const items = (res.data && (res.data.labs || res.data)) || [];
        setLabs(items);
      }catch(err){ console.warn('Could not load labs', err) }
    }
    loadLabs();
  },[])

  const load = async(q='', lab='') =>{
    try{
      const params = {};
      if (q) params.search = q;
      if (lab) params.lab = lab;
      const res = await getNotifications(params);
      setList(res.data.notifications || []);
    }catch(err){
      console.error(err);
      alert(err.response?.data?.message || 'Lỗi');
    }
  }

  const openNew = ()=>{
    if(!myLab){ alert('Bạn chưa có phòng'); return }
    setEditing(null);
    setForm({title:'',content:'',isImportant:false, lab: myLab._id || myLab.id || ''});
    setShowModal(true);
  }
  const openEdit = (n)=>{
    const labId = n.lab && (typeof n.lab === 'string' ? n.lab : n.lab._id || n.lab);
    setEditing(n);
    setForm({title:n.title, content:n.content, isImportant:!!n.isImportant, lab: labId || ''});
    setShowModal(true)
  }

  const save = async ()=>{
    try{
      if(editing){
        await updateNotification(editing._id, form);
      }else{
        await createNotification(form);
      }
      setShowModal(false);
      load(search);
    }catch(err){ console.error(err); alert(err.response?.data?.message||'Lỗi lưu') }
  }

  const remove = async (id)=>{
    if(!confirm('Xóa thông báo này?')) return;
    await deleteNotification(id);
    load(search);
  }

  const handleSearch = (e)=>{ e.preventDefault(); load(search) }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý Thông báo</h1>
        <div>
          <Button onClick={openNew}>+ Tạo thông báo</Button>
        </div>
      </div>

      <Card className="p-4 mb-3">
        <Form onSubmit={handleSearch} className="d-flex gap-2 align-items-center">
          <Form.Control placeholder="Tìm kiếm..." value={search} onChange={e=>setSearch(e.target.value)} />
          <Button type="submit">Tìm</Button>
          <Button variant="secondary" type="button" onClick={()=>{ setSearch(''); load(); }}>Xóa</Button>
        </Form>
      </Card>

      <div>
        {list.map(n=> (
          <Card key={n._id} className="p-3 mb-2">
            <div className="d-flex justify-content-between">
              <div>
                <h5 className="mb-1">{n.title}</h5>
                <div className="text-muted small">{new Date(n.createdAt).toLocaleString()}</div>
                <p className="mt-2 mb-0">{n.content}</p>
              </div>
              <div className="d-flex flex-column gap-2 ms-3">
                <Button size="sm" onClick={()=>openEdit(n)}>Sửa</Button>
                <Button size="sm" variant="danger" onClick={()=>remove(n._id)}>Xóa</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal show={showModal} onHide={()=>setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editing? 'Sửa thông báo' : 'Tạo thông báo'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label>Tiêu đề</Form.Label>
              <Form.Control value={form.title} onChange={e=>setForm({...form, title: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Nội dung</Form.Label>
              <Form.Control as="textarea" rows={4} value={form.content} onChange={e=>setForm({...form, content: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Phòng Lab</Form.Label>
              <Form.Control value={myLab ? (myLab.name || myLab.title || myLab.labName || myLab.code) : ''} disabled />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={()=>setShowModal(false)}>Đóng</Button>
          <Button onClick={save}>{editing? 'Lưu' : 'Tạo'}</Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}
