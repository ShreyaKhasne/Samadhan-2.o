// 📘 Express.js Basics Example
// Save this file as app.js

// Step 1: Install Express
// Run in terminal: npm install express

const express = require("express");
const app = express();
const PORT = 3000;

// Middleware to parse JSON request body
app.use(express.json());

// Dummy student data
let students = [
  { id: 1, name: "Utkarsh", class: "8A" },
  { id: 2, name: "Aarav", class: "8A" },
  { id: 3, name: "Saipratik", class: "8B" }
];

// Step 2: Create Routes

// GET route → return list of students
app.get("/students", (req, res) => {
  res.json(students);
});

// POST route → add a new student
app.post("/students", (req, res) => {
  const newStudent = {
    id: students.length + 1,
    name: req.body.name,
    class: req.body.class
  };
  students.push(newStudent);
  res.status(201).json(newStudent);
});

// Step 3: Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
