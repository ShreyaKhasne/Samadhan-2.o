const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 4000;
const SECRET = "mysecretkey";

app.use(express.json());

const db = new sqlite3.Database(path.join(__dirname, "users-auth.db"));
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )`);
});

app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Missing fields" });
  const hashed = await bcrypt.hash(password, 10);
  db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, hashed], function (err) {
    if (err) return res.status(400).json({ error: "User exists" });
    res.json({ success: true, userId: this.lastID });
  });
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
    if (!user) return res.status(400).json({ error: "Invalid credentials" });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Invalid credentials" });
    const token = jwt.sign({ id: user.id, username: user.username }, SECRET, { expiresIn: "1h" });
    res.json({ token });
  });
});

function auth(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });
  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Bad token" });
    req.user = user;
    next();
  });
}

app.get("/api/profile", auth, (req, res) => {
  res.json({ message: "Welcome " + req.user.username });
});

const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Auth App</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-router-dom@6/umd/react-router-dom.development.js"></script>
</head>
<body>
  <div id="root"></div>
  <script type="text/javascript">
    const { useState } = React;
    const { BrowserRouter, Routes, Route, Link, useNavigate } = ReactRouterDOM;

    function App() {
      const [token, setToken] = useState(localStorage.getItem("token"));
      function handleLogout() {
        localStorage.removeItem("token");
        setToken(null);
      }
      return (
        <BrowserRouter>
          <nav>
            <Link to="/">Home</Link> | 
            {!token && <Link to="/login">Login</Link>} | 
            {!token && <Link to="/register">Register</Link>} | 
            {token && <Link to="/profile">Profile</Link>} | 
            {token && <button onClick={handleLogout}>Logout</button>}
          </nav>
          <Routes>
            <Route path="/" element={<h2>Welcome to Auth App</h2>} />
            <Route path="/login" element={<Login setToken={setToken} />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={token ? <Profile token={token}/> : <h3>Please login</h3>} />
          </Routes>
        </BrowserRouter>
      );
    }

    function Login({ setToken }) {
      const [username, setUsername] = useState("");
      const [password, setPassword] = useState("");
      const nav = useNavigate();
      async function submit(e) {
        e.preventDefault();
        const res = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.token) {
          localStorage.setItem("token", data.token);
          setToken(data.token);
          nav("/profile");
        } else {
          alert(data.error);
        }
      }
      return (
        <form onSubmit={submit}>
          <h3>Login</h3>
          <input value={username} onChange={e => setUsername(e.target.value)} placeholder="username" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="password" />
          <button type="submit">Login</button>
        </form>
      );
    }

    function Register() {
      const [username, setUsername] = useState("");
      const [password, setPassword] = useState("");
      const nav = useNavigate();
      async function submit(e) {
        e.preventDefault();
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.success) {
          alert("Registered!");
          nav("/login");
        } else {
          alert(data.error);
        }
      }
      return (
        <form onSubmit={submit}>
          <h3>Register</h3>
          <input value={username} onChange={e => setUsername(e.target.value)} placeholder="username" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="password" />
          <button type="submit">Register</button>
        </form>
      );
    }

    function Profile({ token }) {
      const [msg, setMsg] = useState("");
      React.useEffect(() => {
        fetch("/api/profile", {
          headers: { Authorization: "Bearer " + token }
        })
        .then(res => res.json())
        .then(data => setMsg(data.message));
      }, []);
      return <h3>{msg}</h3>;
    }

    ReactDOM.createRoot(document.getElementById("root")).render(<App />);
  </script>
</body>
</html>
`;

app.get("/", (req, res) => res.send(html));

app.listen(PORT, () => console.log("Server at http://localhost:" + PORT));
