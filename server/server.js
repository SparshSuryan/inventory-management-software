const express = require("express");

const app = express();

app.use(express.json());

const PORT = 3000;

const prisma = require("./src/config/prisma");

const productRoutes = require("./src/routes/productRoutes");

const categoryRoutes = require("./src/routes/categoryRoutes");

// Root Route
app.get("/", (req, res) => {
    res.send("Inventory Management Software Backend Running");
});

// Products API
app.use("/api/products", productRoutes);

// Categories API
app.use("/api/categories", categoryRoutes);

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
