import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Search, UserPlus } from 'lucide-react';

export default function AddStudentsModal({
  isOpen,
  onClose,
  availableStudents = [],
  onConfirm,
  loading = false,
}) {
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  const PAGE_SIZE = 7;
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    setSelectedIds([]);
    setPage(1);
  }, [isOpen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return availableStudents;

    return availableStudents.filter((s) => {
      const code = (s.studentCode || '').toLowerCase();
      const name = (s.user?.fullName || '').toLowerCase();
      const major = (s.major?.name || '').toLowerCase();
      return code.includes(q) || name.includes(q) || major.includes(q);
    });
  }, [availableStudents, query]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)),
    [filtered.length]
  );

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    const end = page * PAGE_SIZE;
    return filtered.slice(start, end);
  }, [filtered, page]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const clearAll = () => setSelectedIds([]);

  const handleConfirm = () => {
    if (!selectedIds.length) return;
    onConfirm?.(selectedIds);
  };

  useEffect(() => {
    if (!isOpen) return;
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page, isOpen]);

  if (!isOpen) return null;

  const startNo = (page - 1) * PAGE_SIZE + 1;
  const endNo = Math.min(page * PAGE_SIZE, filtered.length);

  return (
    <div className='fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4'>
      <div className='w-full max-w-2xl rounded-xl bg-background shadow-xl'>
        {/* Header */}
        <div className='flex items-start justify-between border-b border-border px-5 py-4'>
          <div>
            <h3 className='text-base font-semibold text-foreground'>
              Thêm sinh viên vào lớp
            </h3>
          </div>

          <button
            onClick={onClose}
            className='rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground'
          >
            <X className='h-5 w-5' />
          </button>
        </div>

        {/* Search */}
        <div className='px-5 pt-4'>
          <div className='flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2'>
            <Search className='h-4 w-4 text-muted-foreground' />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder='Tìm kiếm theo mã sinh viên, tên hoặc chuyên ngành...'
              className='border-0 p-0 shadow-none focus-visible:ring-0'
            />
          </div>
        </div>

        {/* Selected bar */}
        <div className='px-5 pt-3'>
          <div className='flex items-center justify-between rounded-lg bg-muted/60 px-4 py-2 text-sm'>
            <span className='text-foreground'>
              Đã chọn <b>{selectedIds.length}</b> sinh viên
            </span>
            <button
              type='button'
              onClick={clearAll}
              className='text-sm text-muted-foreground hover:text-foreground'
              disabled={!selectedIds.length}
            >
              Bỏ chọn tất cả
            </button>
          </div>
        </div>

        <div className='max-h-[420px] overflow-y-auto px-5 py-3'>
          <div className='overflow-hidden rounded-lg border border-border'>
            {paginated.length === 0 ? (
              <div className='py-10 text-center text-sm text-muted-foreground'>
                Không tìm thấy sinh viên phù hợp
              </div>
            ) : (
              <div className='divide-y divide-border'>
                {paginated.map((s) => {
                  const checked = selectedIds.includes(s._id);
                  return (
                    <div
                      key={s._id}
                      className={`flex items-center justify-between px-4 py-3 ${
                        checked ? 'bg-muted/40' : ''
                      }`}
                    >
                      <div className='flex items-center gap-3'>
                        <input
                          type='checkbox'
                          checked={checked}
                          onChange={() => toggleSelect(s._id)}
                          className='h-4 w-4'
                        />

                        <div className='w-24 text-sm font-semibold text-foreground'>
                          {s.studentCode}
                        </div>

                        <div className='min-w-0 text-sm text-foreground'>
                          {s.user?.fullName}
                        </div>
                      </div>

                      <span className='ml-3 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground'>
                        {s.major?.name || 'N/A'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer pagination + actions */}
        <div className='border-t border-border px-5 py-4'>
          <div className='flex items-center justify-between'>

            <div className='flex items-center gap-2'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Trước
              </Button>
              <div className='px-2 text-sm text-muted-foreground'>
                {page} / {totalPages}
              </div>
              <Button
                type='button'
                variant='outline'
                size='sm'
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Sau
              </Button>
            </div>
          </div>

          <div className='mt-4 flex justify-end gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={onClose}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button
              type='button'
              onClick={handleConfirm}
              disabled={!selectedIds.length || loading}
              className='gap-2'
            >
              <UserPlus className='h-4 w-4' />
              Thêm ({selectedIds.length})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
