import { Routes, Route } from "react-router-dom";
import Products from "./pages/Products";
import StockManagement from "./pages/stockManagement";
import StockMovements from "./pages/stockMovements";
import Receipts from "./pages/Receipts";
import InventoryTransfers from "./pages/InventoryTransfers";
import IssuesManagement from "./pages/IssuesManagement";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Products />} />
      <Route path="/products" element={<Products />} />
      <Route path="/stock" element={<StockManagement />} />
      <Route path="/stock/:productId/movements" element={<StockMovements />} />
      <Route path="/receipt/receipts" element={<Receipts />} />
      <Route path="/receipt/transfers" element={<InventoryTransfers />} />
      <Route path="/inventory/issues" element={<IssuesManagement />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/" element={<Dashboard />} />
    </Routes>
  );
}

export default App;