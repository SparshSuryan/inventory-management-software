import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login"); // "login" or "register"
  const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "user" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const endpoint = mode === "login" ? "/auth/login" : "/auth/register";

    API.post(endpoint, formData)
      .then((res) => {
        setLoading(false);
        // Store token and user info
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.data));
        navigate("/dashboard");
      })
      .catch((err) => {
        setLoading(false);
        setError(err.response?.data?.message || "Something went wrong");
      });
  };

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#004aad",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
    }}>
      <div style={{
        backgroundColor: "white",
        borderRadius: "16px",
        padding: "40px",
        width: "100%",
        maxWidth: "440px",
        boxShadow: "0 8px 40px rgba(0,0,0,0.2)",
      }}>

        {/* Logo + Title */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <img
            src="/src/assets/MACE_logo.png"
            alt="ACE Logo"
            style={{ width: "150px", height: "150px", objectFit: "contain", marginBottom: "12px" }}
            onError={(e) => { e.target.style.display = "none"; }}
          />
          <h1 style={{ color: "#004aad", fontSize: "22px", fontWeight: "800", margin: 0 }}>
            MACE Maruti Suzuki Center for Excellence
          </h1>
          <p style={{ color: "#666", fontSize: "13px", marginTop: "4px" }}>
            Inventory Management Software
          </p>
        </div>

        {/* Mode Toggle */}
        <div style={{
          display: "flex",
          backgroundColor: "#f0f4f8",
          borderRadius: "8px",
          padding: "4px",
          marginBottom: "24px",
        }}>
          {["login", "register"].map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null); }}
              style={{
                flex: 1,
                padding: "8px",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
                backgroundColor: mode === m ? "#004aad" : "transparent",
                color: mode === m ? "white" : "#666",
                transition: "all 0.2s",
              }}
            >
              {m === "login" ? "Login" : "Register"}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            backgroundColor: "#fdf2f2", border: "1px solid #f5c2c2",
            borderRadius: "8px", padding: "10px 14px",
            color: "#a32d2d", fontSize: "13px", marginBottom: "16px",
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {mode === "register" && (
            <div style={{ marginBottom: "14px" }}>
              <label style={labelStyle}>Full Name *</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                style={inputStyle}
                placeholder="e.g. Sparsh Suryan"
              />
            </div>
          )}

          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Email Address *</label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={inputStyle}
              placeholder="e.g. sparsh@maruti.com"
            />
          </div>

          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Password *</label>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              style={inputStyle}
              placeholder="Enter your password"
            />
          </div>

          {mode === "register" && (
            <div style={{ marginBottom: "14px" }}>
              <label style={labelStyle}>Role *</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                style={inputStyle}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              backgroundColor: "#004aad",
              color: "white",
              padding: "12px",
              border: "none",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: "700",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              marginTop: "8px",
            }}
          >
            {loading ? "Please wait..." : mode === "login" ? "Login →" : "Create Account →"}
          </button>
        </form>

        {/* Switch mode */}
        <p style={{ textAlign: "center", fontSize: "13px", color: "#666", marginTop: "20px" }}>
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <span
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null); }}
            style={{ color: "#004aad", fontWeight: "600", cursor: "pointer" }}
          >
            {mode === "login" ? "Register here" : "Login here"}
          </span>
        </p>

      </div>
    </div>
  );
}

const labelStyle = {
  display: "block", marginBottom: "5px",
  fontSize: "13px", fontWeight: "500", color: "#333",
};
const inputStyle = {
  width: "100%", padding: "10px 12px",
  border: "1.5px solid #ddd", borderRadius: "8px",
  fontSize: "14px", outline: "none",
  boxSizing: "border-box",
};

export default Login;