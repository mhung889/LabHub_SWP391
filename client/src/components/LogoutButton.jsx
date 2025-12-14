import React from "react";
import { Button } from "react-bootstrap";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { clearStorage } from "../utils/storage";

const LogoutButton = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearStorage();
    toast.success("Đã đăng xuất");
    navigate("/login");
  };

  return (
    <Button
      variant="light"
      className="w-100 fw-bold text-secondary py-2"
      onClick={handleLogout}
    >
      Đăng xuất
    </Button>
  );
};

export default LogoutButton;
