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
    // Fetch product details
    API.get(`/products/${productId}`)
      .then((res) => setProduct(res.data.data))
      .catch(() => setError("Failed to fetch product"));

    // Fetch stock movements
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

  if (loading) return <p style={{ padding: "20px" }}>Loading movements...</p>;
  if (error) return <p style={{ padding: "20px", color: "red" }}>{error}</p>;

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#fcf6db" }}>
  <Sidebar />
  <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
    <Navbar title="Stock Movement History" />
    <div style={{ padding: "24px" }}>

    <div style={{ padding: "20px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
        <button
          onClick={() => navigate("/products")}
          style={{
            backgroundColor: "#1a3c5e",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          ← Back to Products
        </button>
        <h1>
          Stock Movement History
          {product && (
            <span style={{ fontSize: "16px", color: "#666", marginLeft: "10px" }}>
              — {product.product_name} ({product.sku})
            </span>
          )}
        </h1>
      </div>

      {movements.length === 0 ? (
        <p>No stock movements found for this product.</p>
      ) : (
        <table border="1" cellPadding="8" style={{
          width: "100%",
          borderCollapse: "collapse",
          backgroundColor: "white",
        }}>
          <thead style={{ backgroundColor: "#1a3c5e", color: "white" }}>
            <tr>
              <th>Movement ID</th>
              <th>Type</th>
              <th>Quantity</th>
              <th>Reference</th>
              <th>Remarks</th>
              <th>Date & Time</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((movement) => (
              <tr key={movement.movement_id} style={{ textAlign: "center" }}>
                <td>{movement.movement_id}</td>
                <td>
                  <span style={{
                    backgroundColor: movement.movement_type === "IN" ? "#dff0d8" : "#f2dede",
                    color: movement.movement_type === "IN" ? "#3c763d" : "#a94442",
                    padding: "3px 10px",
                    borderRadius: "12px",
                    fontWeight: "600",
                    fontSize: "12px",
                  }}>
                    {movement.movement_type}
                  </span>
                </td>
                <td style={{ fontWeight: "600" }}>{movement.quantity} units</td>
                <td>{movement.reference || "—"}</td>
                <td>{movement.remarks || "—"}</td>
                <td>{new Date(movement.created_at).toLocaleString()}</td>
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

export default StockMovements;