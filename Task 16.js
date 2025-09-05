const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = new sqlite3.Database(path.join(__dirname, "store.db"));
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    price INTEGER,
    image TEXT,
    stock INTEGER
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    items TEXT,
    total INTEGER,
    status TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.get("SELECT COUNT(*) AS c FROM products", (err, row) => {
    if (!err && row.c === 0) {
      const stmt = db.prepare("INSERT INTO products (title,description,price,image,stock) VALUES (?,?,?,?,?)");
      const seed = [
        ["Vintage Shirt","Comfortable cotton vintage shirt",799,"https://picsum.photos/seed/p1/400/300",10],
        ["Sneakers","Lightweight everyday sneakers",2499,"https://picsum.photos/seed/p2/400/300",8],
        ["Backpack","Durable travel backpack 20L",1299,"https://picsum.photos/seed/p3/400/300",5],
        ["Headphones","Noise-isolating over-ear headphones",3499,"https://picsum.photos/seed/p4/400/300",6],
        ["Coffee Mug","Ceramic mug 350ml",399,"https://picsum.photos/seed/p5/400/300",20]
      ];
      seed.forEach(p => stmt.run(p));
      stmt.finalize();
    }
  });
});

app.get("/api/products", (req, res) => {
  db.all("SELECT * FROM products", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get("/api/products/:id", (req, res) => {
  db.get("SELECT * FROM products WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  });
});

app.post("/api/create-order", (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: "Cart empty" });
  const productIds = items.map(i => i.id);
  const placeholders = productIds.map(() => "?").join(",");
  db.all(`SELECT * FROM products WHERE id IN (${placeholders})`, productIds, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows.length !== productIds.length) return res.status(400).json({ error: "Some products not found" });
    let total = 0;
    const insufficient = [];
    const rowMap = {};
    rows.forEach(r => rowMap[r.id] = r);
    for (const it of items) {
      const prod = rowMap[it.id];
      if (it.qty <= 0 || it.qty > prod.stock) insufficient.push({ id: it.id, available: prod.stock });
      total += prod.price * it.qty;
    }
    if (insufficient.length) return res.status(400).json({ error: "Insufficient stock", details: insufficient });
    const orderId = crypto.randomUUID ? crypto.randomUUID() : (Date.now().toString(36) + Math.random().toString(36).slice(2,8));
    const itemsJson = JSON.stringify(items);
    db.run("INSERT INTO orders (id, items, total, status) VALUES (?,?,?,?)", [orderId, itemsJson, total, "created"], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ orderId, total });
    });
  });
});

app.post("/api/pay", (req, res) => {
  const { orderId, paymentMethod } = req.body;
  if (!orderId) return res.status(400).json({ error: "Missing orderId" });
  db.get("SELECT * FROM orders WHERE id = ?", [orderId], (err, order) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.status !== "created") return res.status(400).json({ error: "Order not payable" });
    const items = JSON.parse(order.items);
    const ids = items.map(i => i.id);
    const placeholders = ids.map(() => "?").join(",");
    db.all(`SELECT * FROM products WHERE id IN (${placeholders})`, ids, (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      const rowMap = {};
      rows.forEach(r => rowMap[r.id] = r);
      const insufficient = [];
      for (const it of items) {
        const prod = rowMap[it.id];
        if (it.qty > prod.stock) insufficient.push({ id: it.id, available: prod.stock });
      }
      if (insufficient.length) return res.status(400).json({ error: "Insufficient stock on payment", details: insufficient });
      const updateStmt = db.prepare("UPDATE products SET stock = stock - ? WHERE id = ?");
      items.forEach(it => updateStmt.run(it.qty, it.id));
      updateStmt.finalize();
      db.run("UPDATE orders SET status = ? WHERE id = ?", ["paid", orderId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, orderId, paidAmount: order.total, paymentMethod: paymentMethod || "mock" });
      });
    });
  });
});

app.get("/api/orders/:id", (req, res) => {
  db.get("SELECT * FROM orders WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Order not found" });
    res.json(row);
  });
});

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Mini Store</title>
<style>
body{font-family:system-ui,Arial;margin:0;background:#f5f7fb}
.header{background:#111827;color:#fff;padding:12px 20px;display:flex;justify-content:space-between;align-items:center}
.container{max-width:1000px;margin:20px auto;padding:0 16px}
.products{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px}
.card{background:#fff;padding:12px;border-radius:8px;box-shadow:0 1px 4px rgba(2,6,23,0.08)}
.card img{width:100%;height:140px;object-fit:cover;border-radius:6px}
.btn{background:#111827;color:#fff;padding:8px 10px;border:0;border-radius:6px;cursor:pointer}
.cart{position:fixed;right:18px;bottom:18px;background:#fff;padding:12px;border-radius:10px;box-shadow:0 6px 18px rgba(2,6,23,0.12);width:320px;max-height:70vh;overflow:auto}
.cart h4{margin:0 0 8px 0}
.small{font-size:13px;color:#666}
.row{display:flex;gap:8px;align-items:center}
.qty{width:60px}
.total{font-weight:700;margin-top:8px}
.checkout{background:#10b981;color:#fff;padding:8px;border:0;border-radius:6px;cursor:pointer;width:100%}
.notice{background:#fff3cd;border-left:4px solid #ffecb5;padding:8px;margin-bottom:12px;border-radius:6px}
</style>
</head>
<body>
<div class="header"><div style="font-weight:700">Mini Store</div><div class="small">Products • Cart • Mock Payment</div></div>
<div class="container">
  <div id="products" class="products"></div>
</div>
<div id="cart" class="cart" style="display:none"></div>
<script>
async function fetchProducts(){
  const res = await fetch('/api/products');
  const products = await res.json();
  const root = document.getElementById('products');
  root.innerHTML = products.map(p => \`
    <div class="card" data-id="\${p.id}">
      <img src="\${p.image}" alt="\${p.title}">
      <h4>\${p.title}</h4>
      <div class="small">\${p.description}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
        <div>\${(p.price/100).toFixed(2)} ₹</div>
        <button class="btn" onclick="addToCart(\${p.id})">\${p.stock>0? 'Add' : 'Sold'}</button>
      </div>
    </div>
  \`).join('');
}
function getCart(){ try { return JSON.parse(localStorage.getItem('cart')||'[]') } catch { return [] } }
function saveCart(c){ localStorage.setItem('cart', JSON.stringify(c)); renderCart(); }
function addToCart(id){
  fetch('/api/products/' + id).then(r=>r.json()).then(p=>{
    const cart = getCart();
    const existing = cart.find(i=>i.id===p.id);
    if(existing){
      if(existing.qty+1 > p.stock) return alert('No more stock');
      existing.qty++;
    } else {
      if(p.stock<=0) return alert('Out of stock');
      cart.push({ id: p.id, title: p.title, price: p.price, qty: 1 });
    }
    saveCart(cart);
  });
}
function removeFromCart(id){ const c=getCart().filter(i=>i.id!==id); saveCart(c); }
function changeQty(id, qty){
  const c = getCart();
  const item = c.find(i=>i.id===id);
  if(!item) return;
  if(qty<=0) { removeFromCart(id); return; }
  item.qty = qty;
  saveCart(c);
}
function renderCart(){
  const cEl = document.getElementById('cart');
  const cart = getCart();
  if(cart.length===0){ cEl.style.display='none'; return }
  cEl.style.display='block';
  const total = cart.reduce((s,i)=>s + i.price * i.qty, 0);
  cEl.innerHTML = \`
    <h4>Cart</h4>
    <div class="small">Items: \${cart.length}</div>
    <div style="margin-top:8px">\${cart.map(it=>\`
      <div class="row" style="margin-bottom:6px">
        <div style="flex:1">
          <div style="font-weight:600">\${it.title}</div>
          <div class="small">\${(it.price/100).toFixed(2)} ₹ each</div>
        </div>
        <input class="qty" type="number" value="\${it.qty}" min="1" onchange="changeQty(\${it.id}, +this.value)">
        <button onclick="removeFromCart(\${it.id})" style="background:#ef4444;color:#fff;border:0;padding:6px;border-radius:6px;cursor:pointer">X</button>
      </div>
    \`).join('')}</div>
    <div class="total">Total: \${(total/100).toFixed(2)} ₹</div>
    <div style="margin-top:8px">
      <button class="checkout" onclick="checkout()">Pay (Mock)</button>
    </div>
    <div style="margin-top:8px" class="small">This demo simulates payment and reduces stock on success.</div>
  \`;
}
async function checkout(){
  const cart = getCart();
  if(cart.length===0) return alert('Cart empty');
  const res = await fetch('/api/create-order', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ items: cart }) });
  const data = await res.json();
  if(!data.orderId){ return alert(data.error || 'Order creation failed') }
  const pay = await fetch('/api/pay', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ orderId: data.orderId, paymentMethod: 'mock-card' }) });
  const payRes = await pay.json();
  if(payRes.success){
    localStorage.removeItem('cart');
    renderCart();
    alert('Payment successful! Order: ' + payRes.orderId + '\\nAmount: ' + (payRes.paidAmount/100).toFixed(2) + ' ₹');
    fetchProducts();
  } else {
    alert(payRes.error || 'Payment failed');
  }
}
fetchProducts();
renderCart();
</script>
</body>
</html>`;

app.get("/", (req, res) => res.send(html));

app.listen(PORT, () => console.log("Store running at http://localhost:" + PORT));
