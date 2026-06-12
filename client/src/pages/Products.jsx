import { useEffect, useState } from "react";
import API from "../api/axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import BulkUploadModal from "../components/BulkUploadModal";

const emptyForm = {
  product_name: "",
  sku: "",
  description: "",
  unit_price: "",
  supplier: "",
  category_id: "",
};

function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0,
  });
  const [stockList, setStockList] = useState([]);

  const fetchProducts = () => {
    API.get("/products")
      .then((res) => {
        const prods = res.data.data;
        setProducts(prods);
        setLoading(false);
  
        // Fetch stock for every product
        const stockPromises = prods.map((p) =>
          API.get(`/stock/${p.product_id}`)
            .then((r) => r.data.data)
            .catch(() => null)
        );
  
        Promise.all(stockPromises).then((stockResults) => {
          const validStock = stockResults.filter(Boolean);
          setStockList(validStock);
  
          // Calculate KPIs
          const lowStock = validStock.filter(
            (s) => s.quantity > 0 && s.quantity <= s.reorder_level
          ).length;
  
          const outOfStock = validStock.filter(
            (s) => s.quantity === 0
          ).length;
  
          const totalValue = prods.reduce((sum, p) => {
            const stock = validStock.find(
              (s) => s.product_id === p.product_id
            );
            const qty = stock?.quantity || 0;
            return sum + p.unit_price * qty;
          }, 0);
  
          setStats({
            total: prods.length,
            lowStock,
            outOfStock,
            totalValue,
          });
        });
      })
      .catch(() => {
        setError("Failed to fetch products");
        setLoading(false);
      });
  };

  const fetchCategories = () => {
    API.get("/categories")
      .then((res) => setCategories(res.data.data))
      .catch(() => console.error("Failed to fetch categories"));
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddClick = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setFormError(null);
    setFormSuccess(null);
    setShowForm(true);
  };

  const handleEditClick = (product) => {
    setFormData({
      product_name: product.product_name,
      sku: product.sku,
      description: product.description || "",
      unit_price: product.unit_price,
      supplier: product.supplier || "",
      category_id: product.category_id,
    });
    setEditingId(product.product_id);
    setFormError(null);
    setFormSuccess(null);
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const payload = {
      ...formData,
      unit_price: parseFloat(formData.unit_price),
      category_id: parseInt(formData.category_id),
    };

    const request = editingId
      ? API.put(`/products/${editingId}`, payload)
      : API.post("/products", payload);

    request
      .then(() => {
        setFormSuccess(editingId ? "Product updated!" : "Product added!");
        setShowForm(false);
        setFormData(emptyForm);
        setEditingId(null);
        fetchProducts();
      })
      .catch((err) => {
        setFormError(err.response?.data?.message || "Something went wrong");
      });
  };

  const handleDelete = (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    API.delete(`/products/${id}`)
      .then(() => {
        setFormSuccess("Product deleted!");
        fetchProducts();
      })
      .catch(() => setFormError("Failed to delete product"));
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormData(emptyForm);
    setEditingId(null);
    setFormError(null);
  };

  const filteredProducts = products.filter((p) =>
    p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#fcf6db" }}>

      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>

        {/* Navbar */}
        <Navbar title="Product Management" onSearch={(val) => setSearchTerm(val)}/>

        {/* Page content */}
        <div style={{ padding: "24px", flex: 1, backgroundColor: "#fcf6db" }}>

          {/* KPI Cards Row */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr auto",
            gap: "12px",
            marginBottom: "20px",
            alignItems: "stretch",
          }}>

            {/* Total Products */}
            <div style={kpiCard}>
              <div style={kpiLabel}>Total Products</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "8px" }}>
                <span style={{ fontSize: "26px" }}>📦</span>
                <span style={kpiValue}>{stats.total}</span>
              </div>
            </div>

            {/* Low Stock */}
            <div style={kpiCard}>
              <div style={kpiLabel}>Low Stock Items</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "8px" }}>
                <span style={{ fontSize: "26px" }}>⚠️</span>
                <span style={{ ...kpiValue, color: "#BA7517" }}>{stats.lowStock}</span>
              </div>
            </div>

            {/* Out of Stock */}
            <div style={kpiCard}>
              <div style={kpiLabel}>Out of Stock</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "8px" }}>
                <span style={{ fontSize: "26px" }}>❌</span>
                <span style={{ ...kpiValue, color: "#d9534f" }}>{stats.outOfStock}</span>
              </div>
            </div>

            {/* Total Value */}
            <div style={kpiCard}>
              <div style={kpiLabel}>Total Inventory Value</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginTop: "8px" }}>
                <span style={kpiValue}>
                  ₹{stats.totalValue.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Buttons */}
            <div style={{
              display: "flex", flexDirection: "column",
              gap: "8px", justifyContent: "center",
              padding: "12px",
              backgroundColor: "white",
              border: "1.5px solid #1a3c5e",
              borderRadius: "10px",
              minWidth: "180px",
            }}>
              <div style={{ display: "flex", gap: "8px" }}>
                <button style={btnFilter}>▼ Filter</button>
                <button style={btnFilter}>↕ Sort</button>
              </div>
              <button onClick={handleAddClick} style={btnAdd}>
                Add Product +
              </button>
              <button style={btnUpload} onClick={() => setShowBulkModal(true)}>
                Upload Bulk +
              </button>
            </div>
          </div>

          {/* Messages */}
          {formSuccess && (
            <p style={{ color: "green", fontWeight: "500", marginBottom: "12px" }}>{formSuccess}</p>
          )}
          {formError && (
            <p style={{ color: "red", fontWeight: "500", marginBottom: "12px" }}>{formError}</p>
          )}

          {/* Add / Edit Form */}
          {showForm && (
            <div style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "10px",
              border: "1px solid #ddd",
              marginBottom: "20px",
            }}>
              <h3 style={{ marginBottom: "16px", color: "#1a3c5e" }}>
                {editingId ? "Edit Product" : "Add New Product"}
              </h3>
              <form onSubmit={handleSubmit}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={labelStyle}>Product Name *</label>
                    <input name="product_name" value={formData.product_name}
                      onChange={handleChange} required style={inputStyle}
                      placeholder="e.g. Mechanical Keyboard" />
                  </div>
                  <div>
                    <label style={labelStyle}>SKU *</label>
                    <input name="sku" value={formData.sku}
                      onChange={handleChange} required style={inputStyle}
                      placeholder="e.g. KB001" />
                  </div>
                  <div>
                    <label style={labelStyle}>Unit Price *</label>
                    <input name="unit_price" value={formData.unit_price}
                      onChange={handleChange} required type="number"
                      min="0" style={inputStyle} placeholder="e.g. 1200" />
                  </div>
                  <div>
                    <label style={labelStyle}>Category *</label>
                    <select name="category_id" value={formData.category_id}
                      onChange={handleChange} required style={inputStyle}>
                      <option value="">Select a category</option>
                      {categories.map((cat) => (
                        <option key={cat.category_id} value={cat.category_id}>
                          {cat.category_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Supplier</label>
                    <input name="supplier" value={formData.supplier}
                      onChange={handleChange} style={inputStyle}
                      placeholder="e.g. Logitech" />
                  </div>
                  <div>
                    <label style={labelStyle}>Description</label>
                    <input name="description" value={formData.description}
                      onChange={handleChange} style={inputStyle}
                      placeholder="e.g. Wireless mechanical keyboard" />
                  </div>
                </div>
                <div style={{ marginTop: "16px", display: "flex", gap: "10px" }}>
                  <button type="submit" style={btnAdd}>
                    {editingId ? "Update Product" : "Add Product"}
                  </button>
                  <button type="button" onClick={handleCancel} style={{
                    backgroundColor: "#ccc", color: "#333",
                    padding: "10px 24px", border: "none",
                    borderRadius: "6px", cursor: "pointer", fontSize: "14px",
                  }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Products Table */}
          <div style={{
            backgroundColor: "white",
            borderRadius: "12px",
            border: "1.5px solid #004aad",
            padding: "16px",
          }}>
            <div style={{
              textAlign: "center",
              fontWeight: "700",
              fontSize: "16px",
              color: "#004aad",
              marginBottom: "16px",
            }}>
              Products Table
            </div>

            {loading ? (
              <p style={{ padding: "20px" }}>Loading products...</p>
            ) : error ? (
              <p style={{ padding: "20px", color: "red" }}>{error}</p>
            ) : filteredProducts.length === 0 ? (
              <p style={{ padding: "20px", textAlign: "center" }}>{searchTerm ? `No products found for "${searchTerm}"` : "No products found. Add your first product!"}</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #e8d9b0", borderRadius: "8px", overflow: "hidden" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f5e6c8" }}>
                    {["S. No.", "Product Id", "Product Name", "SKU", "Category Name", "Supplier", "Unit Price", "Description", "Actions"].map((h) => (
                      <th key={h} style={{
                        padding: "12px 10px",
                        textAlign: "center",
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#004aad",
                        borderBottom: "2px solid #e8d9b0",
                        borderRight: "1px solid #e8d9b0",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product, index) => (
                    <tr key={product.product_id} style={{
                      backgroundColor: index % 2 === 0 ? "#fffdf5" : "#fdf6e3",
                    }}>
                      <td style={tdStyle}>{index + 1}.</td>
                      <td style={tdStyle}>{product.product_id}</td>
                      <td style={tdStyle}>{product.product_name}</td>
                      <td style={tdStyle}>{product.sku}</td>
                      <td style={tdStyle}>{product.category?.category_name || "N/A"}</td>
                      <td style={tdStyle}>{product.supplier || "—"}</td>
                      <td style={tdStyle}>Rs. {product.unit_price}</td>
                      <td style={tdStyle}>{product.description || "—"}</td>
                      <td style={tdStyle}>
                        <button
                          onClick={() => handleEditClick(product)}
                          style={btnEditRow}
                        >Edit</button>
                        <button
                          onClick={() => handleDelete(product.product_id, product.product_name)}
                          style={btnDeleteRow}
                        >Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {showBulkModal && (
  <BulkUploadModal
    onClose={() => setShowBulkModal(false)}
    onSuccess={(msg) => {
      setFormSuccess(msg);
      setShowBulkModal(false);
      fetchProducts();
    }}
    categories={categories}
  />
)}

        </div>
      </div>
    </div>
  );
}

// Styles
const kpiCard = {
  backgroundColor: "white",
  border: "1.5px solid #004aad",
  borderRadius: "10px",
  padding: "16px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
};
const kpiLabel = {
  fontSize: "15px",
  fontWeight: "600",
  color: "#333",
};
const kpiValue = {
  fontSize: "32px",
  fontWeight: "700",
  color: "#004aad",
};
const labelStyle = {
  display: "block", marginBottom: "4px",
  fontSize: "13px", fontWeight: "500", color: "#333",
};
const inputStyle = {
  width: "100%", padding: "8px 10px",
  border: "1px solid #ccc", borderRadius: "6px", fontSize: "14px",
};
const tdStyle = {
  padding: "10px", textAlign: "center",
  fontSize: "13px", borderBottom: "1px solid #e8d9b0",
  borderRight: "1px solid #e8d9b0", color: "#333",
};
const btnAdd = {
  backgroundColor: "#d9534f", color: "white",
  padding: "8px 16px", border: "none",
  borderRadius: "6px", cursor: "pointer",
  fontSize: "13px", fontWeight: "500",
};
const btnUpload = {
  backgroundColor: "#d9534f", color: "white",
  padding: "8px 16px", border: "none",
  borderRadius: "6px", cursor: "pointer",
  fontSize: "13px", fontWeight: "500",
};
const btnFilter = {
  backgroundColor: "white", color: "#1a3c5e",
  padding: "6px 12px", border: "1px solid #1a3c5e",
  borderRadius: "6px", cursor: "pointer",
  fontSize: "12px", fontWeight: "500",
};
const btnEditRow = {
  backgroundColor: "#d9534f", color: "white",
  border: "none", padding: "5px 12px",
  borderRadius: "4px", cursor: "pointer",
  fontSize: "12px", marginRight: "4px",
};
const btnDeleteRow = {
  backgroundColor: "#d9534f", color: "white",
  border: "none", padding: "5px 12px",
  borderRadius: "4px", cursor: "pointer",
  fontSize: "12px",
};

export default Products;