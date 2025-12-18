import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Plus,
  Edit2,
  Trash2,
  Users,
  ChevronRight,
  ChevronLeft,
  Eye,
} from 'lucide-react';

import AdminLabDetailModal from './Action/AdminLabDetailModal';
import CreateLabModal from './Action/CreateLabModal';
import DeleteLabModal from './Action/DeleteLabModal';
import AdminLabManageDrawer from './Action/AdminLabManageDrawer'; //edit lab
import AdminLabStudentsDrawer from './Action/AdminLabStudentsDrawer'; // add student to lab

import labApi from '@/api/labApi';
import majorApi from '@/api/majorApi';
import mentorApi from '@/api/mentorApi';

const PAGE_LIMIT = 3;

export default function AdminLabsPage() {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [majors, setMajors] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [majorFilter, setMajorFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedLab, setSelectedLab] = useState(null);

  const [showDelete, setShowDelete] = useState(false);
  const [labToDelete, setLabToDelete] = useState(null);

  const [manageLabOpen, setManageLabOpen] = useState(false);

  const [mentors, setMentors] = useState([]);

  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // add student
  const [studentsDrawerOpen, setStudentsDrawerOpen] = useState(false);
  const [labForStudents, setLabForStudents] = useState(null);
  //end add

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: PAGE_LIMIT,
    totalPages: 1,
  });

  // const [formData, setFormData] = useState({
  //   name: '',
  //   mentor: '',
  //   total: '',
  //   status: 'active',
  //   description: '',
  //   major: '',
  //   startTime: '',
  //   endTime: '',
  // });

  const fetchLabs = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await labApi.getAll({
        page,
        limit: PAGE_LIMIT,
        search: searchTerm || undefined,
        major: majorFilter || undefined,
      });

      const { data, pagination } = res.data;
      setLabs(data || []);

      if (pagination) {
        setPagination(pagination);
      } else {
        setPagination({
          total: data?.length || 0,
          page,
          limit: PAGE_LIMIT,
          totalPages: Math.max(1, Math.ceil((data?.length || 0) / PAGE_LIMIT)),
        });
      }
    } catch (err) {
      console.error('fetchLabs error:', err.response?.data || err.message);
      setError('Không thể tải danh sách lab');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchMajorsAndMentors = async () => {
      try {
        // Majors
        const resMajor = await majorApi.getAll();
        const listMajors =
          resMajor.data?.majors || resMajor.data?.data || resMajor.data || [];
        setMajors(listMajors);

        // Mentors (active)
        const resMentor = await mentorApi.getMentors({
          page: 1,
          limit: 200,
          status: 'active',
        });

        const listMentors =
          resMentor.data?.mentors ||
          resMentor.data?.data ||
          resMentor.data ||
          [];
        setMentors(listMentors);
      } catch (error) {
        console.error('Load majors/mentors error:', error);
      }
    };

    fetchMajorsAndMentors();
  }, []);

  useEffect(() => {
    fetchLabs();
  }, [page, searchTerm, majorFilter]);

  const handleSearchInputChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleSearchClick = () => {
    setSearchTerm(searchInput);
    setPage(1);
  };

  const handleMajorChange = (e) => {
    const value = e.target.value;
    setMajorFilter(value);
    setPage(1);
  };

  const handleCreateLab = async (labData) => {
    try {
      setLoading(true);
      setError(null);

      await labApi.create({
        name: labData.name,
        code: labData.code,
        description: labData.description,
        startTime: labData.startTime,
        endTime: labData.endTime,
        total: labData.total,
        status: labData.status,
        major: labData.major, // ObjectId
        mentor: labData.mentor, // ObjectId
      });

      setShowForm(false);
      setPage(1);
      await fetchLabs();
    } catch (err) {
      console.error('Create lab error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Tạo lab thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLab = async (labId) => {
    setShowDelete(false);
    setLabToDelete(null);

    try {
      setLoading(true);
      setError(null);

      await labApi.delete(labId);

      toast.success('Xóa lab thành công!');

      // reload labs
      await fetchLabs();
    } catch (err) {
      const message =
        err.response?.data?.message ||
        'Không thể xóa lab do đang có student hoặc mentor!';

      //toast.error(message);

      setError(message);

      // reload labs
      await fetchLabs();
    } finally {
      setLoading(false);
    }
  };

  const totalPages = pagination.totalPages || 1;

  return (
    <div className='container py-4 space-y-6'>
      {/* HEADER */}
      <div className='d-flex justify-content-between align-items-center mb-4'>
        <h3 className='fw-bold'>Quản lý lab</h3>
        <button className='btn btn-primary' onClick={() => setShowForm(true)}>
          + Thêm mới lab
        </button>
      </div>

      {/* Filter */}
      <div className='row mb-4 '>
        {/* Search + nút tìm kiếm */}
        <div className='col-md-5 '>
          <label className='form-label fw-semibold'>Tìm kiếm</label>
          <div className='input-group'>
            <input
              className='form-control'
              placeholder='Tên, mô tả lab...'
              value={searchInput}
              onChange={handleSearchInputChange}
            />
            <button
              type='button'
              className='btn btn-outline-secondary'
              onClick={handleSearchClick}
            >
              Tìm kiếm
            </button>
          </div>
        </div>

        {/* Majors */}
        {/* <div className='col-md-4'>
          <label className='form-label fw-semibold'>Chuyên ngành</label>
          <select
            className='form-select'
            value={majorFilter}
            onChange={handleMajorChange}
          >
            <option value=''>Tất cả</option>
            {majors.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name}
              </option>
            ))}
          </select>
        </div> */}

        {/* <div className='hidden md:block' /> */}
      </div>

      {loading && (
        <Card className='p-6 text-center'>
          <p className='text-muted-foreground'>Đang tải danh sách lab...</p>
        </Card>
      )}

      {error && !loading && (
        <Card className='p-6 text-center'>
          <p className='text-destructive'>{error}</p>
        </Card>
      )}

      {!loading && !error && labs.length > 0 && (
        <>
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {labs.map((lab) => (
              <Card key={lab._id} className='flex flex-col p-6'>
                <div className='mb-4 flex items-start justify-between'>
                  <div className='flex-1'>
                    <h3 className='text-lg font-bold text-foreground'>
                      {lab.name}
                    </h3>
                    <p className='mt-1 text-sm text-muted-foreground'>
                      Mentor: {lab.mentor?.fullName || ''}
                    </p>
                    {/* <p className='text-balance text-muted-foreground'>
                      Chuyên ngành: {lab.major?.name || ''}
                    </p> */}
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      lab.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : 'bg-red-500/10 text-red-600'
                    }`}
                  >
                    {lab.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                  </span>
                </div>
                <p className='mb-5 text-sm text-muted-foreground'>
                  Chi tiết: {lab?.description}
                </p>

                {/*total student  */}
                <div className='mb-4 flex items-center gap-2 rounded-lg bg-muted/50 p-3'>
                  <Users className='h-4 w-4 text-muted-foreground' />
                  <span className='text-sm font-medium text-foreground'>
                    {lab.enrolled ?? 0}/{lab.total ?? 0} sinh viên
                  </span>
                </div>

                <div className='mb-4 h-2 w-full rounded-full bg-muted'>
                  <div
                    className='h-2 rounded-full bg-primary transition-all'
                    style={{
                      width:
                        lab.total && lab.total > 0
                          ? `${Math.min(
                              100,
                              ((lab.enrolled ?? 0) / lab.total) * 100
                            )}%`
                          : '0%',
                    }}
                  />
                </div>
                {/* end total student */}

                <div className='mt-auto flex gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    className='flex-1 gap-2 bg-transparent'
                    onClick={() => {
                      setSelectedLab(lab);
                      setIsDetailOpen(true);
                    }}
                  >
                    <Eye className='h-4 w-4' />
                  </Button>

                  <Button
                    variant='outline'
                    size='sm'
                    className='flex-1 gap-2 bg-transparent'
                    onClick={() => {
                      setSelectedLab(lab);
                      setManageLabOpen(true);
                    }}
                  >
                    <Edit2 className='h-4 w-4' />
                  </Button>

                  <Button
                    variant='outline'
                    size='sm'
                    className='flex-1 gap-2 bg-transparent'
                    onClick={() => {
                      setLabForStudents(lab);
                      setStudentsDrawerOpen(true);
                    }}
                  >
                    <Users className='h-4 w-4' />
                  </Button>

                  <Button
                    variant='outline'
                    size='sm'
                    className='flex-1 gap-2 bg-transparent text-destructive hover:text-destructive'
                    onClick={() => {
                      setLabToDelete(lab);
                      setShowDelete(true);
                    }}
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='ml-220 mt-6 flex items-center justify-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                disabled={page === 1}
                className='rounded-2xl'
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                <ChevronLeft />
              </Button>

              {Array.from({ length: totalPages }).map((_, index) => {
                const pageNumber = index + 1;
                return (
                  <Button
                    key={pageNumber}
                    size='sm'
                    variant={page === pageNumber ? 'default' : 'outline'}
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber}
                  </Button>
                );
              })}

              <Button
                variant='outline'
                size='sm'
                disabled={page === totalPages}
                onClick={() =>
                  setPage((prev) => Math.min(totalPages, prev + 1))
                }
              >
                <ChevronRight />
              </Button>
            </div>
          )}
        </>
      )}

      {!loading && !error && labs.length === 0 && (
        <Card className='p-12 text-center'>
          <p className='text-muted-foreground'>Không tìm thấy lab nào</p>
        </Card>
      )}

      <AdminLabDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        lab={selectedLab}
      />

      <CreateLabModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreateLab}
        mentors={mentors}
        majors={majors}
      />

      <DeleteLabModal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDeleteLab}
        lab={labToDelete}
      />

      <AdminLabManageDrawer
        isOpen={manageLabOpen}
        onClose={() => setManageLabOpen(false)}
        lab={selectedLab}
        loading={loading}
        onUpdated={fetchLabs} // update labs
      />

      {/* view and add student to lab */}
      <AdminLabStudentsDrawer
        isOpen={studentsDrawerOpen}
        onClose={() => setStudentsDrawerOpen(false)}
        lab={labForStudents}
      />
    </div>
  );
}
