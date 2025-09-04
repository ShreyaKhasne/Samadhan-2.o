// server.js
// Run: npm init -y && npm i express && node server.js
// Then open: http://localhost:3000

const express = require("express");
const app = express();
app.use(express.json());

/* ===== In-memory DB ===== */
let todos = [
  { id: 1, text: "Learn React fetch()", done: false },
  { id: 2, text: "Build Node backend", done: false },
];
let nextId = 3;

/* ===== API ===== */
app.get("/api/todos", (req, res) => {
  res.json(todos);
});

app.post("/api/todos", (req, res) => {
  const text = (req.body?.text || "").trim();
  if (!text) return res.status(400).json({ error: "Text is required" });
  const todo = { id: nextId++, text, done: false };
  todos.push(todo);
  res.status(201).json(todo);
});

app.delete("/api/todos/:id", (req, res) => {
  const id = Number(req.params.id);
  const idx = todos.findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  const [deleted] = todos.splice(idx, 1);
  res.json(deleted);
});

/* ===== Frontend (React via CDN) ===== */
const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Day 12 • React + API • To-Do</title>
<link rel="preconnect" href="https://unpkg.com">
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; margin: 0; }
  .wrap { max-width: 720px; margin: 40px auto; padding: 24px; }
  .card { background: rgba(127,127,127,0.08); border: 1px solid rgba(127,127,127,0.2); border-radius: 16px; padding: 20px; }
  h1 { margin: 0 0 12px; font-size: 22px; }
  form { display: flex; gap: 10px; margin: 12px 0 20px; }
  input[type="text"] { flex: 1; padding: 10px 12px; border-radius: 12px; border: 1px solid rgba(127,127,127,0.3); }
  button { padding: 10px 14px; border-radius: 12px; border: 1px solid rgba(127,127,127,0.3); cursor: pointer; }
  ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 10px; }
  li { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border: 1px solid rgba(127,127,127,0.2); border-radius: 12px; background: rgba(127,127,127,0.06); }
  .text { display: flex; align-items: center; gap: 10px; }
  .muted { opacity: 0.6; font-size: 12px; }
  .row { display: flex; align-items: center; gap: 8px; }
  .danger { border-color: #c00; }
  .sr { position: absolute; left: -9999px; }
  .footer { margin-top: 12px; display: flex; justify-content: space-between; align-items: center; }
  .error { color: #c00; font-size: 13px; }
  .spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid currentColor; border-right-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <h1>Day 12: React + API • To-Do</h1>
      <p class="muted">Mini-task: Fetch + render from backend, Add, Delete</p>

      <div id="root" aria-live="polite"></div>
    </div>
  </div>

  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/babel-standalone@6/babel.min.js"></script>

  <script type="text/babel">
    const { useEffect, useState } = React;

    function useTodosApi() {
      const [todos, setTodos] = useState([]);
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState("");

      const fetchTodos = async () => {
        setLoading(true); setError("");
        try {
          const res = await fetch("/api/todos");
          if (!res.ok) throw new Error("Failed to load");
          const data = await res.json();
          setTodos(data);
        } catch (e) {
          setError(e.message || "Error");
        } finally {
          setLoading(false);
        }
      };

      const addTodo = async (text) => {
        setError("");
        try {
          const res = await fetch("/api/todos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
          });
          if (!res.ok) throw new Error("Add failed");
          const created = await res.json();
          setTodos(prev => [created, ...prev]);
        } catch (e) {
          setError(e.message || "Error");
        }
      };

      const deleteTodo = async (id) => {
        setError("");
        try {
          const res = await fetch("/api/todos/" + id, { method: "DELETE" });
          if (!res.ok) throw new Error("Delete failed");
          await res.json();
          setTodos(prev => prev.filter(t => t.id !== id));
        } catch (e) {
          setError(e.message || "Error");
        }
      };

      return { todos, loading, error, fetchTodos, addTodo, deleteTodo };
    }

    function App() {
      const { todos, loading, error, fetchTodos, addTodo, deleteTodo } = useTodosApi();
      const [text, setText] = useState("");
      const [adding, setAdding] = useState(false);
      const [deletingId, setDeletingId] = useState(null);

      useEffect(() => { fetchTodos(); }, []);

      const onSubmit = async (e) => {
        e.preventDefault();
        const t = text.trim();
        if (!t) return;
        setAdding(true);
        await addTodo(t);
        setText("");
        setAdding(false);
      };

      return (
        <div>
          <form onSubmit={onSubmit} aria-label="Add todo form">
            <label className="sr" htmlFor="todoText">New To-Do</label>
            <input
              id="todoText"
              type="text"
              placeholder="e.g. Finish mini task"
              value={text}
              onChange={e => setText(e.target.value)}
              disabled={adding}
            />
            <button type="submit" disabled={adding}>
              {adding ? <span className="spinner" aria-hidden="true"></span> : "Add"}
            </button>
          </form>

          {error && <div className="error" role="alert">⚠️ {error}</div>}

          <div className="footer">
            <div className="row">
              <button onClick={fetchTodos} disabled={loading}>
                {loading ? "Loading..." : "Refresh"}
              </button>
              <span className="muted">{todos.length} item(s)</span>
            </div>
          </div>

          <ul aria-label="To-Do list">
            {loading && todos.length === 0 && (
              <li><span className="spinner" aria-hidden="true"></span> Loading…</li>
            )}
            {todos.map(t => (
              <li key={t.id}>
                <div className="text">
                  <input type="checkbox" disabled/>
                  <span>{t.text}</span>
                </div>
                <button
                  className="danger"
                  onClick={async () => { setDeletingId(t.id); await deleteTodo(t.id); setDeletingId(null); }}
                  disabled={deletingId === t.id}
                >
                  {deletingId === t.id ? "Deleting…" : "Delete"}
                </button>
              </li>
            ))}
            {!loading && todos.length === 0 && <li className="muted">No items yet. Add one ↑</li>}
          </ul>
        </div>
      );
    }

    const root = ReactDOM.createRoot(document.getElementById("root"));
    root.render(<App />);
  </script>
</body>
</html>`;

app.get("/", (_req, res) => res.type("html").send(html));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("✅ To-Do app running: http://localhost:" + PORT));
