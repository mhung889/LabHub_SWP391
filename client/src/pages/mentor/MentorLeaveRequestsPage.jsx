import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Eye, FileText, Workflow, ArrowLeftToLine,ArrowRightToLine } from 'lucide-react';
import { toast } from 'sonner';

import leaveRequestApi from '@/api/leaveRequestApi';
import LeaveRequestDetailModal from '../student/leave-request/LeaveRequestDetailModal';

/* ================= helpers ================= */

const PAGE_SIZE = 5;

const statusPill = (s) => {
  const base =
    'inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold';
  switch (s) {
    case 'pending':
      return (
        <span className={`${base} bg-amber-500/10 text-amber-600`}>
          Pending
        </span>
      );
    case 'approved':
      return (
        <span className={`${base} bg-emerald-500/10 text-emerald-600`}>
          Approved
        </span>
      );
    case 'rejected':
      return (
        <span className={`${base} bg-rose-500/10 text-rose-600`}>Rejected</span>
      );
    case 'cancelled':
      return (
        <span className={`${base} bg-slate-500/10 text-slate-600`}>
          Cancelled
        </span>
      );
    default:
      return (
        <span className={`${base} bg-slate-500/10 text-slate-600`}>{s}</span>
      );
  }
};

const leaveTypeLabel = (t) => {
  switch (t) {
    case 'personal':
      return 'Nghỉ cá nhân';
    case 'sick':
      return 'Nghỉ ốm';
    case 'schoolActivity':
      return 'Hoạt động trường';
    default:
      return t;
  }
};

const fmtDate = (d) => {
  if (!d) return '—';
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return '—';
  return x.toLocaleDateString('vi-VN');
};

/* ================= component ================= */

export default function MentorLeaveRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [leaveType, setLeaveType] = useState('');

  // pagination
  const [page, setPage] = useState(1);

  // detail modal
  const [openDetail, setOpenDetail] = useState(false);
  const [selected, setSelected] = useState(null);

  // process modal
  const [openProcess, setOpenProcess] = useState(false);
  const [processing, setProcessing] = useState(false);

  const loadAll = async () => {
    try {
      setLoading(true);
      const res = await leaveRequestApi.getAll(); // mentor only
      setRequests(res?.data?.leaveRequests || []);
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Không tải được danh sách đơn');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    return requests.filter((r) => {
      const okStatus = status ? r.status === status : true;
      const okType = leaveType ? r.leaveType === leaveType : true;

      const hay = `
        ${r?.student?.user?.fullName || ''}
        ${r?.student?.studentCode || ''}
        ${r?.lab?.name || ''}
      `.toLowerCase();

      const okQ = keyword ? hay.includes(keyword) : true;
      return okStatus && okType && okQ;
    });
  }, [requests, q, status, leaveType]);

  // reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [q, status, leaveType]);

  // pagination computed
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  useEffect(() => {
    // nếu totalPages giảm (do filter), clamp lại page
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const canPrev = page > 1;
  const canNext = page < totalPages;

  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));
  const goTo = (p) => setPage(Math.min(Math.max(1, p), totalPages));

  const openDetailModal = (r) => {
    setSelected(r);
    setOpenDetail(true);
  };

  const openProcessModal = (r) => {
    if (r?.status !== 'pending') {
      toast.error('Chỉ xử lý đơn ở trạng thái Pending');
      return;
    }
    setSelected(r);
    setOpenProcess(true);
  };

  const handleApprove = async (id) => {
    try {
      setProcessing(true);
      await leaveRequestApi.approve(id);
      toast.success('Duyệt đơn thành công');
      setOpenProcess(false);
      await loadAll();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Duyệt đơn thất bại');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (id, note) => {
    try {
      setProcessing(true);
      await leaveRequestApi.reject(id, { note });
      toast.success('Từ chối đơn thành công');
      setOpenProcess(false);
      await loadAll();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Từ chối đơn thất bại');
    } finally {
      setProcessing(false);
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
      {/* Header */}
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold text-foreground'>Quản Lý Đơn Nghỉ</h1>
      </div>

      {/* Filters */}
      <Card className='p-4'>
        <div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
          <div className='md:col-span-1'>
            <label className='text-sm font-semibold text-foreground'>
              Tìm kiếm
            </label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder='Tên SV / mã SV / lab...'
              className='mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary'
            />
          </div>

          <div>
            <label className='text-sm font-semibold text-foreground'>
              Trạng thái
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className='mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary'
            >
              <option value=''>Tất cả</option>
              <option value='pending'>Pending</option>
              <option value='approved'>Approved</option>
              <option value='rejected'>Rejected</option>
              <option value='cancelled'>Cancelled</option>
            </select>
          </div>

          <div>
            <label className='text-sm font-semibold text-foreground'>
              Loại nghỉ
            </label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className='mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary'
            >
              <option value=''>Tất cả</option>
              <option value='personal'>Nghỉ cá nhân</option>
              <option value='sick'>Nghỉ ốm</option>
              <option value='schoolActivity'>Hoạt động trường</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className='overflow-hidden'>
        {filtered.length === 0 ? (
          <div className='p-12 text-center text-muted-foreground'>
            <FileText className='w-16 h-16 mx-auto mb-4 opacity-50' />
            <p className='text-lg font-medium mb-2'>Chưa có đơn nào</p>
            <p className='text-sm'>
              Đơn xin nghỉ của sinh viên sẽ hiển thị tại đây
            </p>
          </div>
        ) : (
          <>
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead className='bg-muted border-b border-border'>
                  <tr>
                    <th className='text-left px-6 py-4 font-bold text-foreground'>
                      Sinh viên
                    </th>
                    <th className='text-left px-6 py-4 font-bold text-foreground'>
                      Lab
                    </th>
                    <th className='text-left px-6 py-4 font-bold text-foreground'>
                      Loại nghỉ
                    </th>
                    <th className='text-left px-6 py-4 font-bold text-foreground'>
                      Từ ngày
                    </th>
                    <th className='text-left px-6 py-4 font-bold text-foreground'>
                      Đến ngày
                    </th>
                    <th className='text-left px-2 py-4 font-bold text-foreground'>
                      Tổng
                    </th>
                    <th className='text-left px-6 py-4 font-bold text-foreground'>
                      Trạng thái
                    </th>
                    <th className='text-right px-6 py-4 font-bold text-foreground'>
                      Thao tác
                    </th>
                  </tr>
                </thead>

                <tbody className='divide-y divide-border'>
                  {paginated.map((r) => (
                    <tr
                      key={r._id}
                      className='hover:bg-muted/50 transition-colors'
                    >
                      <td className='px-6 py-4 text-foreground font-medium'>
                        <div className='flex flex-col'>
                          <span>{r?.student?.user?.fullName || '—'}</span>
                          <span className='text-xs text-muted-foreground'>
                            {r?.student?.studentCode || ''}
                          </span>
                        </div>
                      </td>

                      <td className='px-6 py-4 text-muted-foreground'>
                        {r?.lab?.name || '—'}
                      </td>

                      <td className='px-6 py-4 text-muted-foreground'>
                        {leaveTypeLabel(r.leaveType)}
                      </td>

                      <td className='px-6 py-4 text-muted-foreground'>
                        {fmtDate(r.startDate)}
                      </td>
                      <td className='px-6 py-4 text-muted-foreground'>
                        {fmtDate(r.endDate)}
                      </td>

                      <td className='px-6 py-4 text-muted-foreground'>
                        {r?.totalDays ?? '—'}
                      </td>

                      <td className='px-6 py-4'>{statusPill(r.status)}</td>

                      <td className='py-4 pr-10'>
                        <div className='flex justify-end gap-3'>
                          <button
                            type='button'
                            onClick={() => openDetailModal(r)}
                            title='Xem chi tiết'
                            className='rounded-lg p-2 hover:bg-muted transition'
                          >
                            <Eye className='w-4 h-4' />
                          </button>

                          <button
                            type='button'
                            onClick={() => openProcessModal(r)}
                            title='Xử lý đơn'
                            disabled={r?.status !== 'pending'}
                            className='rounded-lg p-2 hover:bg-muted transition disabled:opacity-40 disabled:hover:bg-transparent'
                          >
                            <Workflow className='w-4 h-4' />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-6 py-4 border-t border-border'>
              <p className='text-sm text-muted-foreground'>
              
              </p>

              <div className='flex items-center gap-2 justify-end'>
                <button
                  type='button'
                  onClick={goPrev}
                  disabled={!canPrev}
                  className='rounded-xl border border-border px-3 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed'
                >
                 <ArrowLeftToLine className='w-4 h-4'/>
                </button>

                {/* Page numbers (simple) */}
                <div className='flex items-center gap-1'>
                  {Array.from({ length: Math.min(totalPages, 7) }).map(
                    (_, idx) => {
                      const p = idx + 1;
                      const active = p === page;
                      return (
                        <button
                          key={p}
                          type='button'
                          onClick={() => goTo(p)}
                          className={`h-9 w-9 rounded-xl border text-sm font-semibold transition ${
                            active
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border hover:bg-muted'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    }
                  )}

                  {totalPages > 7 && (
                    <>
                      <span className='px-2 text-sm text-muted-foreground'>
                        …
                      </span>
                      <button
                        type='button'
                        onClick={() => goTo(totalPages)}
                        className={`h-9 w-9 rounded-xl border text-sm font-semibold transition ${
                          page === totalPages
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border hover:bg-muted'
                        }`}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>

                <button
                  type='button'
                  onClick={goNext}
                  disabled={!canNext}
                  className='rounded-xl border border-border px-3 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  <ArrowRightToLine className='w-4 h-4'/>
                </button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Detail Modal */}
      <LeaveRequestDetailModal
        show={openDetail}
        onClose={() => setOpenDetail(false)}
        data={selected}
        role='mentor'
      />

      {/* Process Modal */}
      <ProcessLeaveRequestModal
        open={openProcess}
        onClose={() => !processing && setOpenProcess(false)}
        data={selected}
        processing={processing}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
}

/*================= Process Modal (mentor) =================*/

function ProcessLeaveRequestModal({
  open,
  onClose,
  data,
  processing = false,
  onApprove,
  onReject,
}) {
  const [mode, setMode] = useState(''); // '' | 'approve' | 'reject'
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!open) return;
    setMode('');
    setNote('');
  }, [open]);

  const studentName = data?.student?.user?.fullName || '—';
  const studentCode = data?.student?.studentCode || '';
  const labName = data?.lab?.name || '—';
  const submittedAt = data?.createdAt ? fmtDate(data.createdAt) : '—';

  const handleProcess = async () => {
    if (!data?._id) return;

    if (!mode) {
      toast.error('Vui lòng chọn Approve hoặc Reject');
      return;
    }

    if (mode === 'approve') {
      await onApprove?.(data._id);
      return;
    }

    const reason = note.trim();
    if (!reason) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    await onReject?.(data._id, reason);
  };

  if (!open) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center'>
      {/* backdrop */}
      <div
        className='absolute inset-0 bg-black/40'
        onClick={() => !processing && onClose?.()}
      />

      {/* modal */}
      <div className='relative w-[92vw] max-w-xl rounded-2xl bg-white shadow-xl overflow-visible'>
        {/* header */}
        <div className='flex items-start justify-between px-6 pt-6'>
          <div>
            <h3 className='text-xl font-bold text-foreground'>
              Xử lý đơn xin nghỉ của sinh viên
            </h3>
          </div>

          <button
            type='button'
            onClick={() => !processing && onClose?.()}
            className='rounded-lg p-2 hover:bg-muted'
            aria-label='Close'
          >
            ✕
          </button>
        </div>

        {/* content */}
        <div className='px-6 py-2'>
          <div className='grid grid-cols-2 gap-6'>
            <div>
              <p className='text-xs font-semibold text-muted-foreground'>
                Student
              </p>
              <p className='mt-1 font-semibold text-foreground'>{studentName}</p>
              {studentCode ? (
                <p className='text-sm text-muted-foreground'>{studentCode}</p>
              ) : null}
            </div>

            <div className='text-right'>
              <p className='text-xs font-semibold text-muted-foreground'>Lab</p>
              <p className='mt-1 font-semibold text-foreground'>{labName}</p>
            </div>

            <div>
              <p className='text-xs font-semibold text-muted-foreground'>
                Date Range
              </p>
              <p className='mt-1 text-foreground'>
                {fmtDate(data?.startDate)} → {fmtDate(data?.endDate)}
              </p>
            </div>

            <div className='text-right'>
              <p className='text-xs font-semibold text-muted-foreground'>
                Submitted
              </p>
              <p className='mt-1 text-foreground'>{submittedAt}</p>
            </div>

            <div>
              <p className='text-xs font-semibold text-muted-foreground'>
                Leave Type
              </p>
              <p className='mt-1 text-foreground'>
                {leaveTypeLabel(data?.leaveType)}
              </p>
            </div>

            <div className='text-right'>
              <p className='text-xs font-semibold text-muted-foreground'>
                Total Days
              </p>
              <p className='mt-1 text-foreground'>{data?.totalDays ?? '—'}</p>
            </div>
          </div>

          <div className='mt-6'>
            <p className='text-xs font-semibold text-muted-foreground'>Reason</p>
            <p className='mt-2 rounded-xl border border-border bg-muted/40 p-4 text-foreground'>
              {data?.reason || '—'}
            </p>
          </div>

          {/* actions choose */}
          <div className='mt-4 flex gap-3'>
            <button
              type='button'
              onClick={() => setMode('approve')}
              className={`flex-1 rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors ${
                mode === 'approve'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700'
                  : 'border-border hover:bg-muted'
              }`}
              disabled={processing}
            >
              Approve
            </button>

            <button
              type='button'
              onClick={() => setMode('reject')}
              className={`flex-1 rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors ${
                mode === 'reject'
                  ? 'border-rose-500 bg-rose-500/10 text-rose-700'
                  : 'border-border hover:bg-muted'
              }`}
              disabled={processing}
            >
              Reject
            </button>
          </div>

          {/* reject note */}
          {mode === 'reject' && (
            <div className='mt-3'>
              <p className='text-sm font-semibold text-foreground'>
                Lý do từ chối <span className='text-rose-600'>*</span>
              </p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className='mt-2 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary'
                placeholder='Nhập lý do từ chối...'
                disabled={processing}
              />
            </div>
          )}
        </div>

        {/* footer */}
        <div className='flex items-center justify-end gap-3 border-t border-border px-6 py-4'>
          <button
            type='button'
            onClick={() => !processing && onClose?.()}
            className='rounded-2xl border border-border px-4 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-60'
            disabled={processing}
          >
            Cancel
          </button>

          <button
            type='button'
            onClick={handleProcess}
            className='rounded-2xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60'
            disabled={processing}
          >
            {processing ? 'Processing...' : 'Process Request'}
          </button>
        </div>
      </div>
    </div>
  );
}
