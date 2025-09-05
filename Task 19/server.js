const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET = "supersecret_demo_change_in_prod";

app.use(express.json());

const db = new sqlite3.Database(path.join(__dirname, "social.db"));
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    display_name TEXT,
    password TEXT,
    bio TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER,
    user_id INTEGER,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(post_id) REFERENCES posts(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER,
    user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id),
    FOREIGN KEY(post_id) REFERENCES posts(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
});

function sign(user) {
  return jwt.sign({ id: user.id, username: user.username, display_name: user.display_name }, SECRET, { expiresIn: "8h" });
}

function authMiddleware(req, res, next) {
  const h = req.headers.authorization;
  if (!h) return res.status(401).json({ error: "No token" });
  const token = h.split(" ")[1];
  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
}

app.post("/api/register", async (req, res) => {
  const { username, password, display_name } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Missing fields" });
  const hashed = await bcrypt.hash(password, 10);
  db.run("INSERT INTO users (username, display_name, password) VALUES (?,?,?)", [username, display_name || username, hashed], function (err) {
    if (err) return res.status(400).json({ error: "User exists" });
    db.get("SELECT id, username, display_name FROM users WHERE id = ?", [this.lastID], (e, user) => {
      res.json({ user, token: sign(user) });
    });
  });
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
    if (!user) return res.status(400).json({ error: "Invalid credentials" });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ error: "Invalid credentials" });
    res.json({ user: { id: user.id, username: user.username, display_name: user.display_name }, token: sign(user) });
  });
});

app.get("/api/me", authMiddleware, (req, res) => {
  db.get("SELECT id, username, display_name, bio, created_at FROM users WHERE id = ?", [req.user.id], (e, u) => res.json(u));
});

app.post("/api/posts", authMiddleware, (req, res) => {
  const content = (req.body.content || "").trim();
  if (!content) return res.status(400).json({ error: "Empty post" });
  db.run("INSERT INTO posts (user_id, content) VALUES (?,?)", [req.user.id, content], function () {
    db.get("SELECT p.*, u.username, u.display_name FROM posts p JOIN users u ON p.user_id=u.id WHERE p.id = ?", [this.lastID], (e, post) => {
      io.emit("new-post", post);
      res.json(post);
    });
  });
});

app.get("/api/feed", (req, res) => {
  db.all("SELECT p.*, u.username, u.display_name, (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS like_count, (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count FROM posts p JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC LIMIT 100", (err, rows) => res.json(rows));
});

app.post("/api/posts/:id/comment", authMiddleware, (req, res) => {
  const content = (req.body.content || "").trim();
  if (!content) return res.status(400).json({ error: "Empty comment" });
  db.run("INSERT INTO comments (post_id, user_id, content) VALUES (?,?,?)", [req.params.id, req.user.id, content], function () {
    db.get("SELECT c.*, u.username, u.display_name FROM comments c JOIN users u ON c.user_id=u.id WHERE c.id = ?", [this.lastID], (e, comment) => {
      io.emit("new-comment", { postId: req.params.id, comment });
      res.json(comment);
    });
  });
});

app.post("/api/posts/:id/like", authMiddleware, (req, res) => {
  const postId = req.params.id;
  db.get("SELECT * FROM likes WHERE post_id = ? AND user_id = ?", [postId, req.user.id], (e, l) => {
    if (l) {
      db.run("DELETE FROM likes WHERE id = ?", [l.id], () => {
        db.get("SELECT COUNT(*) AS c FROM likes WHERE post_id = ?", [postId], (er, r) => {
          io.emit("like-toggled", { postId, liked: false, likes: r.c });
          res.json({ liked: false, likes: r.c });
        });
      });
    } else {
      db.run("INSERT INTO likes (post_id, user_id) VALUES (?, ?)", [postId, req.user.id], () => {
        db.get("SELECT COUNT(*) AS c FROM likes WHERE post_id = ?", [postId], (er, r) => {
          io.emit("like-toggled", { postId, liked: true, likes: r.c });
          res.json({ liked: true, likes: r.c });
        });
      });
    }
  });
});

const http = require("http").createServer(app);
const io = require("socket.io")(http, { cors: { origin: "*" } });
io.on("connection", () => {});

http.listen(PORT, () => console.log("Backend running at http://localhost:" + PORT));
