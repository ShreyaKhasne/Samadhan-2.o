// Improved One-File Student Directory (Backend + Frontend)
// Save as server.js
// Usage:
//   npm init -y
//   npm install express
//   node server.js
// Then open: http://localhost:3000

const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// Built-in body parser (no body-parser package needed)
app.use(express.json());

// In-memory data (use className instead of reserved word 'class')
let students = [
  { id: 1, name: "Utkarsh", className: "8A" },
  { id: 2, name: "Aarav", className: "8A" },
  { id: 3, name: "Saipratik", className: "8B" },
];

// Simple logger middleware (helps debugging)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()}  ${req.method} ${req.url}`);
  next();
});

// API endpoints
app.get("/api/students", (req, res) => {
  res.json(students);
});

app.post("/api/students", (req, res) => {
  const { name, className } = req.body;
  if (!name || !className) {
    return res.status(400).json({ error: "Both name and className are required" });
  }
  const newStudent = { id: students.length + 1, name, className };
  students.push(newStudent);
  res.status(201).json(newStudent);
});

// Serve frontend (React via CDN + small form)
app.get("/", (req, res) => {
  res.send(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Student Directory</title>
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body { font-family: Arial, sans-serif; text-align:center; padding:18px; }
    .card { margin:10px auto; padding:12px; width:260px; border:1px solid #ccc; border-radius:8px; box-shadow:0 2px 6px rgba(0,0,0,0.08); }
    form { margin-bottom:18px; }
    input, button { padding:8px; margin:6px; border-radius:6px; }
  </style>
</head>
<body>
  <h1>👨‍🎓 Student Directory</h1>
  <div id="root"></div>

  <script type="text/babel">
    const { useState, useEffect } = React;

    function App() {
      const [students, setStudents] = useState([]);
      const [loading, setLoading] = useState(true);
      const [name, setName] = useState("");
      const [className, setClassName] = useState("");
      const [error, setError] = useState("");

      useEffect(() => {
        fetch("/api/students")
          .then(r => {
            if (!r.ok) throw new Error("Network response was not ok");
            return r.json();
          })
          .then(data => { setStudents(data); setLoading(false); })
          .catch(e => { console.error(e); setError("Failed to load students"); setLoading(false); });
      }, []);

      const addStudent = async (e) => {
        e.preventDefault();
        setError("");
        if (!name.trim() || !className.trim()) {
          setError("Please enter both name and class");
          return;
        }

        try {
          const res = await fetch("/api/students", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: name.trim(), className: className.trim() })
          });

          const data = await res.json();
          if (!res.ok) {
            setError(data.error || "Failed to add student");
            return;
          }
          setStudents(prev => [...prev, data]);
          setName("");
          setClassName("");
        } catch (err) {
          console.error(err);
          setError("Network error while adding student");
        }
      };

      return (
        <div>
          <form onSubmit={addStudent}>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" />
            <input value={className} onChange={e => setClassName(e.target.value)} placeholder="Class (e.g. 8A)" />
            <button type="submit">Add Student</button>
          </form>

          {error && <div style={{color:"red", marginBottom:10}}>{error}</div>}

          {loading ? <p>Loading students...</p> : (
            <div>
              {students.map(s => (
                <div key={s.id} className="card">
                  <h3>{s.name}</h3>
                  <p>Class: {s.className}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    ReactDOM.createRoot(document.getElementById("root")).render(<App />);
  </script>
</body>
</html>`);
});

// Error handler (catchall)
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Server error" });
});

app.listen(PORT, () => {
  console.log(\`🚀 Server running: http://localhost:\${PORT} (PID: \${process.pid})\`);
});
