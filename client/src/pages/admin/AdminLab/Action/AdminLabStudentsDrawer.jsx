import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { X, UserPlus, Trash } from 'lucide-react';
import labApi from '@/api/labApi';
import AddStudentsModal from './AddStudentsModal';

export default function AdminLabStudentsDrawer({ isOpen, onClose, lab }) {
  const [labStudents, setLabStudents] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  // modal
  const [addModalOpen, setAddModalOpen] = useState(false);

  // pagination
  const PAGE_SIZE = 12;
  const [studentPage, setStudentPage] = useState(1);

  const totalStudentPages = useMemo(
    () => Math.ceil(labStudents.length / PAGE_SIZE) || 1,
    [labStudents.length]
  );

  const paginatedStudents = useMemo(() => {
    const start = (studentPage - 1) * PAGE_SIZE;
    const end = studentPage * PAGE_SIZE;
    return labStudents.slice(start, end);
  }, [labStudents, studentPage]);

  const fetchLabStudents = async () => {
    if (!lab?._id) return;
    try {
      setStudentsLoading(true);
      const res = await labApi.getStudentsByLabId(lab._id);
      const data = res.data || {};
      setLabStudents(data.students || []);
      setAvailableStudents(data.availableStudents || []);
      setStudentPage(1);
    } catch (error) {
      console.error('fetchLabStudents error:', error.response?.data || error);
      toast.error('Không thể tải danh sách sinh viên của lab');
    } finally {
      setStudentsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !lab?._id) return;
    fetchLabStudents();
  }, [isOpen, lab?._id]);

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

  const handleAddManyStudents = async (studentIds) => {
    if (!lab?._id || !studentIds?.length) return;

    try {
      setStudentsLoading(true);

      // await Promise.all(
      //   studentIds.map((id) =>
      //     labApi.addStudentToLab(lab._id, { studentId: id })
      //   )
      // );

      for (const id of studentIds) {
        await labApi.addStudentToLab(lab._id, { studentId: id });
      }

      toast.success(`Thêm ${studentIds.length} sinh viên thành công`);
      setAddModalOpen(false);
      await fetchLabStudents();
    } catch (error) {
      console.error('addManyStudents error:', error.response?.data || error);
      toast.error(error.response?.data?.message || 'Không thể thêm sinh viên');
    } finally {
      setStudentsLoading(false);
    }
  };

  if (!isOpen || !lab) return null;

  return (
    <>
      <div className='fixed inset-0 z-50 flex justify-end bg-black/40'>
        <div className='flex h-full w-full flex-col bg-background shadow-xl md:w-2/3 lg:w-1/2'>
          {/* HEADER */}
          <div className='flex items-center justify-between border-b border-border px-4 py-3'>
            <div>
              <h2 className='text-sm text-muted-foreground'>{lab.name}</h2>
            </div>

            <div className='flex items-center gap-2'>
              <Button
                type='button'
                className='gap-2'
                onClick={() => setAddModalOpen(true)}
                disabled={studentsLoading}
              >
                <UserPlus className='h-4 w-4' />
              </Button>

              <button
                onClick={onClose}
                className='rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground'
              >
                <X className='h-5 w-5' />
              </button>
            </div>
          </div>

          {/* BODY */}
          <div className='flex-1 overflow-y-auto p-4 space-y-4 mt-10'>
            {/* Empty */}
            {!studentsLoading && labStudents.length === 0 && (
              <div className='rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground'>
                Chưa có sinh viên nào
              </div>
            )}

            {/* Table */}
            <div className='overflow-x-auto rounded-lg border border-border bg-background'>
              <table className='min-w-full text-sm'>
                <thead className='bg-muted/60'>
                  <tr>
                    <th className='px-3 py-2 text-left font-medium'>No</th>
                    <th className='px-3 py-2 text-left font-medium'>Mã SV</th>
                    <th className='px-3 py-2 text-left font-medium'>
                      FullName
                    </th>
                    <th className='px-3 py-2 text-left font-medium'>
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

                  {!studentsLoading &&
                    paginatedStudents.map((s, index) => (
                      <tr key={s._id} className='border-t border-border'>
                        <td className='px-3 py-2'>
                          {(studentPage - 1) * PAGE_SIZE + index + 1}
                        </td>
                        <td className='px-3 py-2'>{s.studentCode}</td>
                        <td className='px-3 py-2'>{s.user?.fullName}</td>
                        <td className='px-3 py-2'>{s.major?.name}</td>
                        <td className='px-3 py-2 text-center'>
                          <button
                            type='button'
                            className='text-destructive hover:opacity-80'
                            onClick={() => handleRemoveStudent(s._id)}
                            disabled={studentsLoading}
                          >
                            <Trash className='w-3 h-3' />
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
                      setStudentPage((p) => Math.min(totalStudentPages, p + 1))
                    }
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className='border-t border-border p-4 flex justify-end'>
            <Button variant='outline' onClick={onClose}>
              Đóng
            </Button>
          </div>
        </div>
      </div>

      <AddStudentsModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        availableStudents={availableStudents}
        onConfirm={handleAddManyStudents}
        loading={studentsLoading}
      />
    </>
  );
}
