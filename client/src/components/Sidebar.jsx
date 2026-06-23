import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [receiptOpen, setReceiptOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const navItemStyle = (path) => ({
    padding: "12px 20px",
    cursor: "pointer",
    color: isActive(path) ? "white" : "#a8c4e0",
    fontWeight: isActive(path) ? "600" : "400",
    fontSize: "14px",
    borderLeft: isActive(path) ? "3px solid white" : "3px solid transparent",
    backgroundColor: isActive(path) ? "rgba(255,255,255,0.1)" : "transparent",
    transition: "all 0.2s",
  });

  const dropdownItemStyle = (path) => ({
    padding: "8px 20px 8px 36px",
    cursor: "pointer",
    color: isActive(path) ? "white" : "#a8c4e0",
    fontSize: "13px",
    backgroundColor: isActive(path) ? "rgba(255,255,255,0.08)" : "transparent",
  });

  return (
    <div style={{
      width: "220px",
      minHeight: "100vh",
      backgroundColor: "#004aad",
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
    }}>
      {/* Logo */}
<div style={{
  padding: "0 20px",
  borderBottom: "2px solid white",
  display: "flex",
  alignItems: "center",
  gap: "12px",
  height: "80px",
  flexShrink: 0,
}}>
  <img
    src="/src/assets/MACE_logo.png"
    alt="ACE Logo"
    style={{ width: "95px", height: "95px", objectFit: "contain" }}
  />
  <div>
    <div style={{ color: "white", fontSize: "11px", fontWeight: "700", lineHeight: "1.4" }}>
      Maruti Suzuki
    </div>
    <div style={{ color: "white", fontSize: "11px", lineHeight: "1.4" , fontWeight: "700", justifyContent: "center"}}>
      Center for Excellence
    </div>
  </div>
</div>

      {/* Navigation */}
      <nav style={{ marginTop: "8px", flex: 1 }}>

        {/* Dashboard */}
        <div
          style={navItemStyle("/dashboard")}
          onClick={() => navigate("/dashboard")}
        >
          Dashboard Summary
        </div>

        {/* Product Management */}
        <div
          style={navItemStyle("/products")}
          onClick={() => navigate("/products")}
        >
          Product Management
        </div>

        {/* Receipt Management dropdown */}
        <div>
          <div
            style={{
              ...navItemStyle("/receipt"),
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
            onClick={() => setReceiptOpen(!receiptOpen)}
          >
            <span>Receipt Management</span>
            <span style={{ fontSize: "11px" }}>{receiptOpen ? "▲" : "▼"}</span>
          </div>
          {receiptOpen && (
            <div>
              <div style={dropdownItemStyle("/receipt/receipts")} onClick={() => navigate("/receipt/receipts")}>
                Receipts
              </div>
              <div style={dropdownItemStyle("/receipt/transfers")} onClick={() => navigate("/receipt/transfers")}>
                Inventory Transfers
              </div>
              <div style={dropdownItemStyle("/stock")} onClick={() => navigate("/stock")}>
                Stock Management
              </div>
              <div style={dropdownItemStyle("/sales")} onClick={() => navigate("/sales")}>
                Sales History
              </div>
            </div>
          )}
        </div>

        {/* Issues Management */}
        <div style={navItemStyle("/inventory/issues")} onClick={() => navigate("/inventory/issues")}>
        Issues Management 
        </div>

        {/* Audit Log */}
        <div style={navItemStyle("/audit")} onClick={() => navigate("/audit")}>
          Audit Log
        </div>

        {/* Inventory Status dropdown */}
        <div style={navItemStyle("/inventory")} onClick={() => navigate("/inventory")}>
          Inventory Status
        </div>

      </nav>
    </div>
  );
}

export default Sidebar;