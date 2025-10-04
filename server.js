const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const PDFDocument = require("pdfkit");
const Saree = require("./models/Saree");
require('dotenv').config();


const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/saree_inventory";

mongoose
  .connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connect error:", err));

// API routes
app.post("/api/sarees", async (req, res) => {
  try {
    const s = new Saree(req.body);
    await s.save();
    res.json(s);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get("/api/sarees", async (req, res) => {
  try {
    const search = req.query.search || "";
    const filter = search ? { brand: { $regex: search, $options: "i" } } : {};
    const list = await Saree.find(filter).sort({ createdAt: -1 });
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/sarees/:id", async (req, res) => {
  try {
    const s = await Saree.findById(req.params.id);
    if (!s) return res.status(404).json({ error: "Not found" });
    res.json(s);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/sarees/:id", async (req, res) => {
  try {
    const s = await Saree.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(s);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.delete("/api/sarees/:id", async (req, res) => {
  try {
    await Saree.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Generate bill PDF: expects { sareeId, quantity }
app.post("/api/generate-pdf", async (req, res) => {
  try {
    const { sareeId, quantity = 1, customerName = "Customer" } = req.body;
    const saree = await Saree.findById(sareeId);
    if (!saree) return res.status(404).json({ error: "Saree not found" });

    const qty = Number(quantity) || 1;
    const price = Number(saree.sellingPrice);
    const gstPercent = Number(saree.gstPercent) || 0;

    const subtotal = price * qty;
    const gstAmount = +((subtotal * gstPercent) / 100).toFixed(2);
    const total = +(subtotal + gstAmount).toFixed(2);
    const profit = +((price - Number(saree.costPrice)) * qty).toFixed(2);

    const doc = new PDFDocument({ margin: 40 });
    res.setHeader("Content-disposition", "attachment; filename=invoice.pdf");
    res.setHeader("Content-type", "application/pdf");
    doc.pipe(res);

    // doc.fontSize(20).text('Saree Shop Invoice', { align: 'center' });
    // doc.moveDown();
    // doc.fontSize(12).text(`Customer: ${customerName}`);
    // doc.text(`Date: ${new Date().toLocaleString()}`);
    // doc.moveDown();

    // doc.text(`Brand: ${saree.brand}`);
    // doc.text(`Saree ID: ${saree._id}`);
    // doc.text(`Quantity: ${qty}`);
    // doc.moveDown();

    // doc.text(`Selling price (per): ₹${price.toFixed(2)}`);
    // doc.text(`Subtotal: ₹${subtotal.toFixed(2)}`);
    // doc.text(`GST (${gstPercent}%): ₹${gstAmount.toFixed(2)}`);
    // doc.moveDown();
    // doc.fontSize(14).text(`Total: ₹${total.toFixed(2)}`, { underline: true });
    // doc.moveDown();
    // doc.fontSize(12).text(`Profit on this sale: ₹${profit.toFixed(2)}`);

    // ===== INVOICE HEADER =====
    doc
      .fontSize(20)
      .fillColor("#2E86C1")
      .text("Santosh Saree Shop", { align: "center", underline: false });
    doc.moveDown(1.5);

    doc.moveTo(40, doc.y).lineTo(550, doc.y).stroke(); // line separator
    doc.moveDown();

    // ===== CUSTOMER INFO =====
    doc
      .fontSize(12)
      .fillColor("black")
      .text(`Customer Name :-  ${customerName}`, { continued: true })
      .text(`    Date: ${new Date().toLocaleString()}`, { align: "right" });
    doc.moveDown();

    doc.moveTo(40, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1);

    // ===== PRODUCT DETAILS =====
    doc.fontSize(12).text(`Brand :-  ${saree.brand}`);
    doc.text(`Saree ID :-  ${saree._id}`);
    doc.text(`Quantity :-  ${qty}`);
    doc.moveDown();

    doc.moveTo(40, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    // ===== PRICING SECTION (table style) =====
    doc
      .font("Helvetica-Bold")
      .text("Description", 50, doc.y, { continued: true })
      .text("Amount (₹)", 400);
    doc.moveTo(40, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    doc
      .font("Helvetica")
      .text(`Selling price (per)`, 50, doc.y, { continued: true })
      .text(price.toFixed(2), 400);
    doc
      .text(`Subtotal`, 50, doc.y + 20, { continued: true })
      .text(subtotal.toFixed(2), 400);
    doc
      .text(`GST (${gstPercent}%)`, 50, doc.y + 40, { continued: true })
      .text(gstAmount.toFixed(2), 400);
    doc.moveDown(4);

    // ===== TOTAL =====
    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .text(`Total`, 50, doc.y, { continued: true })
      .text(`₹${total.toFixed(2)}`, 400, doc.y, { underline: true });
    doc.moveDown(2);

    doc.moveTo(40, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(2);

    // ===== FOOTER =====
    doc
      .fontSize(12)
      .fillColor("#2E86C1")
      .text("Thank you for shopping with us!", { align: "center" });
    doc
      .fontSize(10)
      .fillColor("black")
      // .text("This is a computer-generated invoice.", { align: "center" });

    doc.end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Serve SPA
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));
