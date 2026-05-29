const express = require("express");

const app = express();

const PORT = 3000;

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

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});