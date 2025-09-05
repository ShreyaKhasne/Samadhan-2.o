const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;

app.get("/", (req, res) => {
  res.send(`
    <h2>Simple Chat</h2>
    <input id="msg" placeholder="Type..." />
    <button onclick="send()">Send</button>
    <ul id="chat"></ul>
    <script src="/socket.io/socket.io.js"></script>
    <script>
      const socket = io();
      function send(){
        const val = document.getElementById('msg').value;
        socket.emit('chat', val);
      }
      socket.on('chat', m=>{
        const li = document.createElement('li');
        li.textContent = m;
        document.getElementById('chat').appendChild(li);
      });
    </script>
  `);
});

io.on("connection", (socket) => {
  socket.on("chat", (msg) => io.emit("chat", msg));
});

server.listen(PORT, () => console.log("Running on http://localhost:"+PORT));
