// save as tasks-rest.js
const express=require('express'), sqlite3=require('sqlite3').verbose(), path=require('path');
const app=express(), PORT=4001;
app.use(express.json());
const db=new sqlite3.Database(path.join(__dirname,'tasks-rest.db'));
db.serialize(()=>{
  db.run("CREATE TABLE IF NOT EXISTS lists(id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT,pos INTEGER)");
  db.run("CREATE TABLE IF NOT EXISTS cards(id INTEGER PRIMARY KEY AUTOINCREMENT,list_id INTEGER,title TEXT,description TEXT,pos INTEGER,FOREIGN KEY(list_id) REFERENCES lists(id))");
  db.get("SELECT COUNT(*) c FROM lists",(e,r)=>{ if(!e && r.c===0){ db.run("INSERT INTO lists(title,pos) VALUES('Backlog',100)"); db.run("INSERT INTO lists(title,pos) VALUES('In Progress',200)"); db.run("INSERT INTO lists(title,pos) VALUES('Done',300)"); }});
});
app.get('/lists',(req,res)=>db.all("SELECT * FROM lists ORDER BY pos",(e,r)=>e?res.status(500).json({error:e.message}):res.json(r)));
app.post('/lists',(req,res)=>{ const t=req.body.title||'Untitled'; db.get("SELECT COALESCE(MAX(pos),0) m FROM lists",(e,r)=>{const pos=(r.m||0)+100; db.run("INSERT INTO lists(title,pos) VALUES(?,?)",[t,pos],function(err){ if(err) return res.status(500).json({error:err.message}); res.json({id:this.lastID,title:t,pos}); });});});
app.get('/cards',(req,res)=>db.all("SELECT * FROM cards ORDER BY pos",(e,r)=>e?res.status(500).json({error:e.message}):res.json(r)));
app.post('/cards',(req,res)=>{ const {list_id,title,description} = req.body; if(!list_id||!title) return res.status(400).json({error:'missing'}); db.get("SELECT COALESCE(MAX(pos),0) m FROM cards WHERE list_id=?",[list_id],(e,r)=>{const pos=(r.m||0)+100; db.run("INSERT INTO cards(list_id,title,description,pos) VALUES(?,?,?,?)",[list_id,title,description||'',pos],function(err){ if(err) return res.status(500).json({error:err.message}); res.json({id:this.lastID,list_id,title,description,pos}); });});});
app.put('/cards/:id',(req,res)=>{ const {title,description,list_id,pos}=req.body; db.run("UPDATE cards SET title=?,description=?,list_id=COALESCE(?,list_id),pos=COALESCE(?,pos) WHERE id=?", [title||'',description||'',list_id||null,pos||null,req.params.id], function(err){ if(err) return res.status(500).json({error:err.message}); if(this.changes===0) return res.status(404).json({error:'not found'}); res.json({success:true}); });});
app.delete('/cards/:id',(req,res)=>db.run("DELETE FROM cards WHERE id=?", [req.params.id], function(err){ if(err) return res.status(500).json({error:err.message}); res.json({success:true}); }));
app.listen(PORT,()=>console.log('REST API running http://localhost:'+PORT));
