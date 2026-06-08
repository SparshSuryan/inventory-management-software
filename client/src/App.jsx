import { Routes, Route } from "react-router-dom";
import Products from "./pages/Products";

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Products />} />
        <Route path="/products" element={<Products />} />
      </Routes>
    </div>
  );
}

export default App;