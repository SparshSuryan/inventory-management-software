import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { formatINR } from "../utils/formatCurrency";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

const STOCK_COLORS = {
  "Surplus": "#5cb85c",
  "Sufficient": "#5bc0de",
  "Low Stock": "#f0ad4e",
  "Out of Stock": "#d9534f",
};
const STAGE_COLORS = ["#004aad", "#5bc0de", "#5cb85c", "#777"];

function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/dashboard")
      .then((res) => {
        setData(res.data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#fcf6db" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Navbar title="Dashboard Summary" />
        <p style={{ padding: "24px" }}>Loading dashboard...</p>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#fcf6db" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <Navbar title="Dashboard Summary" />
        <div style={{ padding: "24px", flex: 1 }}>

          {/* KPI Cards Row 1 — Products */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "16px" }}>
            {[
              { label: "Total Products", value: data.products.total, icon: "📦", color: "#004aad" },
              { label: "Low Stock Items", value: data.products.lowStock, icon: "⚠️", color: "#f0ad4e" },
              { label: "Out of Stock", value: data.products.outOfStock, icon: "❌", color: "#d9534f" },
              { label: "Total Inventory Value", value: formatINR(data.products.totalInventoryValue), icon: "💰", color: "#004aad" },
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

          {/* KPI Cards Row 2 — Operations */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" }}>
            {[
              { label: "Total Receipts", value: data.receipts.total, icon: "🧾", color: "#004aad" },
              { label: "Total Transfers", value: data.transfers.total, icon: "🔄", color: "#5bc0de" },
              { label: "Open Issues", value: data.issues.open, icon: "🔴", color: "#d9534f" },
              { label: "Resolved Issues", value: data.issues.resolved, icon: "🟢", color: "#5cb85c" },
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

          {/* Charts Row */}
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>

{/* Pie Chart — Stock Status Distribution */}
<div style={{ backgroundColor: "white", borderRadius: "12px", border: "1.5px solid #004aad", padding: "16px" }}>
  <h3 style={{ color: "#004aad", marginBottom: "10px", fontSize: "15px" }}>📊 Inventory Status Distribution</h3>
  {data.charts?.stockStatus && data.charts.stockStatus.some((s) => s.value > 0) ? (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data.charts.stockStatus}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={85}
          label={({ name, value }) => value > 0 ? `${name}: ${value}` : ""}
        >
          {data.charts.stockStatus.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={STOCK_COLORS[entry.name] || "#999"} />
          ))}
        </Pie>
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: "12px" }} />
      </PieChart>
    </ResponsiveContainer>
  ) : (
    <p style={{ textAlign: "center", color: "#999", padding: "40px 0" }}>No stock data available</p>
  )}
</div>

{/* Bar Chart — Inventory Value by Stage */}
<div style={{ backgroundColor: "white", borderRadius: "12px", border: "1.5px solid #004aad", padding: "16px" }}>
  <h3 style={{ color: "#004aad", marginBottom: "10px", fontSize: "15px" }}>📦 Inventory Value by Stage</h3>
  {data.inventory.byStage && data.inventory.byStage.length > 0 ? (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data.inventory.byStage} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e8d9b0" />
        <XAxis dataKey="category" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip
          formatter={(value, name) => name === "totalValue" ? [`₹${value.toLocaleString("en-IN")}`, "Value"] : [value, name]}
        />
        <Bar dataKey="totalValue" radius={[6, 6, 0, 0]}>
          {data.inventory.byStage.map((entry, index) => (
            <Cell key={`bar-${index}`} fill={STAGE_COLORS[index % STAGE_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  ) : (
    <p style={{ textAlign: "center", color: "#999", padding: "40px 0" }}>No inventory data available</p>
  )}
</div>

</div>

          {/* Main Content — 2 columns */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>

            {/* Inventory by Stage */}
            <div style={{ backgroundColor: "white", borderRadius: "12px", border: "1.5px solid #004aad", padding: "16px" }}>
              <h3 style={{ color: "#004aad", marginBottom: "14px", fontSize: "15px" }}>📊 Inventory by Stage</h3>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f5e6c8" }}>
                    {["Stage", "Products", "Total Qty", "Total Value"].map((h) => (
                      <th key={h} style={{ padding: "8px", fontSize: "12px", fontWeight: "600", color: "#004aad", borderBottom: "1px solid #e8d9b0", textAlign: "center" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.inventory.byStage.map((s, i) => (
                    <tr key={s.category} style={{ backgroundColor: i % 2 === 0 ? "#fffdf5" : "#fdf6e3" }}>
                      <td style={{ padding: "8px", fontSize: "12px", textAlign: "center" }}>
                        <span style={{ backgroundColor: "#e6f0ff", color: "#004aad", padding: "2px 8px", borderRadius: "10px", fontSize: "11px" }}>
                          {s.category}
                        </span>
                      </td>
                      <td style={{ padding: "8px", fontSize: "12px", textAlign: "center", fontWeight: "600" }}>{s.productCount}</td>
                      <td style={{ padding: "8px", fontSize: "12px", textAlign: "center" }}>{s.totalQty}</td>
                      <td style={{ padding: "8px", fontSize: "12px", textAlign: "center" }}>{formatINR(s.totalValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Unresolved Issues Panel */}
            <div style={{ backgroundColor: "white", borderRadius: "12px", border: "1.5px solid #d9534f", padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <h3 style={{ color: "#d9534f", fontSize: "15px", margin: 0 }}>🔴 Unresolved Issues ({data.issues.open + data.issues.inProgress})</h3>
                <button onClick={() => navigate("/inventory/issues")} style={{ backgroundColor: "#d9534f", color: "white", border: "none", padding: "4px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}>
                  View All
                </button>
              </div>

{data.issues.unresolved.map((issue) => (
  <div
    key={issue.issue_id}
    onClick={() => navigate("/inventory/issues")}
    style={{
      padding: "10px 12px", borderRadius: "8px",
      backgroundColor: issue.status === "OPEN" ? "#fdf2f2" : "#fefaf2",
      border: `1px solid ${issue.status === "OPEN" ? "#f5c2c2" : "#ffe082"}`,
      marginBottom: "8px", cursor: "pointer",
      transition: "opacity 0.2s",
    }}
    onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
    onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
  >
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontWeight: "600", fontSize: "13px", color: "#333" }}>{issue.issue_number}</span>
      <span style={{ fontSize: "11px", fontWeight: "600", color: issue.status === "OPEN" ? "#d9534f" : "#f0ad4e" }}>
        {issue.status}
      </span>
    </div>
    <div style={{ fontSize: "12px", color: "#555", marginTop: "4px" }}>
      {issue.product?.product_name} — {issue.issue_type.replace(/_/g, " ")}
    </div>
    <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>
      {new Date(issue.created_at).toLocaleDateString("en-IN")} — Click to view →
    </div>
  </div>
))}
            </div>
          </div>

          {/* Bottom row — Recent Receipts + Recent Movements */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

            {/* Recent Receipts */}
            <div style={{ backgroundColor: "white", borderRadius: "12px", border: "1.5px solid #004aad", padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <h3 style={{ color: "#004aad", fontSize: "15px", margin: 0 }}>🧾 Recent Receipts</h3>
                <button onClick={() => navigate("/receipt/receipts")} style={{ backgroundColor: "#004aad", color: "white", border: "none", padding: "4px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}>
                  View All
                </button>
              </div>
              {data.receipts.recent.length === 0 ? (
                <p style={{ color: "#666", fontSize: "13px", textAlign: "center" }}>No receipts yet</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f5e6c8" }}>
                      {["Receipt #", "Product", "Qty", "Date"].map((h) => (
                        <th key={h} style={{ padding: "6px", fontSize: "11px", fontWeight: "600", color: "#004aad", borderBottom: "1px solid #e8d9b0", textAlign: "center" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.receipts.recent.map((r, i) => (
                      <tr key={r.receipt_id} style={{ backgroundColor: i % 2 === 0 ? "#fffdf5" : "#fdf6e3" }}>
                        <td style={{ padding: "6px", fontSize: "11px", textAlign: "center", fontWeight: "600" }}>{r.receipt_number}</td>
                        <td style={{ padding: "6px", fontSize: "11px", textAlign: "center" }}>{r.product?.product_name}</td>
                        <td style={{ padding: "6px", fontSize: "11px", textAlign: "center", color: "#5cb85c", fontWeight: "600" }}>+{r.quantity}</td>
                        <td style={{ padding: "6px", fontSize: "11px", textAlign: "center" }}>{new Date(r.received_date).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Recent Stock Movements */}
            <div style={{ backgroundColor: "white", borderRadius: "12px", border: "1.5px solid #004aad", padding: "16px" }}>
              <h3 style={{ color: "#004aad", fontSize: "15px", marginBottom: "14px" }}>📦 Recent Stock Movements</h3>
              {data.movements.recent.length === 0 ? (
                <p style={{ color: "#666", fontSize: "13px", textAlign: "center" }}>No movements yet</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f5e6c8" }}>
                      {["Product", "Type", "Qty", "Reference", "Date"].map((h) => (
                        <th key={h} style={{ padding: "6px", fontSize: "11px", fontWeight: "600", color: "#004aad", borderBottom: "1px solid #e8d9b0", textAlign: "center" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.movements.recent.map((m, i) => (
                      <tr key={m.movement_id} style={{ backgroundColor: i % 2 === 0 ? "#fffdf5" : "#fdf6e3" }}>
                        <td style={{ padding: "6px", fontSize: "11px", textAlign: "center" }}>{m.product?.product_name}</td>
                        <td style={{ padding: "6px", fontSize: "11px", textAlign: "center" }}>
                          <span style={{ backgroundColor: m.movement_type === "IN" ? "#dff0d8" : "#f2dede", color: m.movement_type === "IN" ? "#3c763d" : "#a94442", padding: "2px 8px", borderRadius: "10px", fontSize: "10px", fontWeight: "600" }}>
                            {m.movement_type}
                          </span>
                        </td>
                        <td style={{ padding: "6px", fontSize: "11px", textAlign: "center", fontWeight: "600" }}>{m.quantity}</td>
                        <td style={{ padding: "6px", fontSize: "11px", textAlign: "center", color: "#666" }}>{m.reference || "—"}</td>
                        <td style={{ padding: "6px", fontSize: "11px", textAlign: "center" }}>{new Date(m.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Dashboard;