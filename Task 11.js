// server.js
// Run: npm init -y && npm install express cors
// Start: node server.js

const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json()); // parse JSON body

// In-memory student data (will reset when server restarts)
let students = [
  { id: 1, name: "Utkarsh", class: "8A" },
  { id: 2, name: "Aarav", class: "8A" },
  { id: 3, name: "Saipratik", class: "8B" },
];

// ✅ GET all students
app.get("/api/students", (req, res) => {
  res.json(students);
});

// ✅ GET one student by ID
app.get("/api/students/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const student = students.find((s) => s.id === id);
  if (!student) return res.status(404).json({ message: "Student not found" });
  res.json(student);
});

// ✅ POST (Add new student)
app.post("/api/students", (req, res) => {
  const { name, class: studentClass } = req.body;
  if (!name || !studentClass) {
    return res.status(400).json({ message: "Name and class are required" });
  }
  const newStudent = {
    id: students.length ? students[students.length - 1].id + 1 : 1,
    name,
    class: studentClass,
  };
  students.push(newStudent);
  res.status(201).json(newStudent);
});

// ✅ PUT (Update student by ID)
app.put("/api/students/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const { name, class: studentClass } = req.body;

  const studentIndex = students.findIndex((s) => s.id === id);
  if (studentIndex === -1)
    return res.status(404).json({ message: "Student not found" });

  // Update student
  students[studentIndex] = {
    ...students[studentIndex],
    name: name || students[studentIndex].name,
    class: studentClass || students[studentIndex].class,
  };

  res.json(students[studentIndex]);
});

// ✅ DELETE student
app.delete("/api/students/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const studentIndex = students.findIndex((s) => s.id === id);
  if (studentIndex === -1)
    return res.status(404).json({ message: "Student not found" });

  const removedStudent = students.splice(studentIndex, 1);
  res.json(removedStudent[0]);
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Student CRUD API running at http://localhost:${PORT}`);
});
