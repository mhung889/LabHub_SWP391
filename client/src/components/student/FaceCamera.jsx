import React, { useRef } from "react";
import Webcam from "react-webcam";

const videoConstraints = {
  width: 480,
  height: 480,
  facingMode: "user", // camera trước
};

const FaceCamera = ({ onCapture }) => {
  const webcamRef = useRef(null);

  const captureImage = () => {
    const imgSrc = webcamRef.current.getScreenshot(); // full base64 string
    const base64 = imgSrc.replace("data:image/jpeg;base64,", ""); // chỉ lấy phần base64
    onCapture(base64);
  };

  return (
    <div className="d-flex flex-column align-items-center gap-3">
      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/jpeg"
        videoConstraints={videoConstraints}
        style={{
          width: "100%",
          maxWidth: "360px",
          borderRadius: "12px",
        }}
      />

      <button className="btn btn-primary px-4 py-2" onClick={captureImage}>
        Chụp ảnh
      </button>
    </div>
  );
};

export default FaceCamera;
