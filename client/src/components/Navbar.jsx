import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUser, logout } from "../utils/auth";

function Navbar({ title, onSearch }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const user = getUser();

  const handleSearch = (e) => {
    setSearch(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
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
        {/* Search */}
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

        {/* User info + Logout */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "8px",
            backgroundColor: "#004aad", color: "white",
            padding: "6px 14px", borderRadius: "20px",
            fontSize: "13px",
          }}>
            <div style={{
              width: "28px", height: "28px",
              backgroundColor: "white", borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: "14px" }}>👤</span>
            </div>
            <span>{user?.name || "USER"}</span>
            <span style={{ fontSize: "11px", backgroundColor: "rgba(255,255,255,0.2)", padding: "2px 6px", borderRadius: "10px" }}>
              {user?.role?.toUpperCase() || "USER"}
            </span>
          </div>

          <button
            onClick={handleLogout}
            style={{
              backgroundColor: "#d9534f", color: "white",
              border: "none", padding: "8px 14px",
              borderRadius: "20px", cursor: "pointer",
              fontSize: "12px", fontWeight: "600",
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default Navbar;