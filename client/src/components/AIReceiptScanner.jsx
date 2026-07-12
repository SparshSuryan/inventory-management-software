import { useState } from "react";
import API from "../api/axios";

function AIReceiptScanner({ onClose, onScanSuccess }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setSelectedImage(file);
    setPreview(URL.createObjectURL(file));
    setError(null);
  };

  const handleScan = async () => {
    if (!selectedImage) {
      setError("Please select a receipt image.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append("receipt_image", selectedImage);

      const res = await API.post("/receipts/scan", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      onScanSuccess(res.data.data.extracted);

    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
        "Failed to scan receipt."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={overlayStyle}>
        <div style={modalStyle}>

          <div style={headerStyle}>
            <h2 style={{ margin: 0 }}>
              🤖 AI Receipt Scanner
            </h2>

            <button
              onClick={onClose}
              style={closeBtn}
            >
              ✕
            </button>
          </div>

          <p style={subtitleStyle}>
            Upload a receipt image and let AI automatically
            fill the receipt details.
          </p>

          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ marginBottom: "18px" }}
          />

          {preview && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "20px",
              }}
            >
              <img
                src={preview}
                alt="Receipt Preview"
                style={{
                  maxWidth: "100%",
                  maxHeight: "350px",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                }}
              />
            </div>
          )}

          {error && (
            <p
              style={{
                color: "#d9534f",
                marginBottom: "16px",
                fontWeight: "500",
              }}
            >
              {error}
            </p>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
            }}
          >
            <button
              onClick={onClose}
              style={cancelBtn}
            >
              Cancel
            </button>

            <button
              onClick={handleScan}
              style={scanBtn}
              disabled={loading}
            >
              {loading ? "Scanning..." : "Scan Receipt"}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}

const overlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.45)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  };
  
  const modalStyle = {
    backgroundColor: "#fff",
    width: "700px",
    maxWidth: "90%",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  };
  
  const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  };
  
  const subtitleStyle = {
    color: "#666",
    marginBottom: "20px",
    fontSize: "14px",
  };
  
  const closeBtn = {
    background: "transparent",
    border: "none",
    fontSize: "22px",
    cursor: "pointer",
    color: "#555",
  };
  
  const cancelBtn = {
    backgroundColor: "#ccc",
    color: "#333",
    border: "none",
    padding: "10px 22px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
  };
  
  const scanBtn = {
    backgroundColor: "#7b1fa2",
    color: "white",
    border: "none",
    padding: "10px 22px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
  };
  
  export default AIReceiptScanner;