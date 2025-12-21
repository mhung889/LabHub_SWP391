

import React from 'react';
import { Modal, Badge } from 'react-bootstrap';

const statusBadge = (s) => {
  switch (s) {
    case 'pending':
      return (
        <Badge bg='warning' text='dark'>
          Pending
        </Badge>
      );
    case 'approved':
      return <Badge bg='success'>Approved</Badge>;
    case 'rejected':
      return <Badge bg='danger'>Rejected</Badge>;
    case 'cancelled':
      return <Badge bg='secondary'>Cancelled</Badge>;
    default:
      return (
        <Badge bg='light' text='dark'>
          {s}
        </Badge>
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
  if (!d) return '-';
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return '-';
  return x.toLocaleDateString('vi-VN');
};

const fmtDateTime = (d) => {
  if (!d) return '-';
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return '-';
  return x.toLocaleString('vi-VN');
};

export default function LeaveRequestDetailModal({
  show,
  onClose,
  data,
  role, // optional: "student" | "mentor"
}) {
  if (!data) return null;

  const createdAt = data?.createdAt || null;
  const updatedAt = data?.updatedAt || null;
  const approvedAt = data?.approvedAt || null;

  const showUpdated =
    createdAt &&
    updatedAt &&
    new Date(updatedAt).getTime() !== new Date(createdAt).getTime();

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Chi tiết đơn xin nghỉ</Modal.Title>
      </Modal.Header>

      <Modal.Body className='small'>
        {/* Main info */}
        <p className='mb-2'>
          <strong>Lab:</strong> {data?.lab?.name || '-'}
        </p>

        {/* Mentor usually wants student info */}
        {role === 'mentor' && (
          <p className='mb-2'>
            <strong>Sinh viên:</strong> {data?.student?.user?.fullName || '—'}
            {data?.student?.studentCode ? (
              <span className='text-muted'> ({data.student.studentCode})</span>
            ) : null}
          </p>
        )}

        {/* <p className='mb-2'>
          <strong>Loại nghỉ:</strong> {leaveTypeLabel(data?.leaveType)}
        </p> */}

        <p className='mb-2'>
          <strong>Thời gian:</strong> {fmtDate(data?.startDate)} →{' '}
          {fmtDate(data?.endDate)}
        </p>

        <p className='mb-2'>
          <strong>Số ngày:</strong> {data?.totalDays ?? '-'}
        </p>

        <p className='mb-2'>
          <strong>Trạng thái:</strong> {statusBadge(data?.status)}
        </p>

        {/* Reason */}
        <p className='mt-3 mb-2'>
          <strong>Lý do:</strong>
        </p>
        <div className='border rounded p-2 bg-light'>{data?.reason || '-'}</div>

        {/* Mentor note */}
        {data?.note && (
          <>
            <p className='mt-3 mb-2'>
              <strong>Ghi chú Mentor:</strong>
            </p>
            <div className='border rounded p-2 bg-light'>{data.note}</div>
          </>
        )}

        {/* System meta */}
        <hr className='my-3' />

        <p className='mb-2'>
          <strong>Ngày tạo:</strong> {fmtDateTime(createdAt)}
        </p>

        {showUpdated && (
          <p className='mb-2'>
            <strong>Cập nhật lần cuối:</strong> {fmtDateTime(updatedAt)}
          </p>
        )}

        {/* Approved/Rejected time */}
        {approvedAt && (
          <p className='mb-0'>
            <strong>Ngày xử lý:</strong> {fmtDateTime(approvedAt)}
          </p>
        )}
      </Modal.Body>
    </Modal>
  );
}
