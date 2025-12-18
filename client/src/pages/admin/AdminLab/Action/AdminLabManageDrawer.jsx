import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import { toast } from 'sonner';

import labApi from '@/api/labApi';
import mentorApi from '@/api/mentorApi';

export default function AdminLabManageDrawer({
  isOpen,
  onClose,
  lab,
  loading: outerLoading = false,
  onUpdated,
}) {
  const [activeTab, setActiveTab] = useState('info'); // "info" | "attendance"

  const [mentors, setMentors] = useState([]);
  const [savingInfo, setSavingInfo] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    startTime: '',
    endTime: '',
    total: 30,
    status: 'active',
    mentor: '',
    description: '',
    attendanceRule: {
      checkInEarlyMinutes: 15,
      checkInLateMinutes: 10,
      checkOutEarlyMinutes: 0,
      checkOutLateMinutes: 15,
    },
  });

  // set form khi mở drawer
  useEffect(() => {
    if (lab && isOpen) {
      setFormData({
        name: lab.name || '',
        startTime: lab.startTime || '08:00',
        endTime: lab.endTime || '17:00',
        total: lab.total ?? 30,
        status: lab.status || 'active',
        mentor:
          typeof lab.mentor === 'string' ? lab.mentor : lab.mentor?._id || '',
        description: lab.description || '',
        attendanceRule: {
          checkInEarlyMinutes: lab.attendanceRule?.checkInEarlyMinutes ?? 15,
          checkInLateMinutes: lab.attendanceRule?.checkInLateMinutes ?? 10,
          checkOutEarlyMinutes: lab.attendanceRule?.checkOutEarlyMinutes ?? 0,
          checkOutLateMinutes: lab.attendanceRule?.checkOutLateMinutes ?? 15,
        },
      });

      setActiveTab('info');
    }
  }, [lab, isOpen]);

  // load mentors khi mở drawer
  useEffect(() => {
    if (!isOpen) return;

    const fetchMentors = async () => {
      try {
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
        console.error('Load mentors error:', error.response?.data || error);
      }
    };

    fetchMentors();
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

      if (onUpdated) await onUpdated();
      onClose();
    } catch (error) {
      console.error('update lab error:', error.response?.data || error);
      toast.error(error.response?.data?.message || 'Cập nhật lab thất bại');
    } finally {
      setSavingInfo(false);
    }
  };

  const handleAttendanceSubmit = async () => {
    if (!lab?._id) return;

    try {
      setSavingInfo(true);

      await labApi.updateAttendanceRule(lab._id, {
        checkInEarlyMinutes: formData.attendanceRule.checkInEarlyMinutes,
        checkInLateMinutes: formData.attendanceRule.checkInLateMinutes,
        checkOutEarlyMinutes: formData.attendanceRule.checkOutEarlyMinutes,
        checkOutLateMinutes: formData.attendanceRule.checkOutLateMinutes,
      });

      toast.success('Cập nhật cấu hình điểm danh thành công');
      if (onUpdated) await onUpdated();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cập nhật cấu hình thất bại');
    } finally {
      setSavingInfo(false);
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex justify-end bg-black/40'>
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
              className={`rounded-full px-4 py-1.5 ${
                activeTab === 'info'
                  ? 'bg-background font-medium shadow-sm'
                  : 'text-muted-foreground'
              }`}
              onClick={() => setActiveTab('info')}
            >
              Thông tin lab
            </button>

            <button
              type='button'
              className={`rounded-full px-4 py-1.5 ${
                activeTab === 'attendance'
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

              {/* Mentor */}
              {/* Mentor */}
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <div>
                  <label className='mb-1 block text-sm font-medium text-foreground'>
                    Mentor
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
                          mentor._id === formData.mentor
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

          {/* TAB ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div className='space-y-4'>
              <div className='rounded-lg border border-border p-4'>
                <h3 className='mb-3 text-sm font-semibold text-foreground'>
                  Cấu hình thời gian điểm danh
                </h3>

                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <div>
                    <label className='mb-1 block text-sm text-foreground'>
                      Check-in sớm (phút)
                    </label>
                    <Input
                      type='number'
                      min='0'
                      value={formData.attendanceRule.checkInEarlyMinutes}
                      onChange={(e) =>
                        handleRuleChange('checkInEarlyMinutes', e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className='mb-1 block text-sm text-foreground'>
                      Check-in muộn (phút)
                    </label>
                    <Input
                      type='number'
                      min='0'
                      value={formData.attendanceRule.checkInLateMinutes}
                      onChange={(e) =>
                        handleRuleChange('checkInLateMinutes', e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className='mb-1 block text-sm text-foreground'>
                      Check-out sớm (phút)
                    </label>
                    <Input
                      type='number'
                      min='0'
                      value={formData.attendanceRule.checkOutEarlyMinutes}
                      onChange={(e) =>
                        handleRuleChange('checkOutEarlyMinutes', e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className='mb-1 block text-sm text-foreground'>
                      Check-out muộn (phút)
                    </label>
                    <Input
                      type='number'
                      min='0'
                      value={formData.attendanceRule.checkOutLateMinutes}
                      onChange={(e) =>
                        handleRuleChange('checkOutLateMinutes', e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className='mt-6 flex justify-end gap-2'>
                  <Button type='button' variant='outline' onClick={onClose}>
                    Đóng
                  </Button>

                  <Button
                    type='button'
                    onClick={handleAttendanceSubmit}
                    disabled={savingInfo}
                  >
                    {savingInfo ? 'Đang lưu...' : 'Lưu cấu hình'}
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
