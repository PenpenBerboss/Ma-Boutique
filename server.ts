import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("boutique.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'employee'
  );

  CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact TEXT,
    email TEXT
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category_id INTEGER,
    purchase_price REAL,
    selling_price REAL,
    stock_quantity INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 5,
    supplier_id INTEGER,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    total_amount REAL,
    sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
  );

  CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    unit_price REAL,
    FOREIGN KEY (sale_id) REFERENCES sales(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT,
    amount REAL,
    category TEXT,
    expense_date DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed initial data if empty
const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run("admin", "admin", "owner");
  
  // Categories
  const categories = ["Alimentation", "Boissons", "Hygiène", "Électronique", "Divers"];
  const categoryIds = categories.map(name => {
    const info = db.prepare("INSERT INTO categories (name) VALUES (?)").run(name);
    return info.lastInsertRowid;
  });

  // Suppliers
  const suppliers = [
    { name: "Grossiste Alpha", contact: "01020304", email: "contact@alpha.com" },
    { name: "Sodibo", contact: "05060708", email: "sales@sodibo.bf" },
    { name: "Import-Export Sahel", contact: "09101112", email: "info@sahel.com" }
  ];
  const supplierIds = suppliers.map(s => {
    const info = db.prepare("INSERT INTO suppliers (name, contact, email) VALUES (?, ?, ?)").run(s.name, s.contact, s.email);
    return info.lastInsertRowid;
  });

  // Products
  const products = [
    { name: "Riz 25kg", catIdx: 0, buy: 15000, sell: 18500, stock: 20, min: 5, supIdx: 0 },
    { name: "Huile 5L", catIdx: 0, buy: 4500, sell: 5500, stock: 15, min: 3, supIdx: 0 },
    { name: "Sucre 1kg", catIdx: 0, buy: 600, sell: 750, stock: 50, min: 10, supIdx: 2 },
    { name: "Coca-Cola 33cl", catIdx: 1, buy: 350, sell: 500, stock: 100, min: 24, supIdx: 1 },
    { name: "Eau Minérale 1.5L", catIdx: 1, buy: 200, sell: 400, stock: 48, min: 12, supIdx: 1 },
    { name: "Savon Marseille", catIdx: 2, buy: 150, sell: 250, stock: 60, min: 10, supIdx: 2 },
    { name: "Piles AA (x4)", catIdx: 3, buy: 1200, sell: 2000, stock: 10, min: 2, supIdx: 2 },
    { name: "Lait en poudre 400g", catIdx: 0, buy: 2200, sell: 2800, stock: 12, min: 4, supIdx: 0 },
    { name: "Pâtes Alimentaires", catIdx: 0, buy: 300, sell: 450, stock: 80, min: 20, supIdx: 0 },
    { name: "Café 100g", catIdx: 0, buy: 1800, sell: 2400, stock: 8, min: 5, supIdx: 2 }
  ];
  const productIds = products.map(p => {
    const info = db.prepare(`
      INSERT INTO products (name, category_id, purchase_price, selling_price, stock_quantity, min_stock_level, supplier_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(p.name, categoryIds[p.catIdx], p.buy, p.sell, p.stock, p.min, supplierIds[p.supIdx]);
    return { id: info.lastInsertRowid, ...p };
  });

  // Customers
  const customers = [
    { name: "Moussa Traoré", phone: "70123456", email: "moussa@gmail.com" },
    { name: "Fatou Ouédraogo", phone: "76987654", email: "fatou@yahoo.fr" },
    { name: "Jean-Baptiste", phone: "65432109", email: "jb@outlook.com" },
    { name: "Awa Koné", phone: "78112233", email: "awa@gmail.com" }
  ];
  const customerIds = customers.map(c => {
    const info = db.prepare("INSERT INTO customers (name, phone, email) VALUES (?, ?, ?)").run(c.name, c.phone, c.email);
    return info.lastInsertRowid;
  });

  // Historical Sales (Simulate last 4 months)
  const now = new Date();
  for (let i = 0; i < 120; i++) { // 120 random sales
    const saleDate = new Date(now);
    saleDate.setDate(now.getDate() - Math.floor(Math.random() * 120)); // spread over 120 days
    
    const customerId = customerIds[Math.floor(Math.random() * customerIds.length)];
    const numItems = Math.floor(Math.random() * 3) + 1;
    let totalAmount = 0;
    
    const saleInfo = db.prepare("INSERT INTO sales (customer_id, total_amount, sale_date) VALUES (?, ?, ?)").run(
      customerId, 0, saleDate.toISOString()
    );
    const saleId = saleInfo.lastInsertRowid;

    for (let j = 0; j < numItems; j++) {
      const product = productIds[Math.floor(Math.random() * productIds.length)];
      const qty = Math.floor(Math.random() * 2) + 1;
      const price = product.sell;
      totalAmount += qty * price;
      
      db.prepare("INSERT INTO sale_items (sale_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)").run(
        saleId, product.id, qty, price
      );
    }
    db.prepare("UPDATE sales SET total_amount = ? WHERE id = ?").run(totalAmount, saleId);
  }

  // Expenses
  const expenseCats = ["Loyer", "Électricité", "Transport", "Salaires", "Divers"];
  for (let i = 0; i < 12; i++) {
    const expDate = new Date(now);
    expDate.setMonth(now.getMonth() - Math.floor(Math.random() * 4));
    db.prepare("INSERT INTO expenses (description, amount, category, expense_date) VALUES (?, ?, ?, ?)").run(
      "Dépense mensuelle",
      Math.floor(Math.random() * 50000) + 10000,
      expenseCats[Math.floor(Math.random() * expenseCats.length)],
      expDate.toISOString()
    );
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  
  // Products
  app.get("/api/products", (req, res) => {
    const products = db.prepare(`
      SELECT p.*, c.name as category_name, s.name as supplier_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      LEFT JOIN suppliers s ON p.supplier_id = s.id
    `).all();
    res.json(products);
  });

  app.post("/api/products", (req, res) => {
    const { name, category_id, purchase_price, selling_price, stock_quantity, min_stock_level, supplier_id } = req.body;
    const info = db.prepare(`
      INSERT INTO products (name, category_id, purchase_price, selling_price, stock_quantity, min_stock_level, supplier_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, category_id, purchase_price, selling_price, stock_quantity, min_stock_level, supplier_id);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/products/:id", (req, res) => {
    const { name, category_id, purchase_price, selling_price, stock_quantity, min_stock_level, supplier_id } = req.body;
    db.prepare(`
      UPDATE products 
      SET name = ?, category_id = ?, purchase_price = ?, selling_price = ?, stock_quantity = ?, min_stock_level = ?, supplier_id = ?
      WHERE id = ?
    `).run(name, category_id, purchase_price, selling_price, stock_quantity, min_stock_level, supplier_id, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/products/:id", (req, res) => {
    db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Categories
  app.get("/api/categories", (req, res) => {
    res.json(db.prepare("SELECT * FROM categories").all());
  });

  // Suppliers
  app.get("/api/suppliers", (req, res) => {
    res.json(db.prepare("SELECT * FROM suppliers").all());
  });

  // Customers
  app.get("/api/customers", (req, res) => {
    const customers = db.prepare(`
      SELECT c.*, 
      (SELECT SUM(total_amount) FROM sales WHERE customer_id = c.id) as total_spent,
      (SELECT COUNT(*) FROM sales WHERE customer_id = c.id) as total_orders
      FROM customers c
    `).all();
    res.json(customers);
  });

  app.get("/api/customers/:id/history", (req, res) => {
    const { id } = req.params;
    const history = db.prepare(`
      SELECT s.*, 
        (SELECT GROUP_CONCAT(p.name || ' (x' || si.quantity || ')') 
         FROM sale_items si 
         JOIN products p ON si.product_id = p.id 
         WHERE si.sale_id = s.id) as items_summary
      FROM sales s
      WHERE s.customer_id = ?
      ORDER BY s.sale_date DESC
    `).all(id);
    res.json(history);
  });

  app.post("/api/customers", (req, res) => {
    const { name, phone, email } = req.body;
    const info = db.prepare("INSERT INTO customers (name, phone, email) VALUES (?, ?, ?)").run(name, phone, email);
    res.json({ id: info.lastInsertRowid });
  });

  // Caisse / Daily Summary
  app.get("/api/caisse/daily", (req, res) => {
    const summary = db.prepare(`
      SELECT 
        COUNT(id) as count,
        SUM(total_amount) as total
      FROM sales 
      WHERE date(sale_date) = date('now', 'localtime')
    `).get();
    
    const recentSales = db.prepare(`
      SELECT s.*, c.name as customer_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE date(sale_date) = date('now', 'localtime')
      ORDER BY sale_date DESC
      LIMIT 10
    `).all();

    res.json({
      summary: summary || { count: 0, total: 0 },
      recentSales
    });
  });

  // Sales
  app.get("/api/sales", (req, res) => {
    const sales = db.prepare(`
      SELECT s.*, c.name as customer_name 
      FROM sales s 
      LEFT JOIN customers c ON s.customer_id = c.id
      ORDER BY sale_date DESC
    `).all();
    res.json(sales);
  });

  app.post("/api/sales", (req, res) => {
    const { customer_id, items, total_amount } = req.body;
    
    const transaction = db.transaction(() => {
      const saleInfo = db.prepare("INSERT INTO sales (customer_id, total_amount) VALUES (?, ?)").run(customer_id, total_amount);
      const saleId = saleInfo.lastInsertRowid;

      for (const item of items) {
        db.prepare("INSERT INTO sale_items (sale_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)").run(
          saleId, item.product_id, item.quantity, item.unit_price
        );
        db.prepare("UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?").run(item.quantity, item.product_id);
      }
      return saleId;
    });

    try {
      const saleId = transaction();
      res.json({ id: saleId });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Utility: Reset Database
  app.post("/api/utils/reset", async (req, res) => {
    db.close();
    const fs = await import("fs");
    if (fs.existsSync("boutique.db")) {
      fs.unlinkSync("boutique.db");
    }
    process.exit(0); // Server will restart and re-seed
  });

  // Utility: Simulate a random sale
  app.post("/api/utils/simulate-sale", (req, res) => {
    const products = db.prepare("SELECT * FROM products WHERE stock_quantity > 0").all() as any[];
    const customers = db.prepare("SELECT * FROM customers").all() as any[];
    
    if (products.length === 0) return res.status(400).json({ error: "No products in stock" });
    
    const customerId = customers.length > 0 ? customers[Math.floor(Math.random() * customers.length)].id : null;
    const numItems = Math.floor(Math.random() * 3) + 1;
    const items = [];
    let total = 0;
    
    for (let i = 0; i < numItems; i++) {
      const p = products[Math.floor(Math.random() * products.length)];
      const qty = 1;
      items.push({ product_id: p.id, quantity: qty, unit_price: p.selling_price });
      total += p.selling_price;
    }
    
    const transaction = db.transaction(() => {
      const saleInfo = db.prepare("INSERT INTO sales (customer_id, total_amount) VALUES (?, ?)").run(customerId, total);
      const saleId = saleInfo.lastInsertRowid;
      for (const item of items) {
        db.prepare("INSERT INTO sale_items (sale_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)").run(
          saleId, item.product_id, item.quantity, item.unit_price
        );
        db.prepare("UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?").run(item.quantity, item.product_id);
      }
      return saleId;
    });
    
    const id = transaction();
    res.json({ id, total });
  });

  // Dashboard Stats
  app.get("/api/stats", (req, res) => {
    const dailyRevenue = db.prepare("SELECT SUM(total_amount) as total FROM sales WHERE date(sale_date) = date('now')").get() as { total: number };
    const monthlyRevenue = db.prepare("SELECT SUM(total_amount) as total FROM sales WHERE strftime('%m', sale_date) = strftime('%m', 'now')").get() as { total: number };
    const lowStockCount = db.prepare("SELECT COUNT(*) as count FROM products WHERE stock_quantity <= min_stock_level").get() as { count: number };
    
    const topProducts = db.prepare(`
      SELECT p.name, SUM(si.quantity) as total_sold
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      GROUP BY p.id
      ORDER BY total_sold DESC
      LIMIT 5
    `).all();

    const recentSales = db.prepare(`
      SELECT s.*, c.name as customer_name 
      FROM sales s 
      LEFT JOIN customers c ON s.customer_id = c.id
      ORDER BY sale_date DESC
      LIMIT 5
    `).all();

    // Detailed History
    const dailyHistory = db.prepare(`
      SELECT date(sale_date) as date, SUM(total_amount) as total
      FROM sales
      WHERE sale_date >= date('now', '-7 days')
      GROUP BY date(sale_date)
      ORDER BY date(sale_date) ASC
    `).all();

    const weeklyHistory = db.prepare(`
      SELECT strftime('%Y-%W', sale_date) as week, SUM(total_amount) as total
      FROM sales
      WHERE sale_date >= date('now', '-4 weeks')
      GROUP BY week
      ORDER BY week ASC
    `).all();

    const monthlyHistory = db.prepare(`
      SELECT strftime('%Y-%m', sale_date) as month, SUM(total_amount) as total
      FROM sales
      WHERE sale_date >= date('now', '-6 months')
      GROUP BY month
      ORDER BY month ASC
    `).all();

    // Low Rotation Products (less than 5 units sold in 30 days)
    const lowRotationProducts = db.prepare(`
      SELECT p.name, p.stock_quantity, IFNULL(SUM(si.quantity), 0) as total_sold
      FROM products p
      LEFT JOIN sale_items si ON p.id = si.product_id
      LEFT JOIN sales s ON si.sale_id = s.id AND s.sale_date >= date('now', '-30 days')
      GROUP BY p.id
      HAVING total_sold < 5
      ORDER BY total_sold ASC
      LIMIT 5
    `).all();

    // Calculate monthly profit
    const monthlyProfit = db.prepare(`
      SELECT SUM((si.unit_price - p.purchase_price) * si.quantity) as profit
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN products p ON si.product_id = p.id
      WHERE strftime('%m', s.sale_date) = strftime('%m', 'now')
    `).get() as { profit: number };

    // Weighted Projection (50% last month, 30% month-2, 20% month-3)
    const last3Months = db.prepare(`
      SELECT strftime('%m', sale_date) as month, SUM(total_amount) as total
      FROM sales
      WHERE sale_date >= date('now', '-3 months')
      GROUP BY month
      ORDER BY sale_date DESC
      LIMIT 3
    `).all() as { total: number }[];

    let weightedProjection = 0;
    if (last3Months.length > 0) {
      const weights = [0.5, 0.3, 0.2];
      weightedProjection = last3Months.reduce((acc, m, i) => acc + (m.total * (weights[i] || 0.1)), 0);
    }

    res.json({
      dailyRevenue: dailyRevenue.total || 0,
      monthlyRevenue: monthlyRevenue.total || 0,
      monthlyProfit: monthlyProfit.profit || 0,
      lowStockCount: lowStockCount.count,
      topProducts,
      recentSales,
      dailyHistory,
      weeklyHistory,
      monthlyHistory,
      lowRotationProducts,
      weightedProjection
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
