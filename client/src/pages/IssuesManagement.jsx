import { useEffect, useState } from "react";
import API from "../api/axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

const ISSUE_TYPES = [
  { value: "LOW_STOCK", label: "Low Stock", color: "#f0ad4e", bg: "#fefaf2" },
  { value: "OUT_OF_STOCK", label: "Out of Stock", color: "#d9534f", bg: "#fdf2f2" },
  { value: "SURPLUS_STOCK", label: "Surplus Stock", color: "#5cb85c", bg: "#f2faf2" },
  { value: "DAMAGED_STOCK", label: "Damaged Stock", color: "#777", bg: "#f5f5f5" },
];

const STATUS_STYLES = {
  OPEN: { label: "Open", color: "#d9534f", bg: "#fdf2f2" },
  IN_PROGRESS: { label: "In Progress", color: "#f0ad4e", bg: "#fefaf2" },
  RESOLVED: { label: "Resolved", color: "#5cb85c", bg: "#f2faf2" },
};

const STAGES = ["Raw Material", "Work In Progress", "Finished Product"];

function IssuesManagement() {
  const [issues, setIssues] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);
  const [timeFilter, setTimeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const [formData, setFormData] = useState({
    product_id: "",
    issue_type: "",
    stage: "",
    description: "",
  });

  const fetchIssues = () => {
    const query = timeFilter ? `?filter=${timeFilter}` : "";
    API.get(`/issues${query}`)
      .then((res) => {
        setIssues(res.data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const fetchProducts = () => {
    API.get("/products").then((res) => setProducts(res.data.data));
  };

  useEffect(() => {
    fetchIssues();
    fetchProducts();
  }, [timeFilter]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError(null);

    API.post("/issues", formData)
      .then((res) => {
        setFormSuccess(res.data.message);
        setShowForm(false);
        setFormData({ product_id: "", issue_type: "", stage: "", description: "" });
        fetchIssues();
      })
      .catch((err) => setFormError(err.response?.data?.message || "Failed to raise issue"));
  };

  const handleResolve = (id) => {
    if (!window.confirm("Mark this issue as Resolved?")) return;
    API.put(`/issues/${id}/resolve`)
      .then((res) => {
        setFormSuccess(res.data.message);
        fetchIssues();
      })
      .catch((err) => setFormError(err.response?.data?.message || "Failed to resolve issue"));
  };

  const handleProgress = (id) => {
    API.put(`/issues/${id}/progress`)
      .then(() => {
        setFormSuccess("Issue marked as In Progress");
        fetchIssues();
      })
      .catch(() => setFormError("Failed to update issue"));
  };

  // Apply frontend filters
  const filteredIssues = issues.filter((issue) => {
    const matchesStatus = !statusFilter || issue.status === statusFilter;
    const matchesType = !typeFilter || issue.issue_type === typeFilter;
    return matchesStatus && matchesType;
  });

  // Stats
  const openCount = issues.filter((i) => i.status === "OPEN").length;
  const inProgressCount = issues.filter((i) => i.status === "IN_PROGRESS").length;
  const resolvedCount = issues.filter((i) => i.status === "RESOLVED").length;

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#fcf6db" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <Navbar title="Issues Management" />
        <div style={{ padding: "24px", flex: 1 }}>

          {/* KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" }}>
            {[
              { label: "Total Issues", value: issues.length, color: "#004aad", icon: "📋" },
              { label: "Open", value: openCount, color: "#d9534f", icon: "🔴" },
              { label: "In Progress", value: inProgressCount, color: "#f0ad4e", icon: "🟡" },
              { label: "Resolved", value: resolvedCount, color: "#5cb85c", icon: "🟢" },
            ].map((k) => (
              <div key={k.label} style={{ backgroundColor: "white", border: "1.5px solid #004aad", borderRadius: "10px", padding: "16px", textAlign: "center" }}>
                <div style={{ fontSize: "13px", fontWeight: "500", color: "#555" }}>{k.label}</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "8px" }}>
                  <span style={{ fontSize: "22px" }}>{k.icon}</span>
                  <span style={{ fontSize: "30px", fontWeight: "700", color: k.color }}>{k.value}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Controls row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>

              {/* Time filter */}
              <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} style={selectStyle}>
                <option value="">All Time</option>
                <option value="1day">Last 1 Day</option>
                <option value="1week">Last 1 Week</option>
                <option value="1month">Last 1 Month</option>
              </select>

              {/* Status filter */}
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selectStyle}>
                <option value="">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
              </select>

              {/* Type filter */}
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={selectStyle}>
                <option value="">All Types</option>
                {ISSUE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>

              {(timeFilter || statusFilter || typeFilter) && (
                <button onClick={() => { setTimeFilter(""); setStatusFilter(""); setTypeFilter(""); }} style={{ ...selectStyle, cursor: "pointer", backgroundColor: "#f0f0f0" }}>
                  Clear ✕
                </button>
              )}
            </div>

            <button onClick={() => { setShowForm(true); setFormError(null); setFormSuccess(null); }} style={btnPrimary}>
              + Raise Issue
            </button>
          </div>

          {/* Messages */}
          {formSuccess && <p style={{ color: "green", fontWeight: "500", marginBottom: "12px" }}>{formSuccess}</p>}
          {formError && <p style={{ color: "red", fontWeight: "500", marginBottom: "12px" }}>{formError}</p>}

          {/* Raise Issue Form */}
          {showForm && (
            <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "10px", border: "1px solid #ddd", marginBottom: "20px" }}>
              <h3 style={{ marginBottom: "16px", color: "#004aad" }}>Raise New Issue</h3>
              <form onSubmit={handleSubmit}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>

                  <div>
                    <label style={labelStyle}>Product *</label>
                    <select name="product_id" value={formData.product_id} onChange={handleChange} required style={inputStyle}>
                      <option value="">-- Select product --</option>
                      {products.map((p) => (
                        <option key={p.product_id} value={p.product_id}>
                          {p.product_name} ({p.sku})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>Issue Type *</label>
                    <select name="issue_type" value={formData.issue_type} onChange={handleChange} required style={inputStyle}>
                      <option value="">-- Select type --</option>
                      {ISSUE_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>Stage *</label>
                    <select name="stage" value={formData.stage} onChange={handleChange} required style={inputStyle}>
                      <option value="">-- Select stage --</option>
                      {STAGES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>Description</label>
                    <input name="description" value={formData.description} onChange={handleChange} style={inputStyle} placeholder="Describe the issue..." />
                  </div>

                </div>
                <div style={{ marginTop: "16px", display: "flex", gap: "10px" }}>
                  <button type="submit" style={btnPrimary}>Raise Issue</button>
                  <button type="button" onClick={() => { setShowForm(false); setFormData({ product_id: "", issue_type: "", stage: "", description: "" }); }} style={btnCancel}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* Issues Table */}
          <div style={{ backgroundColor: "white", borderRadius: "12px", border: "1.5px solid #004aad", padding: "16px" }}>
            <div style={{ textAlign: "center", fontWeight: "700", fontSize: "16px", color: "#004aad", marginBottom: "14px" }}>
              Issues Table {filteredIssues.length !== issues.length && `(${filteredIssues.length} of ${issues.length})`}
            </div>

            {loading ? (
              <p style={{ padding: "20px", textAlign: "center" }}>Loading issues...</p>
            ) : filteredIssues.length === 0 ? (
              <p style={{ padding: "20px", textAlign: "center", color: "#666" }}>No issues found.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #e8d9b0" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f5e6c8" }}>
                    {["Issue #", "Product", "SKU", "Stage", "Issue Type", "Description", "Status", "Raised On", "Actions"].map((h) => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredIssues.map((issue, i) => {
                    const typeStyle = ISSUE_TYPES.find((t) => t.value === issue.issue_type);
                    const statusStyle = STATUS_STYLES[issue.status];

                    return (
                      <tr key={issue.issue_id} style={{ backgroundColor: i % 2 === 0 ? "#fffdf5" : "#fdf6e3" }}>
                        <td style={tdStyle}><strong>{issue.issue_number}</strong></td>
                        <td style={tdStyle}>{issue.product?.product_name}</td>
                        <td style={tdStyle}>{issue.product?.sku}</td>
                        <td style={tdStyle}>
                          <span style={{ backgroundColor: "#e6f0ff", color: "#004aad", padding: "2px 8px", borderRadius: "10px", fontSize: "11px" }}>
                            {issue.stage}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ backgroundColor: typeStyle?.bg, color: typeStyle?.color, padding: "3px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "600" }}>
                            {typeStyle?.label || issue.issue_type}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, maxWidth: "200px", fontSize: "12px" }}>{issue.description || "—"}</td>
                        <td style={tdStyle}>
                          <span style={{ backgroundColor: statusStyle?.bg, color: statusStyle?.color, padding: "3px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "600" }}>
                            {statusStyle?.label || issue.status}
                          </span>
                        </td>
                        <td style={tdStyle}>{new Date(issue.created_at).toLocaleDateString()}</td>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", gap: "6px", justifyContent: "center", flexWrap: "wrap" }}>
                            {issue.status === "OPEN" && (
                              <button onClick={() => handleProgress(issue.issue_id)} style={btnProgress}>
                                In Progress
                              </button>
                            )}
                            {issue.status !== "RESOLVED" && (
                              <button onClick={() => handleResolve(issue.issue_id)} style={btnResolve}>
                                Resolve ✓
                              </button>
                            )}
                            {issue.status === "RESOLVED" && (
                              <span style={{ color: "#5cb85c", fontSize: "12px", fontWeight: "600" }}>✓ Resolved</span>
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

        </div>
      </div>
    </div>
  );
}

const labelStyle = { display: "block", marginBottom: "4px", fontSize: "13px", fontWeight: "500", color: "#333" };
const inputStyle = { width: "100%", padding: "8px 10px", border: "1px solid #ccc", borderRadius: "6px", fontSize: "14px" };
const selectStyle = { padding: "8px 12px", border: "1.5px solid #004aad", borderRadius: "6px", fontSize: "13px", backgroundColor: "white", color: "#004aad" };
const btnPrimary = { backgroundColor: "#004aad", color: "white", padding: "10px 20px", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "500" };
const btnCancel = { backgroundColor: "#ccc", color: "#333", padding: "10px 24px", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px" };
const btnResolve = { backgroundColor: "#5cb85c", color: "white", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "11px", fontWeight: "600" };
const btnProgress = { backgroundColor: "#f0ad4e", color: "white", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "11px", fontWeight: "600" };
const thStyle = { padding: "10px", textAlign: "center", fontSize: "13px", fontWeight: "600", color: "#004aad", borderBottom: "2px solid #e8d9b0", borderRight: "1px solid #e8d9b0" };
const tdStyle = { padding: "10px", textAlign: "center", fontSize: "13px", borderBottom: "1px solid #e8d9b0", borderRight: "1px solid #e8d9b0", color: "#333" };

export default IssuesManagement;