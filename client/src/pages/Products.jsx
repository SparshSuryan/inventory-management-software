import { useEffect, useState } from "react";
import API from "../api/axios";

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

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

  // Fetch all products
  const fetchProducts = () => {
    API.get("/products")
      .then((res) => {
        setProducts(res.data.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch products");
        setLoading(false);
      });
  };

  // Fetch all categories for the dropdown
  const fetchCategories = () => {
    API.get("/categories")
      .then((res) => setCategories(res.data.data))
      .catch(() => console.error("Failed to fetch categories"));
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Open form for adding new product
  const handleAddClick = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setFormError(null);
    setFormSuccess(null);
    setShowForm(true);
  };

  // Open form for editing existing product
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

  // Submit form — handles both Add and Edit
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
        setFormSuccess(editingId ? "Product updated successfully!" : "Product added successfully!");
        setShowForm(false);
        setFormData(emptyForm);
        setEditingId(null);
        fetchProducts();
      })
      .catch((err) => {
        const msg = err.response?.data?.message || "Something went wrong";
        setFormError(msg);
      });
  };

  // Delete product
  const handleDelete = (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    API.delete(`/products/${id}`)
      .then(() => {
        setFormSuccess("Product deleted successfully!");
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

  if (loading) return <p style={{ padding: "20px" }}>Loading products...</p>;
  if (error) return <p style={{ padding: "20px", color: "red" }}>{error}</p>;

  return (
    <div style={{ padding: "20px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Products</h1>
        <button
          onClick={handleAddClick}
          style={{
            backgroundColor: "#1a3c5e",
            color: "white",
            padding: "10px 20px",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          + Add Product
        </button>
      </div>

      {/* Success / Error messages */}
      {formSuccess && (
        <p style={{ marginTop: "12px", color: "green", fontWeight: "500" }}>{formSuccess}</p>
      )}
      {formError && (
        <p style={{ marginTop: "12px", color: "red", fontWeight: "500" }}>{formError}</p>
      )}

      {/* Add / Edit Form */}
      {showForm && (
        <div style={{
          marginTop: "20px",
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          border: "1px solid #ddd",
        }}>
          <h2 style={{ marginBottom: "16px" }}>
            {editingId ? "Edit Product" : "Add New Product"}
          </h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>

              <div>
                <label style={labelStyle}>Product Name *</label>
                <input
                  name="product_name"
                  value={formData.product_name}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                  placeholder="e.g. Mechanical Keyboard"
                />
              </div>

              <div>
                <label style={labelStyle}>SKU *</label>
                <input
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                  placeholder="e.g. KB001"
                />
              </div>

              <div>
                <label style={labelStyle}>Unit Price *</label>
                <input
                  name="unit_price"
                  value={formData.unit_price}
                  onChange={handleChange}
                  required
                  type="number"
                  min="0"
                  style={inputStyle}
                  placeholder="e.g. 1200"
                />
              </div>

              <div>
                <label style={labelStyle}>Category *</label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                >
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
                <input
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="e.g. Logitech"
                />
              </div>

              <div>
                <label style={labelStyle}>Description</label>
                <input
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="e.g. Wireless mechanical keyboard"
                />
              </div>

            </div>

            {/* Form buttons */}
            <div style={{ marginTop: "16px", display: "flex", gap: "10px" }}>
              <button type="submit" style={{
                backgroundColor: "#1a3c5e",
                color: "white",
                padding: "10px 24px",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
              }}>
                {editingId ? "Update Product" : "Add Product"}
              </button>
              <button type="button" onClick={handleCancel} style={{
                backgroundColor: "#ccc",
                color: "#333",
                padding: "10px 24px",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
              }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products Table */}
      {products.length === 0 ? (
        <p style={{ marginTop: "20px" }}>No products found. Add your first product!</p>
      ) : (
        <table border="1" cellPadding="8" style={{
          marginTop: "20px",
          width: "100%",
          borderCollapse: "collapse",
          backgroundColor: "white",
        }}>
          <thead style={{ backgroundColor: "#1a3c5e", color: "white" }}>
            <tr>
              <th>ID</th>
              <th>Product Name</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Unit Price</th>
              <th>Supplier</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.product_id} style={{ textAlign: "center" }}>
                <td>{product.product_id}</td>
                <td>{product.product_name}</td>
                <td>{product.sku}</td>
                <td>{product.category?.category_name || "N/A"}</td>
                <td>Rs. {product.unit_price}</td>
                <td>{product.supplier || "N/A"}</td>
                <td>
                  <button
                    onClick={() => handleEditClick(product)}
                    style={{
                      backgroundColor: "#f0ad4e",
                      color: "white",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      marginRight: "6px",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product.product_id, product.product_name)}
                    style={{
                      backgroundColor: "#d9534f",
                      color: "white",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// Reusable styles
const labelStyle = {
  display: "block",
  marginBottom: "4px",
  fontSize: "13px",
  fontWeight: "500",
  color: "#333",
};

const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  border: "1px solid #ccc",
  borderRadius: "6px",
  fontSize: "14px",
};

export default Products;