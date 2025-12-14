import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import labApi from '@/api/labApi';

import majorApi from '@/api/majorApi';
import mentorApi from '@/api/mentorApi';

export default function AdminLabManageDrawer({
  isOpen,
  onClose,
  lab,
  loading: outerLoading = false,
  onUpdated,
}) {

  console.log(lab)

  const [activeTab, setActiveTab] = useState('info'); // "info" | "students" | "attendance"


  const [majors, setMajors] = useState([]);
  const [mentors, setMentors] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    startTime: '',
    endTime: '',
    total: 30,
    status: 'active',
    major: '',
    mentor: '',
    description: '',

    attendanceRule: {
      checkInEarlyMinutes: 15,
      checkInLateMinutes: 10,
      checkOutEarlyMinutes: 0,
      checkOutLateMinutes: 15,
    },
  });

  const [selectedStudentId, setSelectedStudentId] = useState('');

  // state nội bộ cho tab students
  const [labStudents, setLabStudents] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);

  const [savingInfo, setSavingInfo] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);

  // phân trang student
  const PAGE_SIZE = 7;
  const [studentPage, setStudentPage] = useState(1);

  useEffect(() => {
    if (lab && isOpen) {
      setFormData({
        name: lab.name || '',
        startTime: lab.startTime || '08:00',
        endTime: lab.endTime || '17:00',
        total: lab.total ?? 30,
        status: lab.status || 'active',
        major: typeof lab.major === 'string' ? lab.major : lab.major?._id || '',
        mentor:
          typeof lab.mentor === 'string' ? lab.mentor : lab.mentor?._id || '',
        description: lab.description || '',

        attendanceRule: {
          checkInEarlyMinutes:
            lab.attendanceRule?.checkInEarlyMinutes ?? 15,
          checkInLateMinutes:
            lab.attendanceRule?.checkInLateMinutes ?? 10,
          checkOutEarlyMinutes:
            lab.attendanceRule?.checkOutEarlyMinutes ?? 0,
          checkOutLateMinutes:
            lab.attendanceRule?.checkOutLateMinutes ?? 15,
        },
      });
    }
  }, [lab, isOpen]);

  const fetchLabStudents = async () => {
    if (!lab?._id) return;

    try {
      setStudentsLoading(true);
      const res = await labApi.getStudentsByLabId(lab._id);
      const data = res.data || {};
      const inLab = data.students || [];
      const available = data.availableStudents || [];
      setLabStudents(inLab);
      setAvailableStudents(available);
      setStudentPage(1);
    } catch (error) {
      console.error('fetchLabStudents error:', error.response?.data || error);
      toast.error('Không thể tải danh sách sinh viên của lab');
    } finally {
      setStudentsLoading(false);
    }
  };

  // phân trang
  const totalStudentPages = Math.ceil(labStudents.length / PAGE_SIZE) || 1;
  const paginatedStudents = labStudents.slice(
    (studentPage - 1) * PAGE_SIZE,
    studentPage * PAGE_SIZE
  );
  //end

  useEffect(() => {
    if (isOpen && lab?._id && activeTab === 'students') {
      fetchLabStudents();
    }
  }, [isOpen, lab?._id, activeTab]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchMajorsAndMentors = async () => {
      try {
        // majors
        const resMajor = await majorApi.getAll();
        const listMajors =
          resMajor.data?.majors || resMajor.data?.data || resMajor.data || [];
        setMajors(listMajors);

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
        console.error(
          'Load majors/mentors error:',
          error.response?.data || error
        );
      }
    };

    fetchMajorsAndMentors();
  }, [isOpen]);

  if (!isOpen || !lab) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'total' ? parseInt(value || '0', 10) : value,
    }));
  };

  const handleRuleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      attendanceRule: {
        ...prev.attendanceRule,
        [field]: parseInt(value || '0', 10),
      },
    }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!lab?._id) return;

    try {
      setSavingInfo(true);
      await labApi.update(lab._id, formData);
      toast.success('Cập nhật lab thành công');

      if (onUpdated) {
        await onUpdated();
      }

      onClose();
    } catch (error) {
      console.error('update lab error:', error.response?.data || error);
      toast.error(error.response?.data?.message || 'Cập nhật lab thất bại');
    } finally {
      setSavingInfo(false);
    }
  };

  const handleAttendanceSubmit = async () => {
    try {
      setSavingInfo(true);

      await labApi.updateAttendanceRule(lab._id, {
        checkInEarlyMinutes:
          formData.attendanceRule.checkInEarlyMinutes,
        checkInLateMinutes:
          formData.attendanceRule.checkInLateMinutes,
        checkOutEarlyMinutes:
          formData.attendanceRule.checkOutEarlyMinutes,
        checkOutLateMinutes:
          formData.attendanceRule.checkOutLateMinutes,
      });

      toast.success("Cập nhật cấu hình điểm danh thành công");

      if (onUpdated) await onUpdated();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Cập nhật cấu hình thất bại"
      );
    } finally {
      setSavingInfo(false);
    }
  };


  const handleAddStudentClick = async () => {
    if (!selectedStudentId || !lab?._id) return;

    try {
      setStudentsLoading(true);
      await labApi.addStudentToLab(lab._id, { studentId: selectedStudentId });
      toast.success('Thêm sinh viên vào lab thành công');
      setSelectedStudentId('');
      await fetchLabStudents();
    } catch (error) {
      console.error('addStudent error:', error.response?.data || error);
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!studentId || !lab?._id) return;

    try {
      setStudentsLoading(true);
      await labApi.removeStudentFromLab(lab._id, { studentId });
      toast.success('Xóa sinh viên khỏi lab thành công');
      await fetchLabStudents();
    } catch (error) {
      console.error('removeStudent error:', error.response?.data || error);
      toast.error(
        error.response?.data?.message || 'Không thể xóa sinh viên khỏi lab'
      );
    } finally {
      setStudentsLoading(false);
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex justify-end bg-black/40'>
      {/* Drawer */}
      <div className='flex h-full w-full flex-col bg-background shadow-xl md:w-2/3 lg:w-1/2'>
        {/* HEADER */}
        <div className='flex items-center justify-between border-b border-border px-4 py-3'>
          <div>
            <h2 className='text-lg font-semibold text-foreground'>
              Cập nhật lab
            </h2>
            <p className='text-sm text-muted-foreground'>
              {lab.name} •{' '}
              {lab.status === 'active' ? 'Đang hoạt động' : 'Không hoạt động'}
            </p>
          </div>
          <button
            onClick={onClose}
            className='rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground'
          >
            <X className='h-5 w-5' />
          </button>
        </div>

        {/* TABS */}
        <div className='border-b border-border px-4 pt-3'>
          <div className='inline-flex rounded-full bg-muted p-1 text-sm'>
            <button
              type='button'
              className={`rounded-full px-4 py-1.5 ${activeTab === 'info'
                ? 'bg-background font-medium shadow-sm'
                : 'text-muted-foreground'
                }`}
              onClick={() => setActiveTab('info')}
            >
              Thông tin lab
            </button>
            <button
              type='button'
              className={`rounded-full px-4 py-1.5 ${activeTab === 'students'
                ? 'bg-background font-medium shadow-sm'
                : 'text-muted-foreground'
                }`}
              onClick={() => setActiveTab('students')}
            >
              Sinh viên
            </button>
            <button
              type="button"
              className={`rounded-full px-4 py-1.5 ${activeTab === 'attendance'
                ? 'bg-background font-medium shadow-sm'
                : 'text-muted-foreground'
                }`}
              onClick={() => setActiveTab('attendance')}
            >
              Cấu hình điểm danh
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className='flex-1 overflow-y-auto p-4'>
          {/* TAB INFO */}
          {activeTab === 'info' && (
            <form onSubmit={handleSubmit} className='space-y-4'>
              {/* Name */}
              <div>
                <label className='mb-1 block text-sm font-medium text-foreground'>
                  Tên lab
                </label>
                <Input
                  name='name'
                  value={formData.name}
                  onChange={handleChange}
                  placeholder='Nhập tên lab'
                />
              </div>

              {/* Time + Total */}
              <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                <div>
                  <label className='mb-1 block text-sm font-medium text-foreground'>
                    Giờ bắt đầu
                  </label>
                  <Input
                    type='time'
                    name='startTime'
                    value={formData.startTime}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className='mb-1 block text-sm font-medium text-foreground'>
                    Giờ kết thúc
                  </label>
                  <Input
                    type='time'
                    name='endTime'
                    value={formData.endTime}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className='mb-1 block text-sm font-medium text-foreground'>
                    Sức chứa
                  </label>
                  <Input
                    type='number'
                    min='1'
                    max='200'
                    name='total'
                    value={formData.total}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Major + Mentor */}
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                {/* Chuyên ngành */}
                <div>
                  <label className='mb-1 block text-sm font-medium text-foreground'>
                    Chuyên ngành
                  </label>
                  <select
                    name='major'
                    value={formData.major}
                    onChange={handleChange}
                    className='w-full rounded-md border border-border bg-background px-3 py-2 text-sm'
                  >
                    <option value=''>-- Unknow --</option>
                    {majors.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mentor */}
                <div>
                  <label className='mb-1 block text-sm font-medium text-foreground'>
                    Mentor phụ trách
                  </label>
                  <select
                    name='mentor'
                    value={formData.mentor}
                    onChange={handleChange}
                    className='w-full rounded-md border border-border bg-background px-3 py-2 text-sm'
                  >
                    <option value=''>-- Unknow --</option>
                    {mentors
                      .filter(
                        (mentor) =>
                          mentor.labCount === 0 ||
                          mentor._id === formData.mentor // mentor hiện tại của lab này
                      )
                      .map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.fullName}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Status */}
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <div>
                  <label className='mb-1 block text-sm font-medium text-foreground'>
                    Trạng thái
                  </label>
                  <select
                    name='status'
                    value={formData.status}
                    onChange={handleChange}
                    className='w-full rounded-md border border-border bg-background px-3 py-2 text-sm'
                  >
                    <option value='active'>Hoạt động</option>
                    <option value='inactive'>Không hoạt động</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className='mb-1 block text-sm font-medium text-foreground'>
                  Mô tả
                </label>
                <textarea
                  name='description'
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className='w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm'
                />
              </div>

              <div className='flex justify-end gap-2 pt-2'>
                <Button type='button' variant='outline' onClick={onClose}>
                  Đóng
                </Button>
                <Button type='submit' disabled={savingInfo || outerLoading}>
                  {savingInfo ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
              </div>
            </form>
          )}

          {/* TAB STUDENTS */}
          {activeTab === 'students' && (
            <div className='space-y-4'>
              {/* Add student */}
              <div className='rounded-lg bg-muted/60 p-4'>
                <p className='mb-2 text-sm font-medium text-foreground'>
                  Thêm sinh viên vào lớp
                </p>
                <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
                  <select
                    className='flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm'
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                  >
                    <option value=''>-- Chọn sinh viên --</option>
                    {availableStudents.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.studentCode} - {s.major.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    type='button'
                    className='shrink-0'
                    onClick={handleAddStudentClick}
                    disabled={!selectedStudentId || studentsLoading}
                  >
                    {studentsLoading ? 'Đang thêm...' : 'Add'}
                  </Button>
                </div>
              </div>

              {/* Table students in lab */}
              <div className='overflow-x-auto rounded-lg border border-border bg-background'>
                <table className='min-w-full text-sm'>
                  <thead className='bg-muted/60'>
                    <tr>
                      <th className='px-3 py-2 text-left font-medium'>No</th>
                      <th className='px-3 py-2 text-left font-medium'>Mã SV</th>
                      <th className='px-3 py-2 text-left font-medium'>
                        FullName
                      </th>
                      <th className='px-1 py-2 text-left font-medium'>
                        Chuyên ngành
                      </th>
                      <th className='px-3 py-2 text-center font-medium'>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsLoading && (
                      <tr>
                        <td
                          colSpan={5}
                          className='px-3 py-4 text-center text-muted-foreground'
                        >
                          Đang tải danh sách sinh viên...
                        </td>
                      </tr>
                    )}

                    {!studentsLoading && labStudents.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className='px-3 py-4 text-center text-muted-foreground'
                        >
                          Chưa có sinh viên nào trong lab này.
                        </td>
                      </tr>
                    )}

                    {!studentsLoading &&
                      paginatedStudents.map((s, index) => (
                        <tr key={s._id} className='border-t border-border'>
                          {/* <td className='px-3 py-2'>{index + 1}</td> */}

                          <td className='px-3 py-2'>
                            {(studentPage - 1) * PAGE_SIZE + index + 1}
                          </td>

                          <td className='px-3 py-2'>{s.studentCode}</td>
                          <td className='px-3 py-2'>{s.user.fullName}</td>
                          <td className='px-3 py-2'>{s.major.name}</td>
                          <td className='px-3 py-2 text-center'>
                            <button
                              type='button'
                              className='text-destructive hover:opacity-80'
                              onClick={() => handleRemoveStudent(s._id)}
                            >
                              🗑
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {!studentsLoading && labStudents.length > 0 && (
                <div className='mt-3 flex items-center justify-between text-sm text-muted-foreground'>
                  <span>
                    Trang {studentPage} / {totalStudentPages}
                  </span>
                  <div className='space-x-2'>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      disabled={studentPage === 1}
                      onClick={() => setStudentPage((p) => Math.max(1, p - 1))}
                    >
                      Trước
                    </Button>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      disabled={studentPage === totalStudentPages}
                      onClick={() =>
                        setStudentPage((p) =>
                          Math.min(totalStudentPages, p + 1)
                        )
                      }
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border p-4">
                <h3 className="mb-3 text-sm font-semibold text-foreground">
                  ⏱ Cấu hình thời gian điểm danh
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm text-foreground">
                      Check-in sớm (phút)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.attendanceRule.checkInEarlyMinutes}
                      onChange={(e) =>
                        handleRuleChange(
                          "checkInEarlyMinutes",
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm text-foreground">
                      Check-in muộn (phút)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.attendanceRule.checkInLateMinutes}
                      onChange={(e) =>
                        handleRuleChange(
                          "checkInLateMinutes",
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm text-foreground">
                      Check-out sớm (phút)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.attendanceRule.checkOutEarlyMinutes}
                      onChange={(e) =>
                        handleRuleChange(
                          "checkOutEarlyMinutes",
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm text-foreground">
                      Check-out muộn (phút)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.attendanceRule.checkOutLateMinutes}
                      onChange={(e) =>
                        handleRuleChange(
                          "checkOutLateMinutes",
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>

                {/* ACTION BUTTON */}
                <div className="mt-6 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                  >
                    Đóng
                  </Button>

                  <Button
                    type="button"
                    onClick={handleAttendanceSubmit}
                    disabled={savingInfo}
                  >
                    {savingInfo ? "Đang lưu..." : "Lưu cấu hình"}
                  </Button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
