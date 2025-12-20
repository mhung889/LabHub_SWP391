import React, { useState } from "react";
import FaceCamera from "../../components/student/FaceCamera";
import attendanceApi from "../../api/attendanceApi";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const FaceAttendancePage = () => {
  const [mode, setMode] = useState("checkin"); // "checkin" | "checkout"
  const [loading, setLoading] = useState(false);

  // 🔥 cooldown CHỈ cho FACE
  const [faceCooldown, setFaceCooldown] = useState(0);

  const navigate = useNavigate();

  // ===============================
  // START FACE COOLDOWN (5s)
  // ===============================
  const startFaceCooldown = (seconds = 5) => {
    setFaceCooldown(seconds);

    const interval = setInterval(() => {
      setFaceCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // ===============================
  // FACE CHECK-IN / CHECK-OUT
  // ===============================
  const handleCapture = async (base64) => {
    // ⛔ chặn spam face
    if (faceCooldown > 0) {
      toast.info(`Vui lòng chờ ${faceCooldown}s trước khi quét lại`);
      return;
    }

    try {
      setLoading(true);
      let response;

      if (mode === "checkin") {
        response = await attendanceApi.checkin({
          imageBase64: base64,
          method: "face",
        });
      } else {
        response = await attendanceApi.checkout({
          imageBase64: base64,
          method: "face",
        });
      }

      toast.success(response.data.message);
      navigate("/student");
    } catch (err) {
      const status = err.response?.status;

      if (status === 403) {
        toast.warning(
          "Hệ thống nhận diện khuôn mặt đang quá tải. Bạn có thể thử lại hoặc dùng check-in thủ công."
        );
      } else {
        toast.error(
          err.response?.data?.message || "Lỗi điểm danh bằng khuôn mặt"
        );
      }

      // 🔥 FACE FAIL → cooldown
      startFaceCooldown(5);
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // MANUAL CHECK-IN / CHECK-OUT (NO COOLDOWN)
  // ===============================
  const handleManualAttendance = async () => {
    try {
      setLoading(true);
      let response;

      if (mode === "checkin") {
        response = await attendanceApi.checkin({
          method: "manual",
        });
      } else {
        response = await attendanceApi.checkout({
          method: "manual",
        });
      }

      toast.success(response.data.message);
      navigate("/student");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Không thể điểm danh thủ công"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5 text-center">
      <h2 className="fw-bold mb-4">Điểm danh bằng khuôn mặt</h2>

      {/* MODE SWITCH */}
      <div className="d-flex justify-content-center gap-3 mb-4">
        <button
          disabled={loading}
          className={`btn ${
            mode === "checkin" ? "btn-primary" : "btn-outline-primary"
          }`}
          onClick={() => setMode("checkin")}
        >
          Check-in
        </button>

        <button
          disabled={loading}
          className={`btn ${
            mode === "checkout" ? "btn-danger" : "btn-outline-danger"
          }`}
          onClick={() => setMode("checkout")}
        >
          Check-out
        </button>
      </div>

      {/* FACE CAMERA */}
      <FaceCamera
        onCapture={handleCapture}
        disabled={loading || faceCooldown > 0}
      />

      {/* FACE COOLDOWN NOTICE */}
      {faceCooldown > 0 && (
        <p className="text-warning mt-3">
          Vui lòng chờ {faceCooldown}s trước khi quét khuôn mặt lại
        </p>
      )}

      {/* MANUAL ATTENDANCE */}
      <div className="mt-4">
        <p className="text-muted mb-2">
          Không nhận diện được khuôn mặt?
        </p>

        <button
          disabled={loading}
          className={`btn ${
            mode === "checkin"
              ? "btn-outline-primary"
              : "btn-outline-danger"
          }`}
          onClick={handleManualAttendance}
        >
          {mode === "checkin"
            ? "Check-in thủ công"
            : "Check-out thủ công"}
        </button>
      </div>
    </div>
  );
};

export default FaceAttendancePage;
