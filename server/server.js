require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
}));

app.use(express.json());

const PORT = 3000;

const prisma = require("./src/config/prisma");

const productRoutes = require("./src/routes/productRoutes");

const categoryRoutes = require("./src/routes/categoryRoutes");

const stockRoutes = require("./src/routes/stockRoutes");

const receiptRoutes = require("./src/routes/receiptRoutes");

const transferRoutes = require("./src/routes/transferRoutes");

const issueRoutes = require("./src/routes/issueRoutes");

const dashboardRoutes = require("./src/routes/dashboardRoutes");

const inventoryStatusRoutes = require("./src/routes/inventoryStatusRoutes");

const authRoutes = require("./src/routes/authRoutes");

const salesRoutes = require("./src/routes/salesRoutes");

const auditRoutes = require("./src/routes/auditRoutes");

const receiptScanRoutes = require("./src/routes/receiptScanRoutes");

// Root Route
app.get("/", (req, res) => {
    res.send("Inventory Management Software Backend Running");
});

// Products API
app.use("/api/products", productRoutes);

// Categories API
app.use("/api/categories", categoryRoutes);

//Stocks API
app.use("/api/stock", stockRoutes);

// AI Receipt Scanner API
app.use("/api/receipts", receiptScanRoutes);

//Receipts API
app.use("/api/receipts", receiptRoutes);

//Inventory Transfer API
app.use("/api/transfers", transferRoutes);

//Issues API
app.use("/api/inventory/issues", issueRoutes);

//Dashboard API
app.use("/api/dashboard", dashboardRoutes);

//Inventory Status API
app.use("/api/inventory-status", inventoryStatusRoutes);

//Authentication
app.use("/api/auth", authRoutes);

//Sales History API
app.use("/api/sales", salesRoutes);

//Audit Log API
app.use("/api/audit", auditRoutes);

app.get("/api/test-db", async (req, res) => {
    try {
      const categories = await prisma.category.findMany();
  
      res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      console.error(error);
  
      res.status(500).json({
        success: false,
        message: "Database connection failed",
      });
    }
  });

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Internal server error" });
});
