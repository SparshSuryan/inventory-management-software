import { useState } from "react";

function Navbar({ title, onSearch }) {
  const [search, setSearch] = useState("");

  const handleSearch = (e) => {
    setSearch(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  return (
    <div style={{
      height: "80px",
      backgroundColor: "white",
      borderBottom: "2px solid #004aad",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 24px",
      flexShrink: 0,
    }}>
      <h2 style={{
        color: "#004aad",
        fontSize: "28px",
        fontWeight: "900",
        letterSpacing: "3px",
        textTransform: "uppercase",
        margin: 0,
      }}>
        {title}
      </h2>

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{
          display: "flex", alignItems: "center",
          border: "1px solid #ccc", borderRadius: "20px",
          padding: "6px 14px", gap: "8px",
          backgroundColor: "#f5f5f5",
        }}>
          <span style={{ color: "#888" }}>🔍</span>
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="Search..."
            style={{
              border: "none", background: "transparent",
              outline: "none", fontSize: "13px", width: "160px",
            }}
          />
        </div>

        <div style={{
          display: "flex", alignItems: "center", gap: "8px",
          backgroundColor: "#004aad", color: "white",
          padding: "6px 14px", borderRadius: "20px",
          fontSize: "13px", cursor: "pointer",
        }}>
          <span>▼</span>
          <span>USER123</span>
          <div style={{
            width: "28px", height: "28px",
            backgroundColor: "white", borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: "16px" }}>👤</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Navbar;