# Saree Shop Inventory Management
Full-stack demo using Node.js, Express, MongoDB, and vanilla JS.

Features:
- Add / edit / delete sarees with brand, cost price, selling price, GST.
- Search by brand name.
- Compute profit and GST on the client.
- Generate bill as PDF (server-side using PDFKit).

Setup:
1. Install Node.js.
2. Set environment variable `MONGODB_URI` if you want a custom MongoDB connection (default: mongodb://127.0.0.1:27017/saree_inventory).
3. Run:
   ```
   npm install
   npm start
   ```
4. Open http://localhost:3000

Note: This is a starter project for local/testing use. For production, secure endpoints, add authentication, validation, and proper error handling.
