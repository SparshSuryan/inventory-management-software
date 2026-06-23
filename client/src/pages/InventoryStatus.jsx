import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { formatINR } from "../utils/formatCurrency";

const STOCK_STATUS_STYLES = {
  "Surplus": { color: "#5cb85c", bg: "#f2faf2" },
  "Sufficient": { color: "#5bc0de", bg: "#f2fafd" },
  "Low Stock": { color: "#f0ad4e", bg: "#fefaf2" },
  "Out of Stock": { color: "#d9534f", bg: "#fdf2f2" },
  "No Record": { color: "#999", bg: "#f5f5f5" },
};

const ISSUE_STATUS_STYLES = {
  "Issue Raised": { color: "#d9534f", bg: "#fdf2f2", icon: "🔴" },
  "Issue Resolved": { color: "#5cb85c", bg: "#f2faf2", icon: "✅" },
  "No Issues": { color: "#5bc0de", bg: "#f2fafd", icon: "✔️" },
};

const CATEGORY_COLORS = {
  "Raw Material": { border: "#004aad", header: "#e6f0ff", badge: "#004aad" },
  "Work In Progress": { border: "#f0ad4e", header: "#fefaf2", badge: "#854F0B" },
  "Finished Product": { border: "#5cb85c", header: "#f2faf2", badge: "#2d6a2d" },
  "Sold": { border: "#777", header: "#f5f5f5", badge: "#555" },
};

function InventoryStatus() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    API.get("/inventory-status")
      .then((res) => {
        setCategories(res.data.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch inventory status");
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#fcf6db" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Navbar title="Inventory Status" />
        <p style={{ padding: "24px" }}>Loading inventory status...</p>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#fcf6db" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Navbar title="Inventory Status" />
        <p style={{ padding: "24px", color: "red" }}>{error}</p>
      </div>
    </div>
  );

  // Overall summary across all categories
  const totalProducts = categories.reduce((sum, c) => sum + c.summary.total_products, 0);
  const totalQty = categories.reduce((sum, c) => sum + c.summary.total_quantity, 0);
  const totalValue = categories.reduce((sum, c) => sum + c.summary.total_value, 0);
  const totalIssues = categories.reduce((sum, c) => sum + c.summary.products_with_issues, 0);

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#fcf6db" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <Navbar title="Inventory Status" onSearch={(val) => setSearchTerm(val)} />
        <div style={{ padding: "24px", flex: 1 }}>

          {/* Overall KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
            {[
              { label: "Total Products", value: totalProducts, icon: "📦", color: "#004aad" },
              { label: "Total Quantity", value: totalQty, icon: "🔢", color: "#5bc0de" },
              { label: "Total Inventory Value", value: formatINR(totalValue), icon: "💰", color: "#004aad" },
              { label: "Products with Open Issues", value: totalIssues, icon: "⚠️", color: "#d9534f" },
            ].map((k) => (
              <div key={k.label} style={{ backgroundColor: "white", border: "1.5px solid #004aad", borderRadius: "10px", padding: "16px", textAlign: "center" }}>
                <div style={{ fontSize: "13px", fontWeight: "500", color: "#555" }}>{k.label}</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "8px" }}>
                  <span style={{ fontSize: "22px" }}>{k.icon}</span>
                  <span style={{ fontSize: "24px", fontWeight: "700", color: k.color }}>{k.value}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: "20px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#555" }}>Stock Status:</span>
            {Object.entries(STOCK_STATUS_STYLES).filter(([k]) => k !== "No Record").map(([label, style]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: style.color }} />
                {label}
              </div>
            ))}
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#555", marginLeft: "12px" }}>Issue Status:</span>
            {Object.entries(ISSUE_STATUS_STYLES).map(([label, style]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px" }}>
                <span>{style.icon}</span>{label}
              </div>
            ))}
          </div>

          {/* 4 Category Tables */}
          {categories.map((cat) => {
            const colors = CATEGORY_COLORS[cat.category_name] || CATEGORY_COLORS["Raw Material"];

            // Apply search filter
            const filteredProducts = cat.products.filter((p) =>
              !searchTerm ||
              p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              p.sku.toLowerCase().includes(searchTerm.toLowerCase())
            );

            return (
              <div key={cat.category_id} style={{
                backgroundColor: "white",
                borderRadius: "12px",
                border: `1.5px solid ${colors.border}`,
                padding: "16px",
                marginBottom: "20px",
              }}>
                {/* Category Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{
                      backgroundColor: colors.badge, color: "white",
                      padding: "4px 14px", borderRadius: "20px",
                      fontSize: "13px", fontWeight: "700",
                    }}>
                      {cat.category_name}
                    </span>
                    <span style={{ fontSize: "13px", color: "#666" }}>
                      {cat.summary.total_products} products
                    </span>
                  </div>

                  {/* Category summary pills */}
                  <div style={{ display: "flex", gap: "10px" }}>
                    <div style={{ backgroundColor: "#e6f0ff", color: "#004aad", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "500" }}>
                      Total Qty: {cat.summary.total_quantity}
                    </div>
                    <div style={{ backgroundColor: "#e6f0ff", color: "#004aad", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "500" }}>
                      Value: {formatINR(cat.summary.total_value)}
                    </div>
                    {cat.summary.products_with_issues > 0 && (
                      <div style={{ backgroundColor: "#fdf2f2", color: "#d9534f", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" }}>
                        ⚠️ {cat.summary.products_with_issues} with issues
                      </div>
                    )}
                  </div>
                </div>

                {/* Table */}
                {filteredProducts.length === 0 ? (
                  <p style={{ textAlign: "center", color: "#999", fontSize: "13px", padding: "16px" }}>
                    {searchTerm ? `No products matching "${searchTerm}"` : "No products in this stage yet"}
                  </p>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #e8d9b0" }}>
                    <thead>
                      <tr style={{ backgroundColor: colors.header }}>
                        {["S.No", "Product Name", "SKU", "Unit Price", "Quantity", "Reorder Level", "Stock Status", "Issue Status", "Actions"].map((h) => (
                          <th key={h} style={{
                            padding: "10px", textAlign: "center",
                            fontSize: "12px", fontWeight: "600",
                            color: colors.badge,
                            borderBottom: `2px solid ${colors.border}`,
                            borderRight: "1px solid #e8d9b0",
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((p, i) => {
                        const stockStyle = STOCK_STATUS_STYLES[p.stock_status] || STOCK_STATUS_STYLES["No Record"];
                        const issueStyle = ISSUE_STATUS_STYLES[p.issue_status] || ISSUE_STATUS_STYLES["No Issues"];

                        return (
                          <tr key={p.product_id} style={{ backgroundColor: i % 2 === 0 ? "#fffdf5" : "#fdf6e3" }}>
                            <td style={tdStyle}>{i + 1}</td>
                            <td style={{ ...tdStyle, fontWeight: "500", textAlign: "left" }}>{p.product_name}</td>
                            <td style={tdStyle}>{p.sku}</td>
                            <td style={tdStyle}>{formatINR(p.unit_price)}</td>
                            <td style={{ ...tdStyle, fontWeight: "700" }}>{p.quantity}</td>
                            <td style={tdStyle}>{p.reorder_level}</td>

                            {/* Stock Status */}
                            <td style={tdStyle}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                                <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: stockStyle.color }} />
                                <span style={{ fontSize: "11px", fontWeight: "600", color: stockStyle.color }}>
                                  {p.stock_status}
                                </span>
                              </div>
                            </td>

                            {/* Issue Status */}
                            <td style={tdStyle}>
                              <span style={{
                                backgroundColor: issueStyle.bg,
                                color: issueStyle.color,
                                padding: "3px 10px", borderRadius: "12px",
                                fontSize: "11px", fontWeight: "600",
                              }}>
                                {issueStyle.icon} {p.issue_status}
                              </span>
                            </td>

                            {/* Actions */}
                            <td style={tdStyle}>
                              <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                                <button
                                  onClick={() => navigate(`/stock/${p.product_id}/movements`)}
                                  style={{ backgroundColor: "#5bc0de", color: "white", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "11px" }}
                                >
                                  History
                                </button>
                                {p.issue_status !== "Issue Raised" && (
                                  <button
                                    onClick={() => navigate("/inventory/issues")}
                                    style={{ backgroundColor: "#f0ad4e", color: "white", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "11px" }}
                                  >
                                    Raise Issue
                                  </button>
                                )}
                                {p.issue_status === "Issue Raised" && (
                                  <button
                                    onClick={() => navigate("/inventory/issues")}
                                    style={{ backgroundColor: "#d9534f", color: "white", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "11px" }}
                                  >
                                    View Issue
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}

        </div>
      </div>
    </div>
  );
}

const tdStyle = {
  padding: "9px", textAlign: "center",
  fontSize: "12px", borderBottom: "1px solid #e8d9b0",
  borderRight: "1px solid #e8d9b0", color: "#333",
};

export default InventoryStatus;