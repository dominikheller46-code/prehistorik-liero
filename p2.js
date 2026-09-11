w.reload=wp.reload;
if(wp.melee){
  const hx=w.x+Math.cos(w.ang)*14*w.face;
  const hy=w.y+Math.sin(w.ang)*10-6;
  boom(hx,hy,wp.r,wp.dmg,w);
  return;
}
for(let i=0;i<wp.n;i++){
  const a=w.ang+(Math.random()-.5)*wp.spread;
  shots.push({
    x:w.x+Math.cos(a)*8*w.face, y:w.y+Math.sin(a)*6-8,
    vx:Math.cos(a)*wp.v*(w.face), vy:Math.sin(a)*wp.v,
    g:wp.g, life:wp.life, dmg:wp.dmg, r:wp.r, owner:w, col: wp.id==='rec'?'#f0e0a0':wp.id==='pantofel'?'#c8b090':'#4a9a3a'
  });
}
}
function think(w){
  w.t++;
  const me=worms[0];
  if(me.dead) return;
  const dx=me.x-w.x, dy=me.y-w.y;
  if(Math.abs(dx)>18) w.face=dx>0?1:-1;
  const target=Math.atan2(dy-6, Math.abs(dx)+.1);
  w.ang += (target-w.ang)*.08;
  if(Math.abs(dx)>26) w.vx += w.face*.08;
  if(w.t%40===0 && solid(w.x, w.y+10) && Math.random()<.6) w.vy=-4.6;
  if(Math.hypot(dx,dy)<220 && w.reload<=0 && Math.random()<.08) fire(w);
  if(w.t%90===0) w.wpn=1+((w.t/90)|0)%3;
}
function stepWorm(w){
  if(w.dead) return;
  if(w.reload>0) w.reload--;
  if(!w.ai){
    if(wantL()){ w.vx-=.14; w.face=-1; }
    if(wantR()){ w.vx+=.14; w.face=1; }
    if(wantU()) w.ang-=.07;
    if(wantD()) w.ang+=.07;
    w.ang=Math.max(-1.45, Math.min(1.2, w.ang));
    if(wantJ() && solid(w.x, w.y+9)) w.vy=-4.8;
    if(wantF()) fire(w);
    if(wantW()) w.wpn=(w.wpn+1)%WEAPONS.length;
  } else think(w);
  w.vy+=.18;
  w.vx*=.86;
  let nx=w.x+w.vx, ny=w.y+w.vy;
  if(solid(nx,w.y)) { nx=w.x; w.vx*=-.2; }
  if(solid(w.x,ny+7) && w.vy>0){ ny=w.y; w.vy=0; }
  if(solid(w.x,ny-8) && w.vy<0){ ny=w.y; w.vy=0; }
  w.x=Math.max(8,Math.min(W-8,nx));
  w.y=Math.max(12,Math.min(H-10,ny));
}
function stepShot(s){
  s.vy+=s.g; s.x+=s.vx; s.y+=s.vy; s.life--;
  if(s.x<0||s.x>W||s.y<0||s.y>H||s.life<=0){ s.dead=1; return; }
  if(solid(s.x,s.y)){ boom(s.x,s.y,s.r,s.dmg,s.owner); s.dead=1; return; }
  for(const w of worms){
    if(w.dead||w===s.owner) continue;
    if(Math.hypot(w.x-s.x,w.y-8-s.y)<10){ boom(s.x,s.y,s.r,s.dmg,s.owner); s.dead=1; return; }
  }
}
function update(){
  t++; if(shake>0) shake--;
  if(state!=='play') return;
  worms.forEach(stepWorm);
  shots.forEach(stepShot);
  shots=shots.filter(s=>!s.dead);
  fx.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.15;p.life--});
  fx=fx.filter(p=>p.life>0);
}
function drawWorm(w){
  if(w.dead) return;
  X.save(); X.translate(w.x,w.y);
  X.fillStyle='rgba(0,0,0,.35)'; X.beginPath(); X.ellipse(0,8,8,3,0,0,6.29); X.fill();
  X.fillStyle=w.col; X.fillRect(-6,-2,12,10);
  X.fillStyle='#e0b08a'; X.fillRect(-5,-10,10,9);
  X.fillStyle=w.cap; X.fillRect(-6,-14,12,5);
  X.fillStyle='#c9a227'; X.fillRect(-2,-13,4,3);
  const a=w.ang;
  X.strokeStyle='#f0c040'; X.lineWidth=2;
  X.beginPath(); X.moveTo(0,-6); X.lineTo(Math.cos(a)*16*w.face, -6+Math.sin(a)*14); X.stroke();
  X.restore();
  X.fillStyle='#111'; X.fillRect(w.x-10,w.y-20,20,3);
  X.fillStyle=w.hp>40?'#4c4':(w.hp>18?'#cc4':'#c33');
  X.fillRect(w.x-10,w.y-20,20*(w.hp/100),3);
}
function render(){
  X.save();
  if(shake) X.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
  const sky=X.createLinearGradient(0,0,0,H);
  sky.addColorStop(0,'#12081c'); sky.addColorStop(1,'#1c1430');
  X.fillStyle=sky; X.fillRect(0,0,W,H);
  X.fillStyle='#ffe9a0';
  for(let i=0;i<20;i++) X.fillRect((i*73)%W,(i*37)%90,2,2);
  X.drawImage(dirt,0,0);
  shots.forEach(s=>{ X.fillStyle=s.col; X.fillRect(s.x-2,s.y-2,4,4); });
  fx.forEach(p=>{ X.globalAlpha=Math.max(0,p.life/22); X.fillStyle=p.col; X.fillRect(p.x,p.y,2,2); X.globalAlpha=1; });
  worms.forEach(drawWorm);
  X.fillStyle='rgba(8,6,14,.82)'; X.fillRect(0,0,W,28);
  X.fillStyle='#f0c040'; X.font='11px ui-monospace';
  const me=worms[0];
  if(me) X.fillText(WEAPONS[me.wpn].name+'  HP '+Math.max(0,me.hp|0), 10, 18);
  X.fillText('PREHISTORIK LIERO', 430, 18);
  if(state==='title'){
    X.fillStyle='rgba(0,0,0,.55)'; X.fillRect(0,0,W,H);
    X.textAlign='center';
    X.fillStyle='#f0c040'; X.font='28px ui-monospace'; X.fillText('PREHISTORIK',W/2,90);
    X.fillStyle='#e8e0ff'; X.font='16px ui-monospace'; X.fillText('LIERO  NOCNI PRAHA',W/2,120);
    X.fillStyle='#c9b48a'; X.font='11px ui-monospace';
    X.fillText('Realtime worms. Zadne tahy.',W/2,170);
    X.fillText('Chodis, miris, strilis. Diry v zemi zustanou.',W/2,190);
    X.fillText('OBUSEK  LAHEV  PANTOFEL  REC',W/2,220);
    X.fillStyle=t%40<24?'#fff':'#f0c040'; X.font='13px ui-monospace';
    X.fillText('PAL = START',W/2,280);
    X.textAlign='left';
  }
  if(state==='end'){
    X.fillStyle='rgba(0,0,0,.6)'; X.fillRect(0,0,W,H);
    X.textAlign='center';
    X.fillStyle='#f0c040'; X.font='22px ui-monospace';
    X.fillText(winner==='ULICE'?'ULICE VYHRALA':winner+' ZIJE',W/2,150);
    X.fillStyle='#fff'; X.font='12px ui-monospace';
    X.fillText('PAL = ZNOVU',W/2,210);
    X.textAlign='left';
  }
  X.restore();
}
function loop(){
  if(state==='title' && (wantF()||just.Space||just.padF)){ buildMap(); spawnAll(); state='play'; }
  else if(state==='end' && (wantF()||just.Space||just.padF)){ buildMap(); spawnAll(); state='play'; }
  update(); render();
  for(const k in just) just[k]=0;
  requestAnimationFrame(loop);
}
buildMap(); loop();
