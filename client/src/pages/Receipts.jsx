import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../api/axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import ReceiptBulkUploadModal from "../components/ReceiptBulkUploadModal";
import AIReceiptScanner from "../components/AIReceiptScanner";
import { formatINR } from "../utils/formatCurrency";
import { exportToCSV } from "../utils/exportCSV";
import { isAdmin } from "../utils/auth";

const emptyForm = {
    sku: "",
    supplier: "",
    quantity: "",
    unit_cost: "",
    received_date: "",
    remarks: "",
  };

function Receipts() {
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

  // SKU check state
  const [skuChecked, setSkuChecked] = useState(false);
  const [skuExists, setSkuExists] = useState(null);
  const [foundProduct, setFoundProduct] = useState(null);
  const [checkingSku, setCheckingSku] = useState(false);

  // "Create product" prompt
  const [showCreatePrompt, setShowCreatePrompt] = useState(false);

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAIScanner, setShowAIScanner] = useState(false);

  const admin = isAdmin();

  const fetchReceipts = () => {
    API.get("/receipts")
      .then((res) => {
        setReceipts(res.data.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch receipts");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Reset SKU check if SKU field changes
    if (e.target.name === "sku") {
      setSkuChecked(false);
      setSkuExists(null);
      setFoundProduct(null);
      setShowCreatePrompt(false);
    }
  };

  const handleAddClick = () => {
    setFormData(emptyForm);
    setFormError(null);
    setFormSuccess(null);
    setSkuChecked(false);
    setSkuExists(null);
    setFoundProduct(null);
    setShowCreatePrompt(false);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormData(emptyForm);
    setFormError(null);
  };

  // Check SKU when user blurs the SKU field
  const handleSkuBlur = () => {
    if (!formData.sku) return;

    setCheckingSku(true);
    setFormError(null);

    API.post("/receipts/check-sku", { sku: formData.sku })
      .then((res) => {
        setCheckingSku(false);
        setSkuChecked(true);
        setSkuExists(res.data.exists);

        if (res.data.exists) {
          setFoundProduct(res.data.data);
          setShowCreatePrompt(false);
        } else {
          setFoundProduct(null);
          setShowCreatePrompt(true);
        }
      })
      .catch(() => {
        setCheckingSku(false);
        setFormError("Failed to check SKU");
      });
  };

  // Submit receipt
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!skuChecked) {
      setFormError("Please wait - checking SKU...");
      return;
    }

    if (!skuExists) {
      setFormError(`Product with SKU "${formData.sku}" doesn't exist. Please create it first.`);
      return;
    }

    setFormError(null);
    setFormSuccess(null);

    API.post("/receipts", formData)
      .then((res) => {
        setFormSuccess(res.data.message);
        setShowForm(false);
        setFormData(emptyForm);
        fetchReceipts();
      })
      .catch((err) => {
        setFormError(err.response?.data?.message || "Failed to create receipt");
      });
  };

  const handleExport = () => {
    const exportData = filteredReceipts.map((r) => ({
      receipt_number: r.receipt_number,
      product_name: r.product?.product_name || "",
      sku: r.product?.sku || "",
      supplier: r.supplier,
      quantity: r.quantity,
      unit_cost: r.unit_cost || "",
      total_cost: r.total_cost || "",
      received_date: new Date(r.received_date).toLocaleDateString("en-IN"),
      remarks: r.remarks || "",
    }));
  
    const headers = [
      { label: "Receipt #", key: "receipt_number" },
      { label: "Product Name", key: "product_name" },
      { label: "SKU", key: "sku" },
      { label: "Supplier", key: "supplier" },
      { label: "Quantity", key: "quantity" },
      { label: "Unit Cost", key: "unit_cost" },
      { label: "Total Cost", key: "total_cost" },
      { label: "Received Date", key: "received_date" },
      { label: "Remarks", key: "remarks" },
    ];
  
    exportToCSV("receipts", headers, exportData);
  };

  const filteredReceipts = receipts.filter((r) =>
    !searchTerm ||
    r.receipt_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.product?.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.product?.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.supplier?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#fcf6db" }}>
      <Sidebar />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <Navbar title="Receipt Management" onSearch={(val) => setSearchTerm(val)} />

        <div style={{ padding: "24px", flex: 1 }}>

          {/* Header row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
  <div>
    <h2 style={{ color: "#004aad", margin: 0 }}>Receipts</h2>
    <p style={{ color: "#666", fontSize: "13px", marginTop: "4px", maxWidth: "700px" }}>
      Record incoming raw material from suppliers. Finished product stock is managed via Inventory Transfers.
    </p>
  </div>
  <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
    { admin && ( 
    <button
      onClick={() => setShowAIScanner(true)}
      style={{
        backgroundColor: "#6f42c1", color: "white",
        padding: "9px 16px", border: "none",
        borderRadius: "6px", cursor: "pointer",
        fontSize: "13px", fontWeight: "500",
        whiteSpace: "nowrap",
      }}
    >
      🤖 AI Scan
    </button>
    )}

    {admin && ( 
    <button onClick={() => setShowBulkModal(true)} style={{
      backgroundColor: "#5bc0de", color: "white",
      padding: "9px 16px", border: "none",
      borderRadius: "6px", cursor: "pointer",
      fontSize: "13px", fontWeight: "500",
      whiteSpace: "nowrap",
    }}>
      Upload Bulk +
    </button>
    )}
    
    {admin && (
    <button onClick={handleAddClick} style={{
      backgroundColor: "#004aad", color: "white",
      padding: "9px 16px", border: "none",
      borderRadius: "6px", cursor: "pointer",
      fontSize: "13px", fontWeight: "500",
      whiteSpace: "nowrap",
    }}>
      + Add Receipt
    </button>
    )}
 
    <button onClick={handleExport} style={{
      backgroundColor: "#5cb85c", color: "white",
      padding: "9px 16px", border: "none",
      borderRadius: "6px", cursor: "pointer",
      fontSize: "13px", fontWeight: "500",
      whiteSpace: "nowrap",
    }}>
      Export CSV ↓
    </button>

  </div>
</div>

          {/* Messages */}
          {formSuccess && (
            <p style={{ color: "green", fontWeight: "500", marginBottom: "12px" }}>{formSuccess}</p>
          )}
          {formError && (
            <p style={{ color: "red", fontWeight: "500", marginBottom: "12px" }}>{formError}</p>
          )}

          {/* Add Receipt Form */}
          {showForm && admin && (
            <div style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "10px",
              border: "1px solid #ddd",
              marginBottom: "20px",
            }}>
              <h3 style={{ marginBottom: "16px", color: "#004aad" }}>Add New Receipt</h3>
              <form onSubmit={handleSubmit}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>

                <div>
  <label style={labelStyle}>Product SKU *</label>
  <input
    name="sku"
    value={formData.sku}
    onChange={handleChange}
    onBlur={handleSkuBlur}
    required
    style={inputStyle}
    placeholder="e.g. RM001"
  />
  {checkingSku && (
    <p style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>Checking SKU...</p>
  )}
  {skuChecked && skuExists && (
    <p style={{ fontSize: "12px", color: "green", marginTop: "4px" }}>
      ✓ Found: {foundProduct.product_name} ({foundProduct.category?.category_name})
    </p>
  )}
  {skuChecked && !skuExists && (
    <p style={{ fontSize: "12px", color: "#d9534f", marginTop: "4px" }}>
      ✕ Product not found
    </p>
  )}
</div>

<div>
  <label style={labelStyle}>Product Name</label>
  <input
    value={foundProduct ? foundProduct.product_name : ""}
    readOnly
    style={{ ...inputStyle, backgroundColor: "#f5f5f5", color: "#666" }}
    placeholder="Auto-filled from SKU"
  />
</div>

                  <div>
                    <label style={labelStyle}>Supplier *</label>
                    <input
                      name="supplier"
                      value={formData.supplier}
                      onChange={handleChange}
                      required
                      style={inputStyle}
                      placeholder="e.g. Timber World"
                    />
                  </div>

                  <div>
  <label style={labelStyle}>Quantity *</label>
  <input
    name="quantity"
    value={formData.quantity}
    onChange={handleChange}
    required
    type="number"
    min="1"
    style={inputStyle}
    placeholder="e.g. 100"
  />
</div>

<div>
  <label style={labelStyle}>Unit Cost (₹)</label>
  <input
    name="unit_cost"
    value={formData.unit_cost}
    onChange={handleChange}
    type="number"
    min="0"
    step="0.01"
    style={inputStyle}
    placeholder={foundProduct ? `Default: ${formatINR(foundProduct.unit_price)}` : "e.g. 450"}
  />
</div>

<div>
  <label style={labelStyle}>Total Cost (₹)</label>
  <input
    value={
      formData.quantity && (formData.unit_cost || foundProduct?.unit_price)
        ? (
            parseFloat(formData.quantity || 0) *
            parseFloat(formData.unit_cost || foundProduct?.unit_price || 0)
          ).toFixed(2)
        : ""
    }
    readOnly
    style={{ ...inputStyle, backgroundColor: "#f5f5f5", color: "#666", fontWeight: "600" }}
    placeholder="Auto-calculated"
  />
</div>

                  <div>
                    <label style={labelStyle}>Received Date</label>
                    <input
                      name="received_date"
                      value={formData.received_date}
                      onChange={handleChange}
                      type="date"
                      style={inputStyle}
                    />
                  </div>

                  <div style={{ gridColumn: "span 2" }}>
                    <label style={labelStyle}>Remarks</label>
                    <input
                      name="remarks"
                      value={formData.remarks}
                      onChange={handleChange}
                      style={inputStyle}
                      placeholder="Optional notes"
                    />
                  </div>
                </div>

                {/* Product not found prompt */}
                {showCreatePrompt && (
                  <div style={{
                    marginTop: "14px",
                    backgroundColor: "#fdf2f2",
                    border: "1px solid #f5c2c2",
                    borderRadius: "8px",
                    padding: "12px 16px",
                  }}>
                    <p style={{ color: "#a32d2d", fontSize: "13px", marginBottom: "8px" }}>
                      ⚠️ Product with SKU "<strong>{formData.sku}</strong>" doesn't exist in the system.
                      You need to create it first before adding this receipt.
                    </p>
                    <button
  type="button"
  onClick={() => navigate("/products", { state: { prefillSku: formData.sku, openAddForm: true } })}
  style={{ ...btnAdd, fontSize: "12px", padding: "6px 14px" }}
>
  Create Product Now
</button>
                  </div>
                )}

                <div style={{ marginTop: "16px", display: "flex", gap: "10px" }}>
                  <button type="submit" style={btnAdd} disabled={!skuExists}>
                    Add Receipt
                  </button>
                  <button type="button" onClick={handleCancel} style={btnCancel}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Receipts Table */}
          <div style={{
            backgroundColor: "white",
            borderRadius: "12px",
            border: "1.5px solid #004aad",
            padding: "16px",
          }}>
            <div style={{ textAlign: "center", fontWeight: "700", fontSize: "16px", color: "#004aad", marginBottom: "14px" }}>
              Receipts Table
            </div>

            {loading ? (
              <p style={{ padding: "20px" }}>Loading receipts...</p>
            ) : error ? (
              <p style={{ padding: "20px", color: "red" }}>{error}</p>
            ) : filteredReceipts.length === 0 ? (
              <p style={{ padding: "20px" }}>
                {receipts.length === 0
                  ? "No receipts found. Add your first receipt!"
                  : "No receipts match your search."}
              </p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #e8d9b0" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f5e6c8" }}>
                  {["Receipt #", "Product", "SKU", "Supplier", "Quantity", "Unit Cost", "Total Cost", "Received Date", "Remarks"].map((h) => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                {filteredReceipts.map((r, index) => (
                    <tr key={r.receipt_id} style={{ backgroundColor: index % 2 === 0 ? "#fffdf5" : "#fdf6e3" }}>
                      <td style={tdStyle}><strong>{r.receipt_number}</strong></td>
                      <td style={tdStyle}>{r.product?.product_name}</td>
                      <td style={tdStyle}>{r.product?.sku}</td>
                      <td style={tdStyle}>{r.supplier}</td>
                      <td style={tdStyle}>+{r.quantity}</td>
                      <td style={tdStyle}>{r.unit_cost ? formatINR(r.unit_cost) : "—"}</td>
                      <td style={tdStyle}>{r.total_cost ? formatINR(r.total_cost) : "—"}</td>
                      <td style={tdStyle}>{new Date(r.received_date).toLocaleDateString()}</td>
                      <td style={tdStyle}>{r.remarks || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {showBulkModal && (
  <ReceiptBulkUploadModal
    onClose={() => setShowBulkModal(false)}
    onSuccess={(msg) => {
      setFormSuccess(msg);
      setShowBulkModal(false);
      fetchReceipts();
    }}
  />
)}

{showAIScanner && (
  <AIReceiptScanner
    onClose={() => setShowAIScanner(false)}
    onScanSuccess={(data) => {
      setFormData({
        sku: data.sku || "",
        supplier: data.supplier || "",
        quantity: data.quantity || "",
        unit_cost: data.unit_cost || "",
        received_date: data.received_date || "",
        remarks: data.remarks || "",
      });
    
      setSkuChecked(false);
      setSkuExists(null);
      setFoundProduct(null);
      setShowCreatePrompt(false);
    
      setShowAIScanner(false);
      setShowForm(true);
    
      // Automatically validate the extracted SKU
      if (data.sku) {
        setTimeout(() => {
          API.post("/receipts/check-sku", { sku: data.sku })
            .then((res) => {
              setSkuChecked(true);
              setSkuExists(res.data.exists);
    
              if (res.data.exists) {
                setFoundProduct(res.data.data);
              } else {
                setShowCreatePrompt(true);
              }
            })
            .catch(() => {});
        }, 100);
      }
    }}
  />
)}

        </div>
      </div>
    </div>
  );
}

//Styles
const labelStyle = {
  display: "block", marginBottom: "4px",
  fontSize: "13px", fontWeight: "500", color: "#333",
};
const inputStyle = {
  width: "100%", padding: "8px 10px",
  border: "1px solid #ccc", borderRadius: "6px", fontSize: "14px",
};
const btnAdd = {
  backgroundColor: "#004aad", color: "white",
  padding: "10px 20px", border: "none",
  borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "500",
};
const btnCancel = {
  backgroundColor: "#ccc", color: "#333",
  padding: "10px 24px", border: "none",
  borderRadius: "6px", cursor: "pointer", fontSize: "14px",
};
const thStyle = {
  padding: "10px", textAlign: "center",
  fontSize: "13px", fontWeight: "600",
  color: "#004aad", borderBottom: "2px solid #e8d9b0",
  borderRight: "1px solid #e8d9b0",
};
const tdStyle = {
  padding: "10px", textAlign: "center",
  fontSize: "13px", borderBottom: "1px solid #e8d9b0",
  borderRight: "1px solid #e8d9b0", color: "#333",
};
const btnUpload = {
    backgroundColor: "#5bc0de", color: "white",
    padding: "10px 20px", border: "none",
    borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "500",
};
const btnExport = {
    backgroundColor: "#5cb85c", color: "white",
    padding: "10px 20px", border: "none",
    borderRadius: "6px", cursor: "pointer",
    fontSize: "14px", fontWeight: "500",
};
const btnAIScan = {
  backgroundColor: "#7b1fa2",
  color: "white",
  padding: "10px 20px",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: "500",
};

export default Receipts;