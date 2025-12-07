import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

export default function CreateLabModal({
  isOpen,
  onClose,
  onSubmit,
  mentors = [],
  majors = [],
}) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    startTime: '08:00',
    endTime: '17:00',
    total: 30,
    major: '',
    mentor: '',
    description: '',
    status: 'active',
  });

  // lỗi nhưng CHỈ hiện sau khi submit
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const newErrors = {};

    // validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Tên lab là bắt buộc';
    } else if (formData.name.trim().length < 10) {
      newErrors.name = 'Tên lab phải có ít nhất 10 ký tự';
    }

    // validate code
    // if (!formData.code.trim()) {
    //   newErrors.code = 'Mã lab là bắt buộc';
    // }

    // if (!formData.major) {
    //   newErrors.major = 'Vui lòng chọn ngành';
    // }

    // if (!formData.mentor) {
    //   newErrors.mentor = 'Vui lòng chọn mentor';
    // }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === 'total' ? parseInt(value || '0', 10) : value,
    }));

    // nếu đã submit rồi thì update lỗi luôn
    if (submitted) {
      setErrors(validate());
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true); 

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    // submit thành công
    onSubmit(formData);

    // reset form
    setFormData({
      name: '',
      code: '',
      startTime: '08:00',
      endTime: '17:00',
      total: 30,
      major: '',
      mentor: '',
      description: '',
      status: 'active',
    });

    setErrors({});
    setSubmitted(false); // reset trạng thái submit
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
      <div className='max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-background'>
        
        {/* Header */}
        <div className='sticky top-0 flex items-center justify-between border-b border-border bg-background p-6'>
          <h2 className='text-xl font-bold text-foreground'>Tạo Lab Mới</h2>
          <button
            type='button'
            onClick={onClose}
            className='text-muted-foreground hover:text-foreground'
          >
            <X className='h-5 w-5' />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className='space-y-6 p-6'>
          
          {/* Row 1 */}
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            {/* Name */}
            <div>
              <label className='mb-2 block text-sm font-medium text-foreground'>
                Tên Lab 
              </label>
              <Input
                name='name'
                value={formData.name}
                onChange={handleChange}
                placeholder='VD: Frontend Development'
              />
              {errors.name && (
                <p className='mt-1 text-xs text-destructive'>{errors.name}</p>
              )}
            </div>
          
          </div>

          {/* Row 2: Start - End time */}
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <div>
              <label className='mb-2 block text-sm font-medium text-foreground'>
                Giờ Bắt Đầu
              </label>
              <Input
                name='startTime'
                type='time'
                value={formData.startTime}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className='mb-2 block text-sm font-medium text-foreground'>
                Giờ Kết Thúc
              </label>
              <Input
                name='endTime'
                type='time'
                value={formData.endTime}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Row 3: Total */}
          <div>
            <label className='mb-2 block text-sm font-medium text-foreground'>
              Sức Chứa 
            </label>
            <Input
              name='total'
              type='number'
              min='1'
              max='200'
              value={formData.total}
              onChange={handleChange}
            />
          </div>

          {/* Row 4: Major & Mentor */}
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <div>
              <label className='mb-2 block text-sm font-medium text-foreground'>
               Chuyên Ngành 
              </label>
              <select
                name='major'
                value={formData.major}
                onChange={handleChange}
                className='w-full rounded-lg border border-border bg-background px-3 py-2'
              >
                <option value=''>-- Chọn ngành --</option>
                {majors.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name}
                  </option>
                ))}
              </select>
              {errors.major && (
                <p className='mt-1 text-xs text-destructive'>{errors.major}</p>
              )}
            </div>

            <div>
              <label className='mb-2 block text-sm font-medium text-foreground'>
                Mentor 
              </label>
              <select
                name='mentor'
                value={formData.mentor}
                onChange={handleChange}
                className='w-full rounded-lg border border-border bg-background px-3 py-2'
              >
                <option value=''>-- Chọn mentor --</option>
                {mentors.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.fullName}
                  </option>
                ))}
              </select>
              {errors.mentor && (
                <p className='mt-1 text-xs text-destructive'>{errors.mentor}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className='mb-2 block text-sm font-medium text-foreground'>
              Mô tả
            </label>
            <textarea
              name='description'
              value={formData.description}
              onChange={handleChange}
              rows='4'
              className='w-full rounded-lg border border-border bg-background px-3 py-2 resize-none'
            />
          </div>

          {/* Actions */}
          <div className='flex justify-end gap-2'>
            <Button type='button' variant='outline' onClick={onClose}>
              Hủy
            </Button>
            <Button type='submit'>Tạo Lab</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
