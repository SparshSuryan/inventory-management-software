import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import logo from "../assets/MACE_logo.png";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  // Keep Receipt dropdown open if on any receipt-related page
  const isReceiptPage = ["/receipt/receipts", "/receipt/transfers", "/stock", "/sales"].includes(location.pathname);
  const [receiptOpen, setReceiptOpen] = useState(isReceiptPage);

  // Update dropdown state when route changes
  useEffect(() => {
    if (isReceiptPage) setReceiptOpen(true);
  }, [location.pathname]);

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
    fontWeight: isActive(path) ? "600" : "400",
    backgroundColor: isActive(path) ? "rgba(255,255,255,0.08)" : "transparent",
    borderLeft: isActive(path) ? "3px solid white" : "3px solid transparent",
  });

  // Check if any receipt sub-page is active for parent highlight
  const isReceiptActive = isReceiptPage;

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
        <img src={logo} alt="ACE Logo" style={{ width: "60px", height: "60px", objectFit: "contain" }} />
        <div>
          <div style={{ color: "white", fontSize: "15px", fontWeight: "700", lineHeight: "1.4" }}>
            Maruti Suzuki
          </div>
          <div style={{ color: "#cce0ff", fontSize: "13px", lineHeight: "1.4" }}>
            Center for Excellence
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ marginTop: "8px", flex: 1 }}>

        {/* Dashboard */}
        <div style={navItemStyle("/dashboard")} onClick={() => navigate("/dashboard")}>
          Dashboard Summary
        </div>

        {/* Product Management */}
        <div style={navItemStyle("/products")} onClick={() => navigate("/products")}>
          Product Management
        </div>

        {/* Receipt Management dropdown */}
        <div>
          <div
            style={{
              padding: "12px 20px",
              cursor: "pointer",
              color: isReceiptActive ? "white" : "#a8c4e0",
              fontWeight: isReceiptActive ? "600" : "400",
              fontSize: "14px",
              borderLeft: isReceiptActive ? "3px solid white" : "3px solid transparent",
              backgroundColor: isReceiptActive ? "rgba(255,255,255,0.1)" : "transparent",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              transition: "all 0.2s",
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

        {/* Inventory Status */}
        <div style={navItemStyle("/inventory")} onClick={() => navigate("/inventory")}>
          Inventory Status
        </div>

        {/* Audit Log */}
        <div style={navItemStyle("/audit")} onClick={() => navigate("/audit")}>
          Audit Log
        </div>

      </nav>
    </div>
  );
}

export default Sidebar;