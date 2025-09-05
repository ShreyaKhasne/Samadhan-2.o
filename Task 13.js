// Notes App (Express + SQLite)
// Save as: notes-app.js
// Run: node notes-app.js
// Install dependencies first: npm install express sqlite3

const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Database setup ---
const db = new sqlite3.Database(path.join(__dirname, "notes.db"));
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      body TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// --- API Routes ---

// Get all notes
app.get("/api/notes", (req, res) => {
  db.all("SELECT * FROM notes ORDER BY created_at DESC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get single note
app.get("/api/notes/:id", (req, res) => {
  db.get("SELECT * FROM notes WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Note not found" });
    res.json(row);
  });
});

// Create note
app.post("/api/notes", (req, res) => {
  const { title, body } = req.body;
  if (!title) return res.status(400).json({ error: "Title is required" });

  db.run("INSERT INTO notes (title, body) VALUES (?, ?)", [title, body], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    db.get("SELECT * FROM notes WHERE id = ?", [this.lastID], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json(row);
    });
  });
});

// Update note
app.put("/api/notes/:id", (req, res) => {
  const { title, body } = req.body;
  if (!title) return res.status(400).json({ error: "Title is required" });

  db.run("UPDATE notes SET title = ?, body = ? WHERE id = ?", [title, body, req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Note not found" });
    db.get("SELECT * FROM notes WHERE id = ?", [req.params.id], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(row);
    });
  });
});

// Delete note
app.delete("/api/notes/:id", (req, res) => {
  db.run("DELETE FROM notes WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Note not found" });
    res.json({ success: true });
  });
});

// --- Frontend (served on /) ---
app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Notes App</title>
  <style>
    body { font-family: Arial; margin: 20px; }
    form { margin-bottom: 20px; }
    input, textarea { display:block; margin:5px 0; width:300px; padding:5px; }
    button { padding:6px 10px; margin-top:5px; }
    .note { border:1px solid #ccc; padding:10px; margin-bottom:10px; border-radius:5px; }
  </style>
</head>
<body>
  <h1>Notes App</h1>
  <form id="noteForm">
    <input id="title" placeholder="Title" required />
    <textarea id="body" placeholder="Write something..."></textarea>
    <button type="submit">Save</button>
  </form>
  <div id="notes"></div>

<script>
  const form = document.getElementById("noteForm");
  const notesDiv = document.getElementById("notes");
  let editId = null;

  async function loadNotes(){
    const res = await fetch("/api/notes");
    const notes = await res.json();
    notesDiv.innerHTML = notes.map(n => \`
      <div class="note">
        <h3>\${n.title}</h3>
        <p>\${n.body || ""}</p>
        <small>\${new Date(n.created_at).toLocaleString()}</small><br/>
        <button onclick="editNote(\${n.id})">Edit</button>
        <button onclick="deleteNote(\${n.id})">Delete</button>
      </div>
    \`).join("");
  }

  form.onsubmit = async (e) => {
    e.preventDefault();
    const title = document.getElementById("title").value;
    const body = document.getElementById("body").value;
    if(editId){
      await fetch("/api/notes/" + editId, { method:"PUT", headers:{"Content-Type":"application/json"}, body: JSON.stringify({title, body}) });
      editId = null;
    } else {
      await fetch("/api/notes", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({title, body}) });
    }
    form.reset();
    loadNotes();
  };

  async function editNote(id){
    const res = await fetch("/api/notes/" + id);
    const note = await res.json();
    document.getElementById("title").value = note.title;
    document.getElementById("body").value = note.body || "";
    editId = id;
  }

  async function deleteNote(id){
    await fetch("/api/notes/" + id, { method:"DELETE" });
    loadNotes();
  }

  loadNotes();
</script>
</body>
</html>
  `);
});

// --- Start server ---
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
