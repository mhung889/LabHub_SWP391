import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Users, Mail, Phone, Calendar } from 'lucide-react';
import studentApi from '@/api/studentApi';

export default function MentorStudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const res = await studentApi.getMyStudents();
      setStudents(res.data.students || []);
    } catch (error) {
      console.error('Error loading students:', error);
      alert(error.response?.data?.message || 'Lỗi khi tải danh sách sinh viên');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <p className='text-muted-foreground'>Đang tải...</p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div>
        <div className='flex items-center justify-between'>
          <h1 className='text-2xl font-bold text-foreground'>
            Sinh Viên Của Tôi
          </h1>
        </div>
      </div>

      <Card className='overflow-hidden'>
        {students.length === 0 ? (
          <div className='p-12 text-center text-muted-foreground'>
            <Users className='w-16 h-16 mx-auto mb-4 opacity-50' />
            <p className='text-lg font-medium mb-2'>Chưa có sinh viên nào</p>
            <p className='text-sm'>
              Sinh viên sẽ xuất hiện ở đây sau khi được gán vào lab của bạn
            </p>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-muted border-b border-border'>
                <tr>
                  <th className='text-left px-6 py-4 font-bold text-foreground'>
                    Họ Tên
                  </th>
                  <th className='text-left px-6 py-4 font-bold text-foreground'>
                    Email
                  </th>
                  <th className='text-left px-6 py-4 font-bold text-foreground'>
                    Số Điện Thoại
                  </th>
                  <th className='text-left px-6 py-4 font-bold text-foreground'>
                    Lab
                  </th>
                  <th className='text-left px-6 py-4 font-bold text-foreground'>
                    Trạng Thái
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-border'>
                {students.map((student) => (
                  <tr
                    key={student._id}
                    className='hover:bg-muted/50 transition-colors'
                  >
                    <td className='px-6 py-4 text-foreground font-medium'>
                      {student.fullName}
                    </td>
                    <td className='px-6 py-4 text-muted-foreground'>
                      {student.email}
                    </td>
                    <td className='px-6 py-4 text-muted-foreground'>
                      {student.phoneNumber || 'Chưa cập nhật'}
                    </td>
                    <td className='px-6 py-4 text-muted-foreground'>
                      {student.labName || 'N/A'}
                    </td>
                    <td className='px-6 py-4'>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          student.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : 'bg-red-500/10 text-red-600'
                        }`}
                      >
                        {student.status === 'active'
                          ? 'Hoạt động'
                          : 'Không hoạt động'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
