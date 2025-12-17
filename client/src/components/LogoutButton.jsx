import React, { useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { clearStorage } from "../utils/storage";

const LogoutButton = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const handleConfirmLogout = () => {
    clearStorage();
    toast.success("Đã đăng xuất");
    navigate("/login");
  };

  return (
    <>
      {/* Nút logout */}
      <Button
        variant="light"
        className="w-100 fw-bold text-secondary py-2"
        onClick={() => setShowModal(true)}
      >
        Đăng xuất
      </Button>

      {/* Modal xác nhận */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận đăng xuất</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowModal(false)}
          >
            Hủy
          </Button>

          <Button
            variant="danger"
            onClick={handleConfirmLogout}
          >
            Đăng xuất
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default LogoutButton;
