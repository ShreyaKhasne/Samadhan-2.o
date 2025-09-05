// save as tasks-filejson.js
const express=require('express'), fs=require('fs'), path=require('path');
const app=express(), PORT=4002, DATA=path.join(__dirname,'board.json');
app.use(express.json());
if(!fs.existsSync(DATA)) fs.writeFileSync(DATA,JSON.stringify({lists:[{id:1,title:'To Do',pos:100},{id:2,title:'Doing',pos:200},{id:3,title:'Done',pos:300}],cards:[]},null,2));
function read(){return JSON.parse(fs.readFileSync(DATA));}
function write(d){fs.writeFileSync(DATA,JSON.stringify(d,null,2));}
app.get('/api/board',(req,res)=>res.json(read()));
app.post('/api/lists',(req,res)=>{const d=read();const id=(d.lists.reduce((m,l)=>Math.max(m,l.id),0)||0)+1;const pos=(d.lists.reduce((m,l)=>Math.max(m,l.pos),0)||0)+100; d.lists.push({id,title:req.body.title||'Untitled',pos}); write(d); res.json({id});});
app.post('/api/cards',(req,res)=>{const d=read();const id=(d.cards.reduce((m,c)=>Math.max(m,c.id),0)||0)+1; const pos=(d.cards.filter(c=>c.list_id==req.body.list_id).reduce((m,c)=>Math.max(m,c.pos),0)||0)+100; d.cards.push({id,list_id:req.body.list_id,title:req.body.title||'Card',description:req.body.description||'',pos}); write(d); res.json({id});});
app.put('/api/cards/:id/move',(req,res)=>{const d=read();const c=d.cards.find(x=>x.id==req.params.id); if(!c) return res.status(404).json({error:'not found'}); c.list_id=req.body.to_list_id; c.pos=req.body.to_pos||c.pos; write(d); res.json({success:true});});
app.get('/',(req,res)=>res.sendFile(path.join(__dirname,'index.html')));
const index=`<!doctype html><html><body><h3>File JSON Task App</h3><p>Call /api/board to view data.</p></body></html>`;
fs.writeFileSync(path.join(__dirname,'index.html'),index);
app.listen(PORT,()=>console.log('File JSON app http://localhost:'+PORT));
