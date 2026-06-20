import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import StockManagement from "./pages/StockManagement";
import StockMovements from "./pages/StockMovements";
import Receipts from "./pages/Receipts";
import InventoryTransfers from "./pages/InventoryTransfers";
import IssuesManagement from "./pages/IssuesManagement";
import InventoryStatus from "./pages/InventoryStatus";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      {/* Public route */}
      <Route path="/login" element={<Login />} />

      {/* Protected routes */}
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
      <Route path="/stock" element={<ProtectedRoute><StockManagement /></ProtectedRoute>} />
      <Route path="/stock/:productId/movements" element={<ProtectedRoute><StockMovements /></ProtectedRoute>} />
      <Route path="/receipt/receipts" element={<ProtectedRoute><Receipts /></ProtectedRoute>} />
      <Route path="/receipt/transfers" element={<ProtectedRoute><InventoryTransfers /></ProtectedRoute>} />
      <Route path="/inventory/issues" element={<ProtectedRoute><IssuesManagement /></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute><InventoryStatus /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;