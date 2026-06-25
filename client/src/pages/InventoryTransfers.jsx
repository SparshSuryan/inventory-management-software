import { useEffect, useState } from "react";
import API from "../api/axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { exportToCSV } from "../utils/exportCSV";

function InventoryTransfers() {
  const [transfers, setTransfers] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    product_id: "",
    from_category: "",
    to_category: "",
    quantity: "",
    remarks: "",
  });

  // When product is selected, auto-fill from_category
  const [selectedProduct, setSelectedProduct] = useState(null);

  const fetchAll = () => {
    Promise.all([
      API.get("/transfers"),
      API.get("/products"),
      API.get("/categories"),
    ]).then(([tRes, pRes, cRes]) => {
      setTransfers(tRes.data.data);
      setProducts(pRes.data.data);
      // Only show Raw Material, WIP, Finished Product (not Sold) as transfer sources
      setCategories(cRes.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const handleProductChange = (e) => {
    const productId = e.target.value;
    const product = products.find((p) => p.product_id === parseInt(productId));
    setSelectedProduct(product || null);
    setFormData((prev) => ({
      ...prev,
      product_id: productId,
      from_category: product ? String(product.category_id) : "",
      to_category: "",
    }));
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    API.post("/transfers", formData)
      .then((res) => {
        setFormSuccess(res.data.message);
        setShowForm(false);
        setFormData({ product_id: "", from_category: "", to_category: "", quantity: "", remarks: "" });
        setSelectedProduct(null);
        fetchAll();
      })
      .catch((err) => {
        setFormError(err.response?.data?.message || "Failed to create transfer");
      });
  };

  const handleExport = () => {
    const exportData = transfers.map((t) => ({
      transfer_number: t.transfer_number,
      product_name: t.product?.product_name || "",
      sku: t.product?.sku || "",
      from_category: t.fromCategory?.category_name || "",
      to_category: t.toCategory?.category_name || "",
      quantity: t.quantity,
      remarks: t.remarks || "",
      date: new Date(t.created_at).toLocaleDateString("en-IN"),
    }));
  
    const headers = [
      { label: "Transfer #", key: "transfer_number" },
      { label: "Product Name", key: "product_name" },
      { label: "SKU", key: "sku" },
      { label: "From Stage", key: "from_category" },
      { label: "To Stage", key: "to_category" },
      { label: "Quantity", key: "quantity" },
      { label: "Remarks", key: "remarks" },
      { label: "Date", key: "date" },
    ];
  
    exportToCSV("inventory_transfers", headers, exportData);
  };

  const getValidDestinations = () => {
    if (!formData.from_category) return [];
  
    const fromId = parseInt(formData.from_category);
  
    const validPaths = {
      3: [4, 5],    // Raw Material → WIP, Finished Product
      4: [5],       // WIP → Finished Product only
      5: [6],       // Finished Product → Sold only
      6: [],        // Sold → nowhere (final stage)
    };
  
    const allowedIds = validPaths[fromId] || [];
    console.log("fromId:", fromId);
console.log("allowedIds:", allowedIds);
console.log("categories:", categories);
console.log(
  "category IDs:",
  categories.map((c) => ({
    id: c.category_id,
    name: c.category_name,
  }))
);
    return categories.filter((c) =>
      allowedIds.includes(parseInt(c.category_id))
    );
  };

  const getCategoryName = (id) => {
    const cat = categories.find((c) => c.category_id === id);
    return cat?.category_name || "—";
  };

  const filteredTransfers = transfers.filter((t) =>
    !searchTerm ||
    t.transfer_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.product?.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.product?.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <p style={{ padding: "20px" }}>Loading...</p>;

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#fcf6db" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <Navbar title="Receipt Management" onSearch={(val) => setSearchTerm(val)} />
        <div style={{ padding: "24px", flex: 1 }}>

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h2 style={{ color: "#004aad", margin: 0 }}>Inventory Transfers</h2>
              <p style={{ color: "#666", fontSize: "13px", marginTop: "4px" }}>
                Move inventory between stages — Raw Material → WIP → Finished Product
              </p>
            </div>
            <div  style={{ display: "flex", gap: "10px" }}>
            <button onClick={handleExport} style={btnExport}>
                Export CSV ↓
            </button>
            <button onClick={() => { setShowForm(true); setFormError(null); setFormSuccess(null); }} style={btnPrimary}>
              + New Transfer
            </button>
            </div>
          </div>

          {/* Messages */}
          {formSuccess && <p style={{ color: "green", fontWeight: "500", marginBottom: "12px" }}>{formSuccess}</p>}
          {formError && <p style={{ color: "red", fontWeight: "500", marginBottom: "12px" }}>{formError}</p>}

          {/* Transfer Form */}
          {showForm && (
            <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "10px", border: "1px solid #ddd", marginBottom: "20px" }}>
              <h3 style={{ marginBottom: "16px", color: "#004aad" }}>Create New Transfer</h3>
              <form onSubmit={handleSubmit}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>

                  {/* Product dropdown */}
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={labelStyle}>Select Product *</label>
                    <select
                      name="product_id"
                      value={formData.product_id}
                      onChange={handleProductChange}
                      required
                      style={inputStyle}
                    >
                      <option value="">-- Select a product --</option>
                      {products.map((p) => (
                        <option key={p.product_id} value={p.product_id}>
                          {p.product_name} ({p.sku}) — {p.category?.category_name}
                        </option>
                      ))}
                    </select>
                    {selectedProduct && (
                      <p style={{ fontSize: "12px", color: "green", marginTop: "4px" }}>
                        ✓ Currently in: <strong>{selectedProduct.category?.category_name}</strong>
                      </p>
                    )}
                  </div>

                  {/* From category - read only */}
                  <div>
                    <label style={labelStyle}>From (Current Stage)</label>
                    <input
                      value={selectedProduct ? selectedProduct.category?.category_name : ""}
                      readOnly
                      style={{ ...inputStyle, backgroundColor: "#f5f5f5", color: "#666" }}
                      placeholder="Auto-filled from product"
                    />
                  </div>

                  {/* To category */}
                  <div>
  <label style={labelStyle}>To (Destination Stage) *</label>
  <select
    name="to_category"
    value={formData.to_category}
    onChange={handleChange}
    required
    style={inputStyle}
    disabled={getValidDestinations().length === 0}
  >
    <option value="">
      {!formData.from_category
        ? "-- Select product first --"
        : getValidDestinations().length === 0
        ? "-- No valid destination (already Sold) --"
        : "-- Select destination --"}
    </option>
    {getValidDestinations().map((c) => (
      <option key={c.category_id} value={c.category_id}>
        {c.category_name}
      </option>
    ))}
  </select>
  {formData.from_category && getValidDestinations().length > 0 && (
    <p style={{ fontSize: "11px", color: "#888", marginTop: "4px" }}>
      Valid paths: {getValidDestinations().map((c) => c.category_name).join(", ")}
    </p>
  )}
</div>

                  {/* Quantity */}
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
                      placeholder="e.g. 10"
                    />
                  </div>

                  {/* Remarks */}
                  <div>
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

                <div style={{ marginTop: "16px", display: "flex", gap: "10px" }}>
                  <button type="submit" style={btnPrimary}>Create Transfer</button>
                  <button type="button" onClick={() => { setShowForm(false); setFormData({ product_id: "", from_category: "", to_category: "", quantity: "", remarks: "" }); setSelectedProduct(null); }} style={btnCancel}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Transfers Table */}
          <div style={{ backgroundColor: "white", borderRadius: "12px", border: "1.5px solid #004aad", padding: "16px" }}>
            <div style={{ textAlign: "center", fontWeight: "700", fontSize: "16px", color: "#004aad", marginBottom: "14px" }}>
              Transfer History
            </div>

            {transfers.length === 0 ? (
              <p style={{ textAlign: "center", padding: "20px", color: "#666" }}>No transfers yet. Create your first transfer!</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #e8d9b0" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f5e6c8" }}>
                    {["Transfer #", "Product", "SKU", "From", "To", "Quantity", "Remarks", "Date"].map((h) => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transfers.map((t, i) => (
                    <tr key={t.transfer_id} style={{ backgroundColor: i % 2 === 0 ? "#fffdf5" : "#fdf6e3" }}>
                      <td style={tdStyle}><strong>{t.transfer_number}</strong></td>
                      <td style={tdStyle}>{t.product?.product_name}</td>
                      <td style={tdStyle}>{t.product?.sku}</td>
                      <td style={tdStyle}>
                        <span style={{ backgroundColor: "#faeeda", color: "#633806", padding: "2px 8px", borderRadius: "10px", fontSize: "11px" }}>
                          {t.fromCategory?.category_name}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ backgroundColor: "#e1f5ee", color: "#085041", padding: "2px 8px", borderRadius: "10px", fontSize: "11px" }}>
                          {t.toCategory?.category_name}
                        </span>
                      </td>
                      <td style={tdStyle}>{t.quantity}</td>
                      <td style={tdStyle}>{t.remarks || "—"}</td>
                      <td style={tdStyle}>{new Date(t.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

const labelStyle = { display: "block", marginBottom: "4px", fontSize: "13px", fontWeight: "500", color: "#333" };
const inputStyle = { width: "100%", padding: "8px 10px", border: "1px solid #ccc", borderRadius: "6px", fontSize: "14px" };
const btnPrimary = { backgroundColor: "#004aad", color: "white", padding: "10px 20px", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "500" };
const btnCancel = { backgroundColor: "#ccc", color: "#333", padding: "10px 24px", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px" };
const thStyle = { padding: "10px", textAlign: "center", fontSize: "13px", fontWeight: "600", color: "#004aad", borderBottom: "2px solid #e8d9b0", borderRight: "1px solid #e8d9b0" };
const tdStyle = { padding: "10px", textAlign: "center", fontSize: "13px", borderBottom: "1px solid #e8d9b0", borderRight: "1px solid #e8d9b0", color: "#333" };
const btnExport = {
    backgroundColor: "#5cb85c", color: "white",
    padding: "10px 20px", border: "none",
    borderRadius: "6px", cursor: "pointer",
    fontSize: "14px", fontWeight: "500",
};

export default InventoryTransfers;