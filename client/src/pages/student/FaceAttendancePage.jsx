import React, { useState } from "react";
import FaceCamera from "../../components/student/FaceCamera";
import attendanceApi from "../../api/attendanceApi";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const FaceAttendancePage = () => {
  const [mode, setMode] = useState("checkin"); // checkin hoặc checkout
  const navigate = useNavigate();

  const handleCapture = async (base64) => {
    try {
      let response;

      if (mode === "checkin") {
        response = await attendanceApi.checkin(base64);
      } else {
        response = await attendanceApi.checkout(base64);
      }

      toast.success(response.data.message);
      navigate("/student"); // quay lại dashboard sau khi điểm danh thành công
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi điểm danh");
    }
  };

  return (
    <div className="container py-5 text-center">
      <h2 className="fw-bold mb-4">Điểm danh bằng khuôn mặt</h2>

      <div className="d-flex justify-content-center gap-3 mb-4">
        <button
          className={`btn ${mode === "checkin" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => setMode("checkin")}
        >
          Check-in
        </button>

        <button
          className={`btn ${mode === "checkout" ? "btn-danger" : "btn-outline-danger"}`}
          onClick={() => setMode("checkout")}
        >
          Check-out
        </button>
      </div>

      <FaceCamera onCapture={handleCapture} />
    </div>
  );
};

export default FaceAttendancePage;
