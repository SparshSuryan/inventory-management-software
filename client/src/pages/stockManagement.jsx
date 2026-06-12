import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

// 4-colour stock status logic
const getStockStatus = (quantity, reorderLevel) => {
  if (quantity === 0)
    return { label: "Out of Stock", color: "#d9534f", bg: "#fdf2f2" };
  if (quantity <= reorderLevel)
    return { label: "Low Stock", color: "#f0ad4e", bg: "#fefaf2" };
  if (quantity <= reorderLevel * 2)
    return { label: "Sufficient", color: "#5bc0de", bg: "#f2fafd" };
  return { label: "Surplus", color: "#5cb85c", bg: "#f2faf2" };
};

function StockManagement() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [stockMap, setStockMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stockQty, setStockQty] = useState({});
  const [message, setMessage] = useState(null);
  const [msgType, setMsgType] = useState("success");

  const fetchProducts = () => {
    API.get("/products")
      .then((res) => {
        const prods = res.data.data;
        setProducts(prods);
        setLoading(false);
        prods.forEach((p) => fetchStock(p.product_id));
      })
      .catch(() => {
        setError("Failed to fetch products");
        setLoading(false);
      });
  };

  const fetchStock = (productId) => {
    API.get(`/stock/${productId}`)
      .then((res) => {
        setStockMap((prev) => ({ ...prev, [productId]: res.data.data }));
      })
      .catch(() => {
        setStockMap((prev) => ({ ...prev, [productId]: null }));
      });
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleStockQtyChange = (productId, value) => {
    setStockQty((prev) => ({ ...prev, [productId]: value }));
  };

  const showMsg = (text, type = "success") => {
    setMessage(text);
    setMsgType(type);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleIncrease = (productId) => {
    const qty = parseInt(stockQty[productId]);
    if (!qty || qty <= 0) {
      showMsg("Please enter a valid quantity", "error");
      return;
    }
    API.post(`/stock/${productId}/increase`, {
      quantity: qty,
      reference: "Manual update",
    })
      .then(() => {
        showMsg(`Stock increased by ${qty} units`);
        setStockQty((prev) => ({ ...prev, [productId]: "" }));
        fetchStock(productId);
      })
      .catch((err) => {
        showMsg(err.response?.data?.message || "Failed to increase stock", "error");
      });
  };

  const handleDecrease = (productId) => {
    const qty = parseInt(stockQty[productId]);
    if (!qty || qty <= 0) {
      showMsg("Please enter a valid quantity", "error");
      return;
    }
    API.post(`/stock/${productId}/decrease`, {
      quantity: qty,
      reference: "Manual update",
    })
      .then(() => {
        showMsg(`Stock decreased by ${qty} units`);
        setStockQty((prev) => ({ ...prev, [productId]: "" }));
        fetchStock(productId);
      })
      .catch((err) => {
        showMsg(err.response?.data?.message || "Failed to decrease stock", "error");
      });
  };

  if (loading) return <p style={{ padding: "20px" }}>Loading stock data...</p>;
  if (error) return <p style={{ padding: "20px", color: "red" }}>{error}</p>;

  return (
    <div style={{ padding: "20px" }}>

      {/* Header */}
      <h1>Stock Management</h1>

      {/* Message */}
      {message && (
        <p style={{
          marginTop: "12px", fontWeight: "500",
          color: msgType === "success" ? "green" : "red",
        }}>
          {message}
        </p>
      )}

      {/* Legend */}
      <div style={{
        display: "flex", gap: "16px", marginTop: "16px",
        flexWrap: "wrap",
      }}>
        {[
          { label: "Surplus", color: "#5cb85c" },
          { label: "Sufficient", color: "#5bc0de" },
          { label: "Low Stock", color: "#f0ad4e" },
          { label: "Out of Stock", color: "#d9534f" },
        ].map((s) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
            <div style={{
              width: "12px", height: "12px", borderRadius: "50%",
              backgroundColor: s.color,
            }} />
            {s.label}
          </div>
        ))}
      </div>

      {/* Stock Table */}
      {products.length === 0 ? (
        <p style={{ marginTop: "20px" }}>No products found.</p>
      ) : (
        <table border="1" cellPadding="8" style={{
          marginTop: "16px", width: "100%",
          borderCollapse: "collapse", backgroundColor: "white",
        }}>
          <thead style={{ backgroundColor: "#1a3c5e", color: "white" }}>
            <tr>
              <th>S.No</th>
              <th>Product Name</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Current Qty</th>
              <th>Reorder Level</th>
              <th>Stock Status</th>
              <th>Update Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => {
              const stock = stockMap[product.product_id];
              const qty = stock?.quantity ?? null;
              const reorder = stock?.reorder_level ?? 0;
              const status = stock ? getStockStatus(qty, reorder) : null;

              return (
                <tr key={product.product_id} style={{ textAlign: "center" }}>
                  <td>{index + 1}</td>
                  <td>{product.product_name}</td>
                  <td>{product.sku}</td>
                  <td>{product.category?.category_name || "N/A"}</td>
                  <td style={{ fontWeight: "600" }}>
                    {stock === undefined ? "..." : stock === null ? "—" : `${qty}`}
                  </td>
                  <td>{stock ? reorder : "—"}</td>

                  {/* 4-colour status circle */}
                  <td>
                    {status ? (
                      <div style={{
                        display: "flex", alignItems: "center",
                        justifyContent: "center", gap: "6px",
                      }}>
                        <div style={{
                          width: "14px", height: "14px", borderRadius: "50%",
                          backgroundColor: status.color, flexShrink: 0,
                        }} />
                        <span style={{
                          fontSize: "12px", fontWeight: "500",
                          color: status.color,
                        }}>
                          {status.label}
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: "#999", fontSize: "12px" }}>No record</span>
                    )}
                  </td>

                  {/* + / - buttons */}
                  <td>
                    {stock ? (
                      <div style={{
                        display: "flex", alignItems: "center",
                        justifyContent: "center", gap: "6px",
                      }}>
                        <button
                          onClick={() => handleDecrease(product.product_id)}
                          style={btnMinus}
                        >−</button>
                        <input
                          type="number" min="1"
                          value={stockQty[product.product_id] || ""}
                          onChange={(e) => handleStockQtyChange(product.product_id, e.target.value)}
                          placeholder="qty"
                          style={{
                            width: "55px", textAlign: "center",
                            padding: "4px", border: "1px solid #ccc",
                            borderRadius: "4px", fontSize: "13px",
                          }}
                        />
                        <button
                          onClick={() => handleIncrease(product.product_id)}
                          style={btnPlus}
                        >+</button>
                      </div>
                    ) : (
                      <span style={{ color: "#999", fontSize: "12px" }}>No stock record</span>
                    )}
                  </td>

                  {/* History */}
                  <td>
                    <button
                      onClick={() => navigate(`/stock/${product.product_id}/movements`)}
                      style={btnHistory}
                    >
                      History
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

const btnPlus = {
  backgroundColor: "#1a3c5e", color: "white",
  border: "none", padding: "4px 10px",
  borderRadius: "4px", cursor: "pointer", fontSize: "16px",
};
const btnMinus = {
  backgroundColor: "#d9534f", color: "white",
  border: "none", padding: "4px 10px",
  borderRadius: "4px", cursor: "pointer", fontSize: "16px",
};
const btnHistory = {
  backgroundColor: "#5bc0de", color: "white",
  border: "none", padding: "6px 12px",
  borderRadius: "4px", cursor: "pointer",
};

export default StockManagement;