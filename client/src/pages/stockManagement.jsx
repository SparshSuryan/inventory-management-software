import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { formatINR } from "../utils/formatCurrency";
import { exportToCSV } from "../utils/exportCSV";

const getStockStatus = (quantity, reorderLevel) => {
  if (quantity === 0)
    return { label: "Out of Stock", color: "#d9534f" };
  if (quantity <= reorderLevel)
    return { label: "Low Stock", color: "#f0ad4e" };
  if (quantity <= reorderLevel * 2)
    return { label: "Sufficient", color: "#5bc0de" };
  return { label: "Surplus", color: "#5cb85c" };
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
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // KPI stats
  const [stats, setStats] = useState({
    total: 0, surplus: 0, sufficient: 0, lowStock: 0, outOfStock: 0, totalValue: 0,
  });

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
        setStockMap((prev) => {
          const updated = { ...prev, [productId]: res.data.data };
          return updated;
        });
      })
      .catch(() => {
        setStockMap((prev) => ({ ...prev, [productId]: null }));
      });
  };

  // Recalculate KPIs whenever stockMap or products change
  useEffect(() => {
    if (products.length === 0) return;
    let surplus = 0, sufficient = 0, lowStock = 0, outOfStock = 0, totalValue = 0;

    products.forEach((p) => {
      const stock = stockMap[p.product_id];
      if (!stock) return;
      const status = getStockStatus(stock.quantity, stock.reorder_level);
      if (status.label === "Surplus") surplus++;
      else if (status.label === "Sufficient") sufficient++;
      else if (status.label === "Low Stock") lowStock++;
      else if (status.label === "Out of Stock") outOfStock++;
      totalValue += p.unit_price * stock.quantity;
    });

    setStats({ total: products.length, surplus, sufficient, lowStock, outOfStock, totalValue });
  }, [stockMap, products]);

  useEffect(() => { fetchProducts(); }, []);

  const showMsg = (text, type = "success") => {
    setMessage(text);
    setMsgType(type);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleStockQtyChange = (productId, value) => {
    setStockQty((prev) => ({ ...prev, [productId]: value }));
  };

  const handleIncrease = (productId) => {
    const qty = parseInt(stockQty[productId]);
    if (!qty || qty <= 0) { showMsg("Please enter a valid quantity", "error"); return; }
    API.post(`/stock/${productId}/increase`, { quantity: qty, reference: "Manual update" })
      .then(() => {
        showMsg(`Stock increased by ${qty} units`);
        setStockQty((prev) => ({ ...prev, [productId]: "" }));
        fetchStock(productId);
      })
      .catch((err) => showMsg(err.response?.data?.message || "Failed to increase stock", "error"));
  };

  const handleDecrease = (productId) => {
    const qty = parseInt(stockQty[productId]);
    if (!qty || qty <= 0) { showMsg("Please enter a valid quantity", "error"); return; }
    API.post(`/stock/${productId}/decrease`, { quantity: qty, reference: "Manual update" })
      .then(() => {
        showMsg(`Stock decreased by ${qty} units`);
        setStockQty((prev) => ({ ...prev, [productId]: "" }));
        fetchStock(productId);
      })
      .catch((err) => showMsg(err.response?.data?.message || "Failed to decrease stock", "error"));
  };

  // Unique categories for filter
  const uniqueCategories = [...new Set(products.map((p) => p.category?.category_name).filter(Boolean))];

  // Filtered products
  const filteredProducts = products.filter((p) => {
    const stock = stockMap[p.product_id];
    const status = stock ? getStockStatus(stock.quantity, stock.reorder_level) : null;

    const matchesSearch =
      !searchTerm ||
      p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      !filterCategory || p.category?.category_name === filterCategory;

    const matchesStatus =
      !filterStatus || (status && status.label === filterStatus);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (loading) return <p style={{ padding: "20px" }}>Loading stock data...</p>;
  if (error) return <p style={{ padding: "20px", color: "red" }}>{error}</p>;

  const handleExport = () => {
    const exportData = filteredProducts.map((p) => {
      const stock = stockMap[p.product_id];
      const status = stock ? getStockStatus(stock.quantity, stock.reorder_level) : null;
      return {
        product_id: p.product_id,
        product_name: p.product_name,
        sku: p.sku,
        category: p.category?.category_name || "N/A",
        quantity: stock?.quantity ?? "No Record",
        reorder_level: stock?.reorder_level ?? "N/A",
        stock_status: status?.label || "No Record",
        unit_price: p.unit_price,
      };
    });
  
    const headers = [
      { label: "Product ID", key: "product_id" },
      { label: "Product Name", key: "product_name" },
      { label: "SKU", key: "sku" },
      { label: "Category", key: "category" },
      { label: "Current Quantity", key: "quantity" },
      { label: "Reorder Level", key: "reorder_level" },
      { label: "Stock Status", key: "stock_status" },
      { label: "Unit Price", key: "unit_price" },
    ];
  
    exportToCSV("stock_management", headers, exportData);
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#fcf6db" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <Navbar title="Stock Management" onSearch={(val) => setSearchTerm(val)} />
        <div style={{ padding: "24px", flex: 1 }}>

          {/* KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px", marginBottom: "20px" }}>
            {[
              { label: "Total Products", value: stats.total, icon: "📦", color: "#004aad" },
              { label: "Surplus", value: stats.surplus, icon: "🟢", color: "#5cb85c" },
              { label: "Sufficient", value: stats.sufficient, icon: "🔵", color: "#5bc0de" },
              { label: "Low Stock", value: stats.lowStock, icon: "⚠️", color: "#f0ad4e" },
              { label: "Out of Stock", value: stats.outOfStock, icon: "❌", color: "#d9534f" },
            ].map((k) => (
              <div key={k.label} style={{
                backgroundColor: "white", border: "1.5px solid #004aad",
                borderRadius: "10px", padding: "14px 16px", textAlign: "center",
              }}>
                <div style={{ fontSize: "13px", fontWeight: "500", color: "#555" }}>{k.label}</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "6px" }}>
                  <span style={{ fontSize: "20px" }}>{k.icon}</span>
                  <span style={{ fontSize: "28px", fontWeight: "700", color: k.color }}>{k.value}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Total Value + Filters row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
            <div style={{
              backgroundColor: "white", border: "1.5px solid #004aad",
              borderRadius: "10px", padding: "10px 20px",
              fontSize: "16px", fontWeight: "700", color: "#004aad",
            }}>
              Total Inventory Value: {formatINR(stats.totalValue)}
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {/* Filter by Category */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                style={selectStyle}
              >
                <option value="">All Categories</option>
                {uniqueCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {/* Filter by Status */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={selectStyle}
              >
                <option value="">All Statuses</option>
                <option value="Surplus">Surplus</option>
                <option value="Sufficient">Sufficient</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>

              {/* Clear filters */}
              {(filterCategory || filterStatus) && (
                <button
                  onClick={() => { setFilterCategory(""); setFilterStatus(""); }}
                  style={{ ...selectStyle, backgroundColor: "#f0f0f0", cursor: "pointer", border: "1px solid #ccc" }}
                >
                  Clear ✕
                </button>
              )}
              <button onClick={handleExport} style={btnExport}>
                Export CSV ↓
              </button>
            </div>
          </div>

          {/* Message */}
          {message && (
            <p style={{ color: msgType === "success" ? "green" : "red", fontWeight: "500", marginBottom: "12px" }}>
              {message}
            </p>
          )}

          {/* Legend */}
          <div style={{ display: "flex", gap: "20px", marginBottom: "14px", flexWrap: "wrap" }}>
            {[
              { label: "Surplus", color: "#5cb85c" },
              { label: "Sufficient", color: "#5bc0de" },
              { label: "Low Stock", color: "#f0ad4e" },
              { label: "Out of Stock", color: "#d9534f" },
            ].map((s) => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
                <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: s.color }} />
                {s.label}
              </div>
            ))}
          </div>

          {/* Stock Table */}
          <div style={{ backgroundColor: "white", borderRadius: "12px", border: "1.5px solid #004aad", padding: "16px" }}>
            <div style={{ textAlign: "center", fontWeight: "700", fontSize: "16px", color: "#004aad", marginBottom: "14px" }}>
              Products Table with Stock Information
            </div>

            {filteredProducts.length === 0 ? (
              <p style={{ textAlign: "center", padding: "20px", color: "#666" }}>No products found.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #e8d9b0" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f5e6c8" }}>
                    {["S.No", "Product Name", "SKU", "Category", "Current Qty", "Reorder Level", "Stock Status", "Update Stock", "Actions"].map((h) => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product, index) => {
                    const stock = stockMap[product.product_id];
                    const qty = stock?.quantity ?? null;
                    const reorder = stock?.reorder_level ?? 0;
                    const status = stock ? getStockStatus(qty, reorder) : null;

                    return (
                      <tr key={product.product_id} style={{ backgroundColor: index % 2 === 0 ? "#fffdf5" : "#fdf6e3" }}>
                        <td style={tdStyle}>{index + 1}</td>
                        <td style={tdStyle}>{product.product_name}</td>
                        <td style={tdStyle}>{product.sku}</td>
                        <td style={tdStyle}>{product.category?.category_name || "N/A"}</td>
                        <td style={{ ...tdStyle, fontWeight: "700" }}>
                          {stock === undefined ? "..." : stock === null ? "—" : qty}
                        </td>
                        <td style={tdStyle}>{stock ? reorder : "—"}</td>

                        {/* Status circle */}
                        <td style={tdStyle}>
                          {status ? (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                              <div style={{ width: "14px", height: "14px", borderRadius: "50%", backgroundColor: status.color }} />
                              <span style={{ fontSize: "12px", fontWeight: "500", color: status.color }}>
                                {status.label}
                              </span>
                            </div>
                          ) : (
                            <span style={{ color: "#999", fontSize: "12px" }}>No record</span>
                          )}
                        </td>

                        {/* +/- Update */}
                        <td style={tdStyle}>
                          {stock ? (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                              <button onClick={() => handleDecrease(product.product_id)} style={btnMinus}>−</button>
                              <input
                                type="number" min="1"
                                value={stockQty[product.product_id] || ""}
                                onChange={(e) => handleStockQtyChange(product.product_id, e.target.value)}
                                placeholder="qty"
                                style={{ width: "55px", textAlign: "center", padding: "4px", border: "1px solid #ccc", borderRadius: "4px", fontSize: "13px" }}
                              />
                              <button onClick={() => handleIncrease(product.product_id)} style={btnPlus}>+</button>
                            </div>
                          ) : (
                            <span style={{ color: "#999", fontSize: "12px" }}>No record</span>
                          )}
                        </td>

                        {/* History */}
                        <td style={tdStyle}>
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

        </div>
      </div>
    </div>
  );
}

const thStyle = {
  padding: "10px", textAlign: "center",
  fontSize: "13px", fontWeight: "600",
  color: "#004aad", borderBottom: "2px solid #e8d9b0",
  borderRight: "1px solid #e8d9b0",
};
const tdStyle = {
  padding: "10px", textAlign: "center",
  fontSize: "13px", borderBottom: "1px solid #e8d9b0",
  borderRight: "1px solid #e8d9b0", color: "#333",
};
const selectStyle = {
  padding: "8px 12px", border: "1.5px solid #004aad",
  borderRadius: "6px", fontSize: "13px",
  backgroundColor: "white", color: "#004aad",
};
const btnPlus = {
  backgroundColor: "#004aad", color: "white",
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
  borderRadius: "4px", cursor: "pointer", fontSize: "12px",
};
const btnExport = {
  backgroundColor: "#5cb85c", color: "white",
  padding: "8px 12px", border: "none",
  borderRadius: "6px", cursor: "pointer",
  fontSize: "13px", fontWeight: "500",
};

export default StockManagement;