import { X } from 'lucide-react';

export default function AdminLabDetailModal({ isOpen, onClose, lab }) {
  if (!isOpen || !lab) return null;

  const getStatusLabel = (status) => {
    if (status === 'active') return 'Active';
    if (status === 'inactive') return 'InActive';
    return 'Không rõ';
  };

  const statusColor =
    lab.status === 'active'
      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
      : 'bg-rose-100 text-rose-700 border-rose-200';

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40'>
      {/* Modal container */}
      <div className='w-full max-w-2xl rounded-xl bg-background shadow-xl border border-border'>
        {/* HEADER */}
        <div className='flex items-center justify-between border-b border-border px-4 py-3'>
          <div>
            <h2 className='text-lg font-semibold text-foreground'>
              {lab.name}
            </h2>
            <p className='text-sm text-muted-foreground'>
              {lab.code ? (
                <span className='text-sm text-muted-foreground'>
                  Mã lớp: {lab.code}
                </span>
              ) : null}
            </p>
          </div>
          <button
            onClick={onClose}
            className='rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground'
          >
            <X className='h-5 w-5' />
          </button>
        </div>

        {/* BODY */}
        <div className='max-h-[70vh] overflow-y-auto px-4 py-4 space-y-4'>
          {/* Status badge */}
          <div className='flex items-center gap-2 text-sm'>
            <span className='text-muted-foreground'>Trạng thái:</span>
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColor}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  lab.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              />
              {getStatusLabel(lab.status)}
            </span>
          </div>

          {/* Description FIRST */}
          <div className='rounded-lg border border-border bg-muted/40 px-3 py-3'>
            <p className='mb-1 text-sm font-medium text-foreground'>Mô tả</p>
            <p className='text-sm text-muted-foreground whitespace-pre-line'>
              {lab.description && lab.description.trim()
                ? lab.description
                : 'Chưa có mô tả cho lab này.'}
            </p>
          </div>

          {/* Info list UNDER description */}
          <div className='grid grid-cols-1 gap-3 md:grid-cols-2 text-sm'>
            <div className='space-y-1'>
              <p className='text-xs font-medium uppercase text-muted-foreground'>
                Thời gian OJT
              </p>
              <p className='text-foreground'>
                {lab.startTime || '--:--'} - {lab.endTime || '--:--'}
              </p>
            </div>

            <div className='space-y-1'>
              <p className='text-xs font-medium uppercase text-muted-foreground'>
                Sức chứa
              </p>
              <p className='text-foreground'>
                {lab.total ?? 0} 
              </p>
            </div>

            {/* <div className='space-y-1'>
              <p className='text-xs font-medium uppercase text-muted-foreground'>
                Chuyên ngành
              </p>
              <p className='text-foreground'>
                {lab.major && typeof lab.major === 'object'
                  ? lab.major.name || lab.major.code
                  : lab.major || 'Chưa gán chuyên ngành'}
              </p>
            </div> */}

            <div className='space-y-1'>
              <p className='text-xs font-medium uppercase text-muted-foreground'>
                Mentor 
              </p>
              {lab.mentor ? (
                <div className='text-foreground'>
                  <p>{lab.mentor.fullName || 'Không rõ tên'}</p>
                  {lab.mentor.email && (
                    <p className='text-xs text-muted-foreground'>
                      {lab.mentor.email}
                    </p>
                  )}
                </div>
              ) : (
                <p className='text-foreground'>Chưa có mentor phụ trách</p>
              )}
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div className='flex justify-end border-t border-border px-4 py-3'>
          <button
            type='button'
            onClick={onClose}
            className='inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-1.5 text-sm font-medium text-foreground hover:bg-muted'
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
