import { useEffect, useState } from "react";
import API from "../api/axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { formatINR } from "../utils/formatCurrency";
import { exportToCSV } from "../utils/exportCSV";

function SalesHistory() {
  const [sales, setSales] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    API.get("/sales")
      .then((res) => {
        setSales(res.data.data.sales);
        setSummary(res.data.data.summary);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredSales = sales.filter((s) =>
    !searchTerm ||
    s.product?.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.product?.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.transfer_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    const exportData = filteredSales.map((s) => ({
      transfer_number: s.transfer_number,
      product_name: s.product?.product_name || "",
      sku: s.product?.sku || "",
      from_stage: s.fromCategory?.category_name || "",
      quantity_sold: s.quantity,
      unit_price: s.product?.unit_price || 0,
      total_value: s.quantity * (s.product?.unit_price || 0),
      remarks: s.remarks || "",
      date: new Date(s.created_at).toLocaleDateString("en-IN"),
    }));

    const headers = [
      { label: "Transfer #", key: "transfer_number" },
      { label: "Product Name", key: "product_name" },
      { label: "SKU", key: "sku" },
      { label: "From Stage", key: "from_stage" },
      { label: "Quantity Sold", key: "quantity_sold" },
      { label: "Unit Price", key: "unit_price" },
      { label: "Total Value", key: "total_value" },
      { label: "Remarks", key: "remarks" },
      { label: "Date", key: "date" },
    ];

    exportToCSV("sales_history", headers, exportData);
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#fcf6db" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <Navbar title="Sales History" onSearch={(val) => setSearchTerm(val)} />
        <div style={{ padding: "24px", flex: 1 }}>

          {/* KPI Cards */}
          {summary && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" }}>
              {[
                { label: "Total Sales", value: summary.totalSales, icon: "🧾", color: "#004aad" },
                { label: "Total Units Sold", value: summary.totalUnitsSold, icon: "📦", color: "#5bc0de" },
                { label: "Unique Products", value: summary.uniqueProducts, icon: "🏷️", color: "#5cb85c" },
                { label: "Total Revenue", value: formatINR(summary.totalRevenue), icon: "💰", color: "#004aad" },
              ].map((k) => (
                <div key={k.label} style={{ backgroundColor: "white", border: "1.5px solid #004aad", borderRadius: "10px", padding: "16px", textAlign: "center" }}>
                  <div style={{ fontSize: "13px", fontWeight: "500", color: "#555" }}>{k.label}</div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "8px" }}>
                    <span style={{ fontSize: "22px" }}>{k.icon}</span>
                    <span style={{ fontSize: "26px", fontWeight: "700", color: k.color }}>{k.value}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Header row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h2 style={{ color: "#004aad", margin: 0 }}>Sales History</h2>
              <p style={{ color: "#666", fontSize: "13px", marginTop: "4px" }}>
                Complete audit trail of all inventory transferred to Sold stage
              </p>
            </div>
            <button onClick={handleExport} style={btnExport}>Export CSV ↓</button>
          </div>

          {/* Sales Table */}
          <div style={{ backgroundColor: "white", borderRadius: "12px", border: "1.5px solid #004aad", padding: "16px" }}>
            <div style={{ textAlign: "center", fontWeight: "700", fontSize: "16px", color: "#004aad", marginBottom: "14px" }}>
              Sales Records {filteredSales.length !== sales.length && `(${filteredSales.length} of ${sales.length})`}
            </div>

            {loading ? (
              <p style={{ padding: "20px", textAlign: "center" }}>Loading sales history...</p>
            ) : filteredSales.length === 0 ? (
              <p style={{ padding: "20px", textAlign: "center", color: "#666" }}>
                {searchTerm ? `No sales found for "${searchTerm}"` : "No sales recorded yet."}
              </p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #e8d9b0" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f5e6c8" }}>
                    {["Transfer #", "Product Name", "SKU", "From Stage", "Qty Sold", "Unit Price", "Total Value", "Remarks", "Date"].map((h) => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map((s, i) => (
                    <tr key={s.transfer_id} style={{ backgroundColor: i % 2 === 0 ? "#fffdf5" : "#fdf6e3" }}>
                      <td style={tdStyle}><strong>{s.transfer_number}</strong></td>
                      <td style={tdStyle}>{s.product?.product_name}</td>
                      <td style={tdStyle}>{s.product?.sku}</td>
                      <td style={tdStyle}>
                        <span style={{ backgroundColor: "#faeeda", color: "#633806", padding: "2px 8px", borderRadius: "10px", fontSize: "11px" }}>
                          {s.fromCategory?.category_name}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, fontWeight: "700", color: "#5cb85c" }}>{s.quantity}</td>
                      <td style={tdStyle}>{formatINR(s.product?.unit_price || 0)}</td>
                      <td style={{ ...tdStyle, fontWeight: "700", color: "#004aad" }}>
                        {formatINR(s.quantity * (s.product?.unit_price || 0))}
                      </td>
                      <td style={tdStyle}>{s.remarks || "—"}</td>
                      <td style={tdStyle}>{new Date(s.created_at).toLocaleDateString("en-IN")}</td>
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

const thStyle = { padding: "10px", textAlign: "center", fontSize: "13px", fontWeight: "600", color: "#004aad", borderBottom: "2px solid #e8d9b0", borderRight: "1px solid #e8d9b0" };
const tdStyle = { padding: "10px", textAlign: "center", fontSize: "13px", borderBottom: "1px solid #e8d9b0", borderRight: "1px solid #e8d9b0", color: "#333" };
const btnExport = { backgroundColor: "#5cb85c", color: "white", padding: "10px 20px", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "500" };

export default SalesHistory;