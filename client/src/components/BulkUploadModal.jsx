import { useState } from "react";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import API from "../api/axios";

const SYSTEM_FIELDS = [
  { key: "product_name", label: "Product Name", required: true },
  { key: "sku", label: "SKU", required: true },
  { key: "unit_price", label: "Unit Price", required: true },
  { key: "category_id", label: "Category ID", required: true },
  { key: "description", label: "Description", required: false },
  { key: "supplier", label: "Supplier", required: false },
  { key: "quantity", label: "Quantity (Stock)", required: false },
  { key: "reorder_level", label: "Reorder Level", required: false },
];

function BulkUploadModal({ onClose, onSuccess, categories }) {
  const [step, setStep] = useState(1);
  const [fileData, setFileData] = useState([]);
  const [fileHeaders, setFileHeaders] = useState([]);
  const [mapping, setMapping] = useState({});
  const [preview, setPreview] = useState([]);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState(null);

  // Step 1 — Read file
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError(null);

    const ext = file.name.split(".").pop().toLowerCase();

    if (ext === "csv") {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          if (result.data.length === 0) {
            setError("File is empty");
            return;
          }
          setFileHeaders(Object.keys(result.data[0]));
          setFileData(result.data);
          setStep(2);
        },
        error: () => setError("Failed to read CSV file"),
      });
    } else if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const wb = XLSX.read(evt.target.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);
        if (data.length === 0) {
          setError("File is empty");
          return;
        }
        setFileHeaders(Object.keys(data[0]));
        setFileData(data);
        setStep(2);
      };
      reader.readAsBinaryString(file);
    } else {
      setError("Only CSV and Excel (.xlsx, .xls) files are supported");
    }
  };

  // Step 2 — Handle mapping
  const handleMappingChange = (systemField, fileColumn) => {
    setMapping((prev) => ({ ...prev, [systemField]: fileColumn }));
  };

  // Step 2 → Step 3
  const handlePreview = () => {
    const missing = SYSTEM_FIELDS.filter(
      (f) => f.required && !mapping[f.key]
    );
    if (missing.length > 0) {
      setError(`Please map required fields: ${missing.map((f) => f.label).join(", ")}`);
      return;
    }
    setError(null);

    const mapped = fileData.map((row) => {
      const obj = {};
      SYSTEM_FIELDS.forEach(({ key }) => {
        obj[key] = mapping[key] ? String(row[mapping[key]] ?? "") : "";
      });
      return obj;
    });

    setPreview(mapped);
    setStep(3);
  };

  // Step 3 — Import
  const handleImport = () => {
    setImporting(true);
    setError(null);

    API.post("/products/bulk", { products: preview })
      .then((res) => {
        setImporting(false);
        onSuccess(res.data.message);
        onClose();
      })
      .catch((err) => {
        setImporting(false);
        setError(err.response?.data?.message || "Import failed — check your data");
      });
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0,
      width: "100vw", height: "100vh",
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center",
      justifyContent: "center", zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "28px",
        width: "820px",
        maxHeight: "88vh",
        overflowY: "auto",
        boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
      }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ color: "#004aad", margin: 0, fontSize: "20px" }}>
            Bulk Upload Products
          </h2>
          <button onClick={onClose} style={{
            background: "none", border: "none",
            fontSize: "22px", cursor: "pointer", color: "#666",
          }}>✕</button>
        </div>

        {/* Step indicators */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
          {["1. Upload File", "2. Map Columns", "3. Preview & Import"].map((s, i) => (
            <div key={s} style={{
              padding: "6px 16px", borderRadius: "20px",
              fontSize: "12px", fontWeight: step === i + 1 ? "700" : "400",
              backgroundColor: step === i + 1 ? "#004aad" : step > i + 1 ? "#E1F5EE" : "#f0f0f0",
              color: step === i + 1 ? "white" : step > i + 1 ? "#085041" : "#666",
            }}>{s}</div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            backgroundColor: "#fdf2f2", border: "1px solid #f5c2c2",
            borderRadius: "8px", padding: "10px 14px",
            color: "#a32d2d", fontSize: "13px", marginBottom: "16px",
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* STEP 1 — Upload */}
        {step === 1 && (
          <div style={{ textAlign: "center", padding: "48px 20px" }}>
            <div style={{ fontSize: "52px", marginBottom: "16px" }}>📂</div>
            <h3 style={{ color: "#004aad", marginBottom: "8px" }}>
              Upload your inventory file
            </h3>
            <p style={{ color: "#666", marginBottom: "24px", fontSize: "14px", maxWidth: "480px", margin: "0 auto 24px" }}>
              Upload any CSV or Excel file. Column names don't need to match — you'll map them in the next step.
            </p>
            <label style={{
              backgroundColor: "#004aad", color: "white",
              padding: "12px 32px", borderRadius: "8px",
              cursor: "pointer", fontSize: "14px", fontWeight: "600",
              display: "inline-block",
            }}>
              Choose File
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
            </label>
            <p style={{ marginTop: "14px", fontSize: "12px", color: "#999" }}>
              Supported: .csv, .xlsx, .xls
            </p>
          </div>
        )}

        {/* STEP 2 — Map columns */}
        {step === 2 && (
          <div>
            <p style={{ color: "#555", marginBottom: "16px", fontSize: "14px" }}>
              Found <strong>{fileHeaders.length} columns</strong> and <strong>{fileData.length} rows</strong> in your file.
              Map your columns to the system fields below.
            </p>

            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "16px" }}>
              <thead>
                <tr style={{ backgroundColor: "#f5e6c8" }}>
                  <th style={thStyle}>System Field</th>
                  <th style={thStyle}>Your Column</th>
                  <th style={thStyle}>Sample Value from File</th>
                </tr>
              </thead>
              <tbody>
                {SYSTEM_FIELDS.map(({ key, label, required }) => (
                  <tr key={key} style={{ backgroundColor: required ? "#fffdf5" : "white" }}>
                    <td style={tdStyle}>
                      <span style={{ fontWeight: "600", color: "#004aad" }}>
                        {label}
                      </span>
                      {required && (
                        <span style={{ color: "#d9534f", marginLeft: "4px" }}>*</span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <select
                        value={mapping[key] || ""}
                        onChange={(e) => handleMappingChange(key, e.target.value)}
                        style={{
                          width: "100%", padding: "7px 10px",
                          border: "1px solid #ccc", borderRadius: "6px",
                          fontSize: "13px", backgroundColor: "white",
                        }}
                      >
                        <option value="">-- Select column --</option>
                        {fileHeaders.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ ...tdStyle, color: "#888", fontSize: "12px" }}>
                      {mapping[key] && fileData[0]
                        ? String(fileData[0][mapping[key]] ?? "—")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Category helper */}
            <div style={{
              backgroundColor: "#f0f8ff",
              border: "1px solid #cce0ff",
              borderRadius: "8px", padding: "12px 14px",
              marginBottom: "16px", fontSize: "13px",
            }}>
              <strong style={{ color: "#004aad" }}>Available Category IDs:</strong>
              <div style={{ marginTop: "6px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
                {categories.map((c) => (
                  <span key={c.category_id} style={{
                    backgroundColor: "#e6f0ff", color: "#004aad",
                    padding: "3px 10px", borderRadius: "12px",
                    fontSize: "12px", fontWeight: "500",
                  }}>
                    {c.category_id} = {c.category_name}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => { setStep(1); setMapping({}); }} style={btnSecondary}>
                ← Back
              </button>
              <button onClick={handlePreview} style={btnPrimary}>
                Preview Data →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — Preview & Import */}
        {step === 3 && (
          <div>
            <p style={{ color: "#555", marginBottom: "16px", fontSize: "14px" }}>
              Preview of <strong>{preview.length} products</strong> to be imported.
              Each product will also create a stock record automatically.
            </p>

            <div style={{ overflowX: "auto", marginBottom: "16px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f5e6c8" }}>
                    {SYSTEM_FIELDS.map(({ label }) => (
                      <th key={label} style={thStyle}>{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 10).map((row, i) => (
                    <tr key={i} style={{
                      backgroundColor: i % 2 === 0 ? "#fffdf5" : "#fdf6e3",
                    }}>
                      {SYSTEM_FIELDS.map(({ key }) => (
                        <td key={key} style={{ ...tdStyle, fontSize: "12px" }}>
                          {row[key] || "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {preview.length > 10 && (
              <p style={{ fontSize: "12px", color: "#888", marginBottom: "12px" }}>
                Showing first 10 of {preview.length} rows
              </p>
            )}

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <button onClick={() => setStep(2)} style={btnSecondary}>
                ← Back
              </button>
              <button
                onClick={handleImport}
                disabled={importing}
                style={{
                  ...btnPrimary,
                  opacity: importing ? 0.7 : 1,
                  cursor: importing ? "not-allowed" : "pointer",
                }}
              >
                {importing
                  ? "Importing..."
                  : `Import ${preview.length} Products ✓`}
              </button>
              {importing && (
                <span style={{ fontSize: "13px", color: "#666" }}>
                  Please wait...
                </span>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

const thStyle = {
  padding: "10px 12px",
  textAlign: "left",
  fontSize: "13px",
  fontWeight: "600",
  color: "#004aad",
  borderBottom: "2px solid #e8d9b0",
};
const tdStyle = {
  padding: "10px 12px",
  fontSize: "13px",
  borderBottom: "1px solid #f0e8d0",
  color: "#333",
};
const btnPrimary = {
  backgroundColor: "#004aad",
  color: "white",
  padding: "10px 24px",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "500",
};
const btnSecondary = {
  backgroundColor: "#f0f0f0",
  color: "#333",
  padding: "10px 24px",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "14px",
};

export default BulkUploadModal;