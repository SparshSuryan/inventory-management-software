import { Routes, Route } from "react-router-dom";
import Products from "./pages/Products";
import StockManagement from "./pages/stockManagement";
import StockMovements from "./pages/stockMovements";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Products />} />
      <Route path="/products" element={<Products />} />
      <Route path="/stock" element={<StockManagement />} />
      <Route path="/stock/:productId/movements" element={<StockMovements />} />
    </Routes>
  );
}

export default App;