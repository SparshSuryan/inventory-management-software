const express = require("express");

const app = express();

const PORT = 3000;

const prisma = require("./src/config/prisma");

// Root Route
app.get("/", (req, res) => {
    res.send("Inventory Management Software Backend Running");
});

// Products API
app.get("/api/products", (req, res) => {
    res.json([
        {
            id: 1,
            name: "Keyboard",
            category: "Electronics",
            quantity: 10,
            price: 1200
        },
        {
            id: 2,
            name: "Mouse",
            category: "Electronics",
            quantity: 15,
            price: 600
        }
    ]);
});

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
