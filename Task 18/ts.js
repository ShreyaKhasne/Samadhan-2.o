// save as tasks-fullstack-react.js
const express=require('express'), sqlite3=require('sqlite3').verbose(), path=require('path');
const app=express(), PORT=4004;
app.use(express.json());
const db=new sqlite3.Database(path.join(__dirname,'tasks-react.db'));
db.serialize(()=>{ db.run("CREATE TABLE IF NOT EXISTS lists(id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT,pos INTEGER)"); db.run("CREATE TABLE IF NOT EXISTS cards(id INTEGER PRIMARY KEY AUTOINCREMENT,list_id INTEGER,title TEXT,description TEXT,pos INTEGER)"); db.get("SELECT COUNT(*) c FROM lists",(e,r)=>{ if(!e && r.c===0){ db.run("INSERT INTO lists(title,pos) VALUES('Todo',100)"); db.run("INSERT INTO lists(title,pos) VALUES('Doing',200)"); db.run("INSERT INTO lists(title,pos) VALUES('Done',300)"); } }); });
app.get('/api/board',(req,res)=>{ db.all("SELECT * FROM lists ORDER BY pos",(e,l)=>{ db.all("SELECT * FROM cards ORDER BY pos",(er,c)=>res.json({lists:l,cards:c})); }); });
app.post('/api/cards',(req,res)=>{ const {list_id,title}=req.body; db.get("SELECT COALESCE(MAX(pos),0) m FROM cards WHERE list_id=?",[list_id],(e,r)=>{ const pos=(r.m||0)+100; db.run("INSERT INTO cards(list_id,title,pos) VALUES(?,?,?)",[list_id,title,pos],function(err){ res.json({id:this.lastID}); }); }); });
app.put('/api/cards/:id/move',(req,res)=>db.run("UPDATE cards SET list_id=?,pos=? WHERE id=?",[req.body.to_list_id,req.body.to_pos,req.params.id], function(err){ res.json({success:true}); }));
app.get('/',(req,res)=>res.send(`<!doctype html><html><head><meta charset="utf-8"/><title>Tasks React UI</title><script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script><script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script></head><body><div id="root"></div><script>
const e=React.createElement;
function App(){ const [board,setBoard]=React.useState({lists:[],cards:[]}); React.useEffect(()=>fetch('/api/board').then(r=>r.json()).then(setBoard),[]); return e('div',{}, e('h2',{},'Simple Kanban'), e('div', {style:{display:'flex',gap:12}}, board.lists.map(l=> e('div',{key:l.id, style:{minWidth:200,background:'#f3f4f6',padding:8,borderRadius:6}}, e('h3',{},l.title), board.cards.filter(c=>c.list_id===l.id).map(c=> e('div',{key:c.id, style:{background:'#fff',padding:8,marginBottom:8,borderRadius:6}}, e('strong',{},c.title))), e('input',{placeholder:'Card title', id:'i'+l.id}), e('button',{onClick:()=>{ const v=document.getElementById('i'+l.id).value; if(!v) return; fetch('/api/cards',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({list_id:l.id,title:v})}).then(()=>fetch('/api/board').then(r=>r.json()).then(setBoard)); }} ,'Add')) )) ); }
ReactDOM.createRoot(document.getElementById('root')).render(e(App));
</script></body></html>`));
app.listen(PORT,()=>console.log('Fullstack React-like http://localhost:'+PORT));
