import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Form, Button, Alert, Row, Col } from 'react-bootstrap';

const toDateInput = (d) => {
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
};

export default function CreateLeaveRequestModal({
  show,
  onClose,
  onSubmit,
  submitting = false,
  labId,
}) {
  const [formErr, setFormErr] = useState('');
  const [formData, setFormData] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const { minDate, maxDate } = useMemo(() => {
    const today = new Date();
    const max = new Date();
    max.setMonth(max.getMonth() + 1);
    return { minDate: toDateInput(today), maxDate: toDateInput(max) };
  }, []);

  useEffect(() => {
    if (!show) return;
    setFormErr('');
    setFormData({
      leaveType: '',
      startDate: '',
      endDate: '',
      reason: '',
    });
  }, [show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErr('');

    // if (!formData.leaveType) {
    //   setFormErr('Vui lòng chọn loại nghỉ.');
    //   return;
    // }
    // if (!formData.startDate) {
    //   setFormErr('Vui lòng chọn ngày bắt đầu.');
    //   return;
    // }
    // if (!formData.reason.trim()) {
    //   setFormErr('Vui lòng nhập lý do.');
    //   return;
    // }

    const payload = {
      lab: labId,
      leaveType: formData.leaveType,
      startDate: formData.startDate,
      endDate: formData.endDate || formData.startDate,
      reason: formData.reason.trim(),
    };

    await onSubmit(payload, setFormErr);
  };

  return (
    <Modal
      show={show}
      onHide={() => !submitting && onClose()}
      centered
      backdrop={submitting ? 'static' : true}
      keyboard={!submitting}
      size='md'
    >
      <Modal.Header closeButton={!submitting} className='border-0 pb-0'>
        <Modal.Title className='fw-semibold'>Tạo đơn xin nghỉ</Modal.Title>
      </Modal.Header>

   
      <Form onSubmit={handleSubmit} noValidate>
        <Modal.Body className='pt-3'>
          {/* {formErr && (
            <Alert variant='danger' className='mb-3'>
              {formErr}
            </Alert>
          )} */}

          {/* <Form.Group className='mb-3'>
            <Form.Label className='fw-medium'>Loại đơn</Form.Label>
            <Form.Select
              name='leaveType'
              value={formData.leaveType}
              onChange={handleChange}
              className='custom-input'
            >
              <option value=''>Chọn loại nghỉ</option>
              <option value='personal'>Nghỉ cá nhân</option>
              <option value='sick'>Nghỉ ốm</option>
              <option value='schoolActivity'>Hoạt động trường</option>
            </Form.Select>
          </Form.Group> */}

          <Form.Label className='fw-medium mb-2'>Khoảng thời gian</Form.Label>
          <Row className='g-2 mb-3'>
            <Col md={6}>
              <Form.Control
                type='date'
                name='startDate'
                value={formData.startDate}
                onChange={handleChange}
                min={minDate}
                max={maxDate}
                className='custom-input'
              />
            </Col>
            <Col md={6}>
              <Form.Control
                type='date'
                name='endDate'
                value={formData.endDate}
                onChange={handleChange}
                min={formData.startDate || minDate}
                max={maxDate}
                className='custom-input'
              />
            </Col>
          </Row>

          <Form.Group>
            <Form.Label className='fw-medium'>Lý do</Form.Label>
            <Form.Control
              as='textarea'
              rows={4}
              name='reason'
              value={formData.reason}
              onChange={handleChange}
              className='custom-input'
              placeholder='Nhập lý do xin nghỉ...'
            />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer className='border-0 pt-0'>
          <Button
            variant='outline-secondary'
            onClick={() => !submitting && onClose()}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type='submit'
            className='bg-primary-custom border-0 px-4'
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
