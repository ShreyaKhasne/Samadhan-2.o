// 📘 Node.js Intro Example
// Save this as server.js

// What is Node.js?
// 👉 Node.js is a JavaScript runtime built on Chrome's V8 engine.
// 👉 It lets us run JS outside the browser, often for backend development.

// Step 1: npm init
// Run in terminal:  npm init -y
// (This creates a package.json file)

// Step 2: Installing a package (optional, e.g., nodemon for auto-restart)
// Run: npm install nodemon --save-dev
// Start server with: npx nodemon server.js

// Step 3: Create a basic HTTP server
const http = require("http"); // Node.js built-in module

// Create server
const server = http.createServer((req, res) => {
  // Set response header
  res.writeHead(200, { "Content-Type": "application/json" });

  // Mini Task: Return "Hello, World!" as API JSON response
  res.end(JSON.stringify({ message: "Hello, World!" }));
});

// Step 4: Start server on port 3000
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
