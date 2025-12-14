import React from "react";
import FaceCamera from "../../components/student/FaceCamera";
import attendanceApi from "../../api/attendanceApi";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const FaceRegisterPage = () => {
  const navigate = useNavigate();

  const handleCapture = async (base64) => {
    try {
      const res = await attendanceApi.registerFace(base64);
      toast.success("Đăng ký khuôn mặt thành công!");
      navigate("/student"); 
    } catch (err) {
      toast.error(err.response?.data?.message || "Đăng ký thất bại");
    }
  };

  return (
    <div className="container py-5 text-center">
      <h2 className="fw-bold mb-4">Đăng ký khuôn mặt</h2>
      <p className="text-secondary mb-4">
        Đưa khuôn mặt của bạn vào khung hình và nhấn "Chụp ảnh".
      </p>

      <FaceCamera onCapture={handleCapture} />
    </div>
  );
};

export default FaceRegisterPage;
