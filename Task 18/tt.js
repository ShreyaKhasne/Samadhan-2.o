// save as tasks-realtime.js
const express=require('express'), http=require('http'), {Server}=require('socket.io'), sqlite3=require('sqlite3').verbose(), path=require('path');
const app=express(), server=http.createServer(app), io=new Server(server), PORT=4003;
app.use(express.json());
const db=new sqlite3.Database(path.join(__dirname,'tasks-realtime.db'));
db.serialize(()=>{
  db.run("CREATE TABLE IF NOT EXISTS lists(id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT,pos INTEGER)");
  db.run("CREATE TABLE IF NOT EXISTS cards(id INTEGER PRIMARY KEY AUTOINCREMENT,list_id INTEGER,title TEXT,description TEXT,pos INTEGER)");
  db.get("SELECT COUNT(*) c FROM lists",(e,r)=>{ if(!e && r.c===0){ db.run("INSERT INTO lists(title,pos) VALUES('To Do',100)"); db.run("INSERT INTO lists(title,pos) VALUES('In Progress',200)"); db.run("INSERT INTO lists(title,pos) VALUES('Done',300)"); }});
});
function broadcast(){ db.all("SELECT * FROM lists ORDER BY pos",(e,l)=>{ db.all("SELECT * FROM cards ORDER BY pos",(er,c)=>{ io.emit('board',{lists:l,cards:c}); }); }); }
app.get('/api/board',(req,res)=> db.all("SELECT * FROM lists ORDER BY pos",(e,l)=>{ db.all("SELECT * FROM cards ORDER BY pos",(er,c)=>res.json({lists:l,cards:c})); }));
app.post('/api/cards',(req,res)=>{ const {list_id,title}=req.body; db.get("SELECT COALESCE(MAX(pos),0) m FROM cards WHERE list_id=?",[list_id],(e,r)=>{ const pos=(r.m||0)+100; db.run("INSERT INTO cards(list_id,title,pos) VALUES(?,?,?)",[list_id,title,pos],function(err){ broadcast(); res.json({id:this.lastID}); }); }); });
app.put('/api/cards/:id/move',(req,res)=>{ db.run("UPDATE cards SET list_id=?,pos=? WHERE id=?",[req.body.to_list_id,req.body.to_pos,req.params.id], function(err){ broadcast(); res.json({success:true}); });});
app.get('/',(req,res)=>res.send(`<!doctype html><html><head><meta charset="utf-8"/><title>RT Kanban</title></head><body><div id="app"></div><script src="/socket.io/socket.io.js"></script><script>
const socket=io(); socket.on('board',d=>document.getElementById('app').innerHTML=JSON.stringify(d)); socket.on('connect',()=>fetch('/api/board').then(r=>r.json()).then(d=>document.getElementById('app').innerHTML=JSON.stringify(d)));
</script></body></html>`));
io.on('connection',()=>broadcast());
server.listen(PORT,()=>console.log('Realtime Kanban http://localhost:'+PORT));
