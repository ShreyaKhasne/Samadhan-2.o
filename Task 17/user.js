const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;

app.get("/", (req, res) => {
  res.send(`
    <h2>Chat with Usernames</h2>
    <input id="name" placeholder="Your name"/>
    <input id="msg" placeholder="Message"/>
    <button onclick="send()">Send</button>
    <ul id="chat"></ul>
    <script src="/socket.io/socket.io.js"></script>
    <script>
      const socket = io();
      function send(){
        const n = document.getElementById('name').value || 'Anon';
        const m = document.getElementById('msg').value;
        socket.emit('chat', {name:n, msg:m});
      }
      socket.on('chat', data=>{
        const li=document.createElement('li');
        li.textContent = data.name+": "+data.msg;
        document.getElementById('chat').appendChild(li);
      });
    </script>
  `);
});

io.on("connection", (socket) => {
  socket.on("chat", (data) => io.emit("chat", data));
});

server.listen(PORT, () => console.log("Running on http://localhost:"+PORT));
