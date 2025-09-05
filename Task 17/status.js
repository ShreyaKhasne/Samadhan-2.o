const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;

let users = {};

app.get("/", (req, res) => {
  res.send(`
    <h2>Chat with Status</h2>
    <input id="name" placeholder="Your name"/>
    <input id="msg" placeholder="Message"/>
    <button onclick="send()">Send</button>
    <div><b>Online Users:</b><ul id="users"></ul></div>
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
      socket.on('users', u=>{
        const list=document.getElementById('users');
        list.innerHTML='';
        Object.values(u).forEach(v=>{
          const li=document.createElement('li');
          li.textContent=v;
          list.appendChild(li);
        });
      });
      socket.on('connect', ()=>socket.emit('join', prompt('Enter name')));
    </script>
  `);
});

io.on("connection", (socket) => {
  socket.on("join", (name) => {
    users[socket.id] = name || "Anon";
    io.emit("users", users);
  });

  socket.on("chat", (data) => io.emit("chaat", data));

  socket.on("disconnect", () => {
    delete users[socket.id];
    io.emit("users", users);
  });
});

server.listen(PORT, () => console.log("Running on http://localhost:"+PORT));
