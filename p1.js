const C=document.getElementById('c'),X=C.getContext('2d');
X.imageSmoothingEnabled=false;
const W=640,H=360;
const dirt=document.createElement('canvas'); dirt.width=W; dirt.height=H;
const DX=dirt.getContext('2d');
const mask=new Uint8Array(W*H);
const keys={},just={},hold={};
const WEAPONS=[
  {id:'obusek',name:'OBUSEK',v:0,g:0,life:2,dmg:18,r:7,reload:18,spread:0,n:1,melee:1},
  {id:'lahev',name:'LAHEV',v:6.2,g:.18,life:90,dmg:28,r:18,reload:38,spread:.08,n:1},
  {id:'pantofel',name:'PANTOFEL',v:5.1,g:.12,life:70,dmg:16,r:10,reload:22,spread:.04,n:1},
  {id:'rec',name:'REC',v:3.4,g:.02,life:55,dmg:9,r:14,reload:16,spread:.2,n:3}
];
let state='title',t=0,winner='',shake=0;
let worms=[],shots=[],fx=[],cam=0;
function fit(){
  const wrap=document.getElementById('wrap');
  const vw=visualViewport?visualViewport.width:innerWidth;
  const vh=visualViewport?visualViewport.height:innerHeight;
  const s=Math.min(vw/W,vh/H);
  wrap.style.width=Math.floor(W*s)+'px';
  wrap.style.height=Math.floor(H*s)+'px';
}
addEventListener('resize',fit); if(visualViewport) visualViewport.addEventListener('resize',fit); fit();
addEventListener('keydown',e=>{if(!keys[e.code])just[e.code]=1;keys[e.code]=1;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault()});
addEventListener('keyup',e=>keys[e.code]=0);
document.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});
document.addEventListener('contextmenu',e=>e.preventDefault());
const map={L:'btnL',R:'btnR',U:'btnU',D:'btnD',J:'btnJ',F:'btnF',W:'btnW'};
function bindPad(){
  Object.entries(map).forEach(([k,id])=>{
    const el=document.getElementById(id);
    const on=e=>{e.preventDefault();hold[k]=1;if(k==='F'||k==='J'||k==='W')just['pad'+k]=1};
    const off=e=>{e.preventDefault();hold[k]=0};
    el.addEventListener('pointerdown',on); el.addEventListener('pointerup',off);
    el.addEventListener('pointercancel',off); el.addEventListener('pointerleave',off);
  });
}
bindPad();
function wantL(){return keys.ArrowLeft||hold.L}
function wantR(){return keys.ArrowRight||hold.R}
function wantU(){return keys.ArrowUp||hold.U}
function wantD(){return keys.ArrowDown||hold.D}
function wantJ(){return keys.KeyZ||keys.Space||hold.J||just.padJ}
function wantF(){return keys.KeyX||keys.ControlLeft||hold.F||just.padF}
function wantW(){return just.KeyC||just.padW}
function solid(x,y){
  const ix=x|0, iy=y|0;
  if(ix<0||iy<0||ix>=W||iy>=H) return 1;
  return mask[iy*W+ix];
}
function carve(x,y,r){
  DX.globalCompositeOperation='destination-out';
  DX.beginPath(); DX.arc(x,y,r,0,6.29); DX.fill();
  DX.globalCompositeOperation='source-over';
  const R=r|0;
  for(let yy=-R; yy<=R; yy++){
    for(let xx=-R; xx<=R; xx++){
      if(xx*xx+yy*yy<=r*r){
        const px=(x|0)+xx, py=(y|0)+yy;
        if(px>=0&&py>=0&&px<W&&py<H) mask[py*W+px]=0;
      }
    }
  }
  for(let i=0;i<10;i++) fx.push({x,y,vx:(Math.random()-.5)*3,vy:-Math.random()*3,life:18+Math.random()*12,col:'#6a4a28'});
}
function buildMap(){
  DX.clearRect(0,0,W,H);
  const g=DX.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'#1a1230'); g.addColorStop(1,'#3a2a18');
  DX.fillStyle=g; DX.fillRect(0,0,W,H);
  DX.fillStyle='#2a1c12';
  DX.fillRect(0,H-28,W,28);
  for(let i=0;i<18;i++){
    const cx=40+i*34, cy=H-10-(i%3)*8, r=22+(i%4)*6;
    DX.beginPath(); DX.ellipse(cx,cy,r,16+(i%3)*5,0,0,6.29); DX.fill();
  }
  const caves=[[120,210,70,40],[260,160,90,50],[420,200,80,46],[540,150,70,40],[80,90,50,28],[330,70,60,24],[500,80,55,26]];
  DX.globalCompositeOperation='destination-out';
  caves.forEach(([x,y,w,h])=>{DX.beginPath();DX.ellipse(x,y,w,h,0,0,6.29);DX.fill()});
  DX.fillRect(0,40,W,70);
  DX.globalCompositeOperation='source-over';
  const img=DX.getImageData(0,0,W,H).data;
  for(let i=0;i<W*H;i++) mask[i]=img[i*4+3]>20?1:0;
}
function worm(kind,x,y,ai){
  const skins={
    tata:{col:'#2b5ad0',cap:'#1e3c9a',name:'PREPOLICIK'},
    punk:{col:'#1a8a20',cap:'#111',name:'PUNK'},
    bezdak:{col:'#6a5a38',cap:'#888',name:'BEZDAK'},
    mama:{col:'#8b3a8b',cap:'#4a2030',name:'MAMINKA'}
  };
  const s=skins[kind];
  return {kind,name:s.name,col:s.col,cap:s.cap,x,y,vx:0,vy:0,face:1,ang:-.4,hp:100,dead:0,reload:0,wpn:ai?1:0,ai,jump:0,t:Math.random()*40};
}
function spawnAll(){
  worms=[
    worm('tata',90,80,0),
    worm('punk',540,80,1),
    worm('bezdak',300,50,1),
    worm('mama',470,220,1)
  ];
  shots=[]; fx=[]; winner='';
}
function boom(x,y,r,dmg,owner){
  carve(x,y,r);
  shake=Math.min(10,shake+r/3);
  worms.forEach(w=>{
    if(w.dead||w===owner) return;
    const dx=w.x-x, dy=w.y-y, d=Math.hypot(dx,dy);
    if(d<r+8){
      const k=1-d/(r+8);
      w.hp-=dmg*k;
      w.vx+= (dx||1)/Math.max(1,d)*2.4*k;
      w.vy-=2*k;
      if(w.hp<=0) kill(w);
    }
  });
}
function kill(w){
  w.dead=1; w.hp=0;
  for(let i=0;i<16;i++) fx.push({x:w.x,y:w.y,vx:(Math.random()-.5)*4,vy:-Math.random()*4,life:22,col:w.col});
  const live=worms.filter(a=>!a.dead);
  if(live.length===1){ winner=live[0].name; state='end'; }
  else if(!live.some(a=>!a.ai)){ winner='ULICE'; state='end'; }
}
function fire(w){
  const wp=WEAPONS[w.wpn];
  if(w.reload>0||w.dead) return;
