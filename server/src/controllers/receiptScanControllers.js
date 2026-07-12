const { GoogleGenAI } = require("@google/genai");
const prisma = require("../config/prisma");

// POST /api/receipts/scan
const scanReceipt = async (req, res) => {
  try {
    // Check if image file is uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    // Initialize Gemini AI
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: "Gemini API key not configured",
      });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
    });

    // Convert image buffer to Base64
    const base64Image = req.file.buffer.toString("base64");
    const mimeType = req.file.mimetype;

    console.log(
      `📷 Scanning receipt image: ${req.file.originalname} (${req.file.size} bytes)`
    );

    const startTime = Date.now();

    // Send image to Gemini Vision
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Image,
              },
            },
            {
              text: `
You are an OCR-based receipt parser for an Inventory Management System.

Carefully read every visible word from the uploaded receipt.

Do not guess or infer values. If a value is not clearly visible, return null.

Extract ONLY information that is clearly visible on the receipt.

Return ONLY a valid JSON object with the following structure:

{
  "supplier": null,
  "product_name": null,
  "sku": null,
  "quantity": null,
  "unit_cost": null,
  "total_cost": null,
  "received_date": null,
  "remarks": null
}

Rules:
- supplier: Vendor or supplier name.
- product_name: Product or item name.
- sku: Product code, SKU, Part Number or Item Code.
- quantity: Numeric quantity only.
- unit_cost: Numeric cost per unit only.
- total_cost: Final total amount only.
- received_date: Convert to YYYY-MM-DD.
- remarks: Invoice number, bill number or any reference number.
- If any field is not visible, return null.
- Return ONLY the JSON object.
`,
            },
          ],
        },
      ],
    });

    console.log(
      `⏱ Receipt scanned in ${Date.now() - startTime} ms`
    );

    const rawText = response.text;

    console.log("\n========== GEMINI RESPONSE ==========");
    console.log(rawText);
    console.log("=====================================\n");

    let extractedData;

    try {
      extractedData =
        typeof rawText === "string" ? JSON.parse(rawText) : rawText;
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", rawText);

      return res.status(422).json({
        success: false,
        message: "Could not extract data from image. Please try a clearer photo.",
      });
    }

    // Clean extracted data
    Object.keys(extractedData).forEach((key) => {
      if (typeof extractedData[key] === "string") {
        extractedData[key] = extractedData[key].trim();
      }
    });

    // Convert numeric fields
    if (extractedData.quantity !== null)
      extractedData.quantity = Number(extractedData.quantity);

    if (extractedData.unit_cost !== null)
      extractedData.unit_cost = Number(extractedData.unit_cost);

    if (extractedData.total_cost !== null)
      extractedData.total_cost = Number(extractedData.total_cost);

    // If SKU is found, check if product exists in our system
    let matchedProduct = null;

    if (extractedData.sku) {
      matchedProduct = await prisma.product.findUnique({
        where: {
          sku: String(extractedData.sku),
        },
        include: {
          category: true,
        },
      });
    }

    // If no SKU match, try matching by product name
    if (!matchedProduct && extractedData.product_name) {
      matchedProduct = await prisma.product.findFirst({
        where: {
          product_name: {
            contains: extractedData.product_name,
            mode: "insensitive",
          },
        },
        include: {
          category: true,
        },
      });
    }

    console.log(`
========================================
✅ Receipt Scanned Successfully
Supplier : ${extractedData.supplier}
SKU      : ${extractedData.sku}
Matched  : ${matchedProduct ? "Yes" : "No"}
========================================
`);

    res.status(200).json({
      success: true,
      message: "Receipt scanned successfully",
      data: {
        extracted: extractedData,
        matched_product: matchedProduct
          ? {
              product_id: matchedProduct.product_id,
              product_name: matchedProduct.product_name,
              sku: matchedProduct.sku,
              category: matchedProduct.category?.category_name,
              unit_price: matchedProduct.unit_price,
            }
          : null,
        product_found: !!matchedProduct,
      },
    });
  } catch (error) {
    console.error(
      "Receipt Scan Error:",
      error.response?.data || error.message || error
    );

    if (error.status === 401) {
      return res.status(401).json({
        success: false,
        message: "Invalid Gemini API key.",
      });
    }

    if (error.status === 429) {
      return res.status(429).json({
        success: false,
        message: "Gemini API quota exceeded. Please try again later.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to scan receipt",
    });
  }
};

module.exports = { scanReceipt };