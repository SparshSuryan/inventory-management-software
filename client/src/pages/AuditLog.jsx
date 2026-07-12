import { useEffect, useState } from "react";
import API from "../api/axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { exportToCSV } from "../utils/exportCSV";

const ACTION_STYLES = {
  CREATE: { color: "#5cb85c", bg: "#f2faf2", label: "Created" },
  UPDATE: { color: "#5bc0de", bg: "#f2fafd", label: "Updated" },
  DELETE: { color: "#d9534f", bg: "#fdf2f2", label: "Deleted" },
  RAISE_ISSUE: { color: "#f0ad4e", bg: "#fefaf2", label: "Issue Raised" },
  RESOLVE_ISSUE: { color: "#5cb85c", bg: "#f2faf2", label: "Issue Resolved" },
};

function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const query = entityFilter ? `?entity_type=${entityFilter}` : "";
    API.get(`/audit${query}`)
      .then((res) => {
        setLogs(res.data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [entityFilter]);

  const filteredLogs = logs.filter((log) => {
    const matchesAction = !actionFilter || log.action === actionFilter;
    const matchesSearch = !searchTerm ||
      log.entity_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesAction && matchesSearch;
  });

  const handleExport = () => {
    const exportData = filteredLogs.map((log) => ({
      log_id: log.log_id,
      action: log.action,
      entity_type: log.entity_type,
      entity_id: log.entity_id,
      performed_by: log.user?.name || "System",
      role: log.user?.role || "—",
      new_values: log.new_values || "",
      old_values: log.old_values || "",
      date: new Date(log.created_at).toLocaleString("en-IN"),
    }));

    const headers = [
      { label: "Log ID", key: "log_id" },
      { label: "Action", key: "action" },
      { label: "Entity Type", key: "entity_type" },
      { label: "Entity ID", key: "entity_id" },
      { label: "Performed By", key: "performed_by" },
      { label: "Role", key: "role" },
      { label: "New Values", key: "new_values" },
      { label: "Old Values", key: "old_values" },
      { label: "Date & Time", key: "date" },
    ];

    exportToCSV("audit_log", headers, exportData);
  };

  // Stats
  const entityTypes = [...new Set(logs.map((l) => l.entity_type))];
  const actionTypes = [...new Set(logs.map((l) => l.action))];

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#fcf6db" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <Navbar title="Audit Log" onSearch={(val) => setSearchTerm(val)} />
        <div style={{ padding: "24px", flex: 1 }}>

          {/* KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" }}>
            {[
              { label: "Total Actions", value: logs.length, icon: "📋", color: "#004aad" },
              { label: "Products Changed", value: logs.filter((l) => l.entity_type === "Product").length, icon: "📦", color: "#5bc0de" },
              { label: "Issues Logged", value: logs.filter((l) => l.entity_type === "Issue").length, icon: "⚠️", color: "#f0ad4e" },
              { label: "Receipts Logged", value: logs.filter((l) => l.entity_type === "Receipt").length, icon: "🧾", color: "#5cb85c" },
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

          {/* Controls */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)} style={selectStyle}>
                <option value="">All Entities</option>
                {entityTypes.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>

              <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} style={selectStyle}>
                <option value="">All Actions</option>
                {actionTypes.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>

              {(entityFilter || actionFilter) && (
                <button onClick={() => { setEntityFilter(""); setActionFilter(""); }}
                  style={{ ...selectStyle, backgroundColor: "#f0f0f0", cursor: "pointer", border: "1px solid #ccc" }}>
                  Clear ✕
                </button>
              )}
            </div>
            <button onClick={handleExport} style={btnExport}>Export CSV ↓</button>
          </div>

          {/* Audit Table */}
          <div style={{ backgroundColor: "white", borderRadius: "12px", border: "1.5px solid #004aad", padding: "16px" }}>
            <div style={{ textAlign: "center", fontWeight: "700", fontSize: "16px", color: "#004aad", marginBottom: "14px" }}>
              Audit Log {filteredLogs.length !== logs.length && `(${filteredLogs.length} of ${logs.length})`}
            </div>

            {loading ? (
              <p style={{ padding: "20px", textAlign: "center" }}>Loading audit logs...</p>
            ) : filteredLogs.length === 0 ? (
              <p style={{ padding: "20px", textAlign: "center", color: "#666" }}>No audit logs found.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #e8d9b0" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f5e6c8" }}>
                    {["Log ID", "Action", "Entity Type", "Entity ID", "Performed By", "Details", "Date & Time"].map((h) => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log, i) => {
                    const actionStyle = ACTION_STYLES[log.action] || { color: "#666", bg: "#f5f5f5", label: log.action };
                    return (
                      <tr key={log.log_id} style={{ backgroundColor: i % 2 === 0 ? "#fffdf5" : "#fdf6e3" }}>
                        <td style={tdStyle}>#{log.log_id}</td>
                        <td style={tdStyle}>
                          <span style={{ backgroundColor: actionStyle.bg, color: actionStyle.color, padding: "3px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "600" }}>
                            {actionStyle.label}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ backgroundColor: "#e6f0ff", color: "#004aad", padding: "2px 8px", borderRadius: "10px", fontSize: "11px" }}>
                            {log.entity_type}
                          </span>
                        </td>
                        <td style={tdStyle}>#{log.entity_id}</td>
                        <td style={tdStyle}>
                          <div style={{ fontSize: "12px" }}>
                            <div style={{ fontWeight: "600" }}>{log.user?.name || "System"}</div>
                            <div style={{ color: "#888", fontSize: "11px" }}>{log.user?.role?.toUpperCase() || "—"}</div>
                          </div>
                        </td>
                        <td style={{ ...tdStyle, maxWidth: "220px", fontSize: "11px", textAlign: "left", verticalAlign: "top" }}>
  {log.new_values ? (
    <div style={{
      backgroundColor: "#f0f8ff",
      padding: "6px 8px",
      borderRadius: "4px",
      fontFamily: "monospace",
      maxWidth: "200px",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    }}>
      {JSON.stringify(JSON.parse(log.new_values), null, 0).slice(0, 60)}
      {log.new_values.length > 60 ? "..." : ""}
    </div>
  ) : "—"}
</td>
<td style={{ ...tdStyle, fontSize: "11px" }}>{new Date(log.created_at).toLocaleString("en-IN")}</td>
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

const thStyle = { padding: "10px", textAlign: "center", fontSize: "13px", fontWeight: "600", color: "#004aad", borderBottom: "2px solid #e8d9b0", borderRight: "1px solid #e8d9b0" };
const tdStyle = {
    padding: "10px",
    textAlign: "center",
    fontSize: "13px",
    borderBottom: "1px solid #e8d9b0",
    borderRight: "1px solid #e8d9b0",
    color: "#333",
    whiteSpace: "nowrap",
  };
const selectStyle = { padding: "8px 12px", border: "1.5px solid #004aad", borderRadius: "6px", fontSize: "13px", backgroundColor: "white", color: "#004aad" };
const btnExport = { backgroundColor: "#5cb85c", color: "white", padding: "10px 20px", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "500" };

export default AuditLog;