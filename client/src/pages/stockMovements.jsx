import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

function StockMovements() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [movements, setMovements] = useState([]);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    API.get(`/products/${productId}`)
      .then((res) => setProduct(res.data.data))
      .catch(() => setError("Failed to fetch product"));

    API.get(`/stock/${productId}/movements`)
      .then((res) => {
        setMovements(res.data.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch stock movements");
        setLoading(false);
      });
  }, [productId]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#fcf6db" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <Navbar title="Stock Movement History" />
        <div style={{ padding: "24px", flex: 1 }}>

          {/* Header with back button */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
            <button
              onClick={() => navigate("/stock")}
              style={{
                backgroundColor: "#004aad", color: "white",
                border: "none", padding: "9px 18px",
                borderRadius: "6px", cursor: "pointer",
                fontSize: "14px", fontWeight: "500",
                whiteSpace: "nowrap",
              }}
            >
              ← Back to Stock Management
            </button>
            {product && (
              <div>
                <h2 style={{ margin: 0, color: "#004aad", fontSize: "18px" }}>
                  {product.product_name}
                  <span style={{
                    fontSize: "13px", color: "#666",
                    fontWeight: "400", marginLeft: "10px",
                  }}>
                    ({product.sku})
                  </span>
                </h2>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#888" }}>
                  {product.category?.category_name} — Unit Price: ₹{product.unit_price?.toLocaleString("en-IN")}
                </p>
              </div>
            )}
          </div>

          {/* KPI summary */}
          {!loading && movements.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
              <div style={{ backgroundColor: "white", border: "1.5px solid #004aad", borderRadius: "10px", padding: "14px 16px", textAlign: "center" }}>
                <div style={{ fontSize: "13px", color: "#555", fontWeight: "500" }}>Total Movements</div>
                <div style={{ fontSize: "26px", fontWeight: "700", color: "#004aad", marginTop: "4px" }}>
                  {movements.length}
                </div>
              </div>
              <div style={{ backgroundColor: "white", border: "1.5px solid #5cb85c", borderRadius: "10px", padding: "14px 16px", textAlign: "center" }}>
                <div style={{ fontSize: "13px", color: "#555", fontWeight: "500" }}>Total IN</div>
                <div style={{ fontSize: "26px", fontWeight: "700", color: "#5cb85c", marginTop: "4px" }}>
                  +{movements.filter((m) => m.movement_type === "IN").reduce((sum, m) => sum + m.quantity, 0)}
                </div>
              </div>
              <div style={{ backgroundColor: "white", border: "1.5px solid #d9534f", borderRadius: "10px", padding: "14px 16px", textAlign: "center" }}>
                <div style={{ fontSize: "13px", color: "#555", fontWeight: "500" }}>Total OUT</div>
                <div style={{ fontSize: "26px", fontWeight: "700", color: "#d9534f", marginTop: "4px" }}>
                  -{movements.filter((m) => m.movement_type === "OUT").reduce((sum, m) => sum + m.quantity, 0)}
                </div>
              </div>
            </div>
          )}

          {/* Movements table */}
          <div style={{ backgroundColor: "white", borderRadius: "12px", border: "1.5px solid #004aad", padding: "16px" }}>
            <div style={{ textAlign: "center", fontWeight: "700", fontSize: "16px", color: "#004aad", marginBottom: "14px" }}>
              Movement History
            </div>

            {loading ? (
              <p style={{ padding: "20px", textAlign: "center" }}>Loading movements...</p>
            ) : error ? (
              <p style={{ padding: "20px", textAlign: "center", color: "red" }}>{error}</p>
            ) : movements.length === 0 ? (
              <p style={{ padding: "20px", textAlign: "center", color: "#666" }}>
                No stock movements found for this product.
              </p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #e8d9b0" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f5e6c8" }}>
                    {["Movement ID", "Type", "Quantity", "Reference", "Remarks", "Date & Time"].map((h) => (
                      <th key={h} style={{
                        padding: "10px", textAlign: "center",
                        fontSize: "13px", fontWeight: "600",
                        color: "#004aad", borderBottom: "2px solid #e8d9b0",
                        borderRight: "1px solid #e8d9b0",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {movements.map((movement, index) => (
                    <tr key={movement.movement_id} style={{
                      backgroundColor: index % 2 === 0 ? "#fffdf5" : "#fdf6e3",
                    }}>
                      <td style={tdStyle}>#{movement.movement_id}</td>
                      <td style={tdStyle}>
                        <span style={{
                          backgroundColor: movement.movement_type === "IN" ? "#dff0d8" : "#f2dede",
                          color: movement.movement_type === "IN" ? "#3c763d" : "#a94442",
                          padding: "4px 12px", borderRadius: "12px",
                          fontWeight: "600", fontSize: "12px",
                        }}>
                          {movement.movement_type === "IN" ? "▲ IN" : "▼ OUT"}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, fontWeight: "700", color: movement.movement_type === "IN" ? "#3c763d" : "#a94442" }}>
                        {movement.movement_type === "IN" ? "+" : "-"}{movement.quantity} units
                      </td>
                      <td style={tdStyle}>{movement.reference || "—"}</td>
                      <td style={tdStyle}>{movement.remarks || "—"}</td>
                      <td style={{ ...tdStyle, fontSize: "12px" }}>
                        {new Date(movement.created_at).toLocaleString("en-IN")}
                      </td>
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

const tdStyle = {
  padding: "10px", textAlign: "center",
  fontSize: "13px", borderBottom: "1px solid #e8d9b0",
  borderRight: "1px solid #e8d9b0", color: "#333",
};

export default StockMovements;