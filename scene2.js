'use strict';
// Actors use normalized world positions; the camera projects them into the viewport.
const forest={phase:'choose',hero:{x:.5,y:.79,hp:100},mobs:[],target:null,start:0,round:0,events:new Set(),numbers:[],loot:null,upgraded:false};
const forestControls=document.createElement('div');forestControls.id='forest-controls';document.querySelector('#controls').append(forestControls);
const mobButtons=['boar','wolf','bear'].map(name=>{const b=document.createElement('button');b.className='portal-key';b.setAttribute('aria-label','Атаковать '+name);b.onclick=()=>selectMob(name);forestControls.append(b);return b});
const lootButton=document.createElement('button');lootButton.className='portal-key';lootButton.setAttribute('aria-label','UPGRADE — взять меч');lootButton.onclick=takeSword;forestControls.append(lootButton);
forestControls.hidden=true;
const camera={x:0,y:0,ready:false};
function updateCamera(dt){
 const desiredX=Math.max(-.12,Math.min(.12,forest.hero.x-.5));
 const desiredY=Math.max(-.16,Math.min(.16,forest.hero.y-(width>height?.75:.62)));
 const blend=camera.ready?1-Math.exp(-dt*7):1;
 camera.x+=(desiredX-camera.x)*blend;camera.y+=(desiredY-camera.y)*blend;camera.ready=true;
}
function screenPoint(x,y){return {x:(x-camera.x)*width,y:(y-camera.y)*height}}
function unit(){return Math.min(width,height)}
function startForest(){
 camera.ready=false;
 buttons.forEach(b=>b.hidden=true);next.hidden=true;forestControls.hidden=false;
 Object.assign(forest,{phase:'choose',hero:{x:.5,y:.79,hp:100},target:null,start:clock,round:0,events:new Set(),numbers:[],loot:null,upgraded:false});
 forest.mobs=['boar','wolf','bear'].map((name,i)=>({name,x:[.24,.5,.76][i],y:[.43,.53,.4][i],homeX:[.24,.5,.76][i],homeY:[.43,.53,.4][i],hp:100,alive:true,seed:i*2.1,dir:'left',walking:false,deadAt:null}));
 hint.textContent='Нажмите на врага';canvas.setAttribute('aria-label','Лесная поляна: boar, wolf, bear');
}
function selectMob(name){
 if(forest.phase!=='choose')return;
 const m=forest.mobs.find(m=>m.name===name&&m.alive);if(!m)return;
 forest.target=m;forest.phase='approach';forest.start=clock;forest.from={...forest.hero};
 const side=m.x<.4?1:-1;forest.side=side;
 const gap=unit()*.19/width;
 forest.destination={x:m.x+side*gap,y:m.y};
 forest.travel=Math.max(.5,Math.hypot((forest.from.x-forest.destination.x)*width,(forest.from.y-m.y)*height)/(unit()*.45));
 hint.textContent='';status.textContent='';
}
function damageNumber(x,y,text,color){forest.numbers.push({x,y,text,color,time:clock})}
function beginFight(){forest.phase='fight';forest.start=clock;forest.events.clear();forest.round=0}
function takeSword(){
 if(forest.phase!=='loot')return;
 forest.phase='collect';forest.start=clock;forest.from={...forest.hero};
 forest.destination={x:forest.loot.x,y:forest.loot.y};
 forest.travel=Math.max(.5,Math.hypot((forest.from.x-forest.loot.x)*width,(forest.from.y-forest.loot.y)*height)/(unit()*.45));hint.textContent='';
}
function drawCover(path){
 const im=images.get(path),worldWidth=width*1.24,worldHeight=height*1.32;
 const s=Math.max(worldWidth/im.width,worldHeight/im.height);
 ctx.drawImage(im,(width-im.width*s)/2,(height-im.height*s)/2,im.width*s,im.height*s);
}
function sprite(folder,x,y,size,elapsed=clock,fps=12,once=false){
 const frames=SEQUENCES[folder];if(!frames)return;
 const n=once?Math.min(frames.length-1,Math.floor(Math.max(0,elapsed)*fps)):Math.floor(Math.max(0,elapsed)*fps)%frames.length;
 const im=images.get(frames[n]);if(!im)return;
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(im,x-im.width*size/2,y-im.height*size,im.width*size,im.height*size);ctx.restore();
}
function bar(x,y,hp,total,color,label=''){
 const w=unit()*.16,h=Math.max(6,unit()*.018);
 ctx.save();ctx.fillStyle='#111e';ctx.fillRect(x-w/2-2,y-2,w+4,h+4);ctx.fillStyle='#503535';ctx.fillRect(x-w/2,y,w,h);ctx.fillStyle=color;ctx.fillRect(x-w/2,y,w*Math.max(0,hp/total),h);
 ctx.font=`bold ${Math.max(13,unit()*.037)}px system-ui`;ctx.textAlign='center';ctx.fillStyle='white';ctx.strokeStyle='#142212';ctx.lineWidth=3;
 if(label){ctx.strokeText(label,x,y-7);ctx.fillText(label,x,y-7)}ctx.restore();
}
function arrow(x,tip,size=unit()*.068){
 const bounce=(Math.sin(clock*5)+1)*size*.12;
 ctx.save();ctx.translate(x,tip-size-bounce);ctx.shadowColor='#ffe66b';ctx.shadowBlur=10;ctx.fillStyle='#ffe36b';ctx.strokeStyle='#69400a';ctx.lineWidth=2;
 ctx.beginPath();ctx.moveTo(-size*.16,0);ctx.lineTo(size*.16,0);ctx.lineTo(size*.16,size*.5);ctx.lineTo(size*.43,size*.5);ctx.lineTo(0,size);ctx.lineTo(-size*.43,size*.5);ctx.lineTo(-size*.16,size*.5);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
}
function drawSword(x,y,size,alpha=1){
 const im=images.get('assets/loot/sword.png');
 const pulse=1+Math.sin(clock*4)*.07;
 ctx.save();ctx.translate(x,y);ctx.rotate(-.23);ctx.globalAlpha=alpha;
 ctx.scale(.45+.55*alpha,.45+.55*alpha);
 const glow=ctx.createRadialGradient(0,0,size*.08,0,0,size*.68);
 glow.addColorStop(0,'#e3a4ff99');glow.addColorStop(.5,'#ae3dff55');glow.addColorStop(1,'#9226ff00');
 ctx.fillStyle=glow;ctx.beginPath();ctx.ellipse(0,0,size*.72*pulse,size*.45*pulse,0,0,Math.PI*2);ctx.fill();
 ctx.shadowColor='#c14dff';ctx.shadowBlur=size*.20*pulse;ctx.imageSmoothingEnabled=false;
 // Exclude transparent padding without modifying the supplied PNG.
 const w=size*1.15,h=w*127/337;
 ctx.drawImage(im,0,78,337,127,-w/2,-h/2,w,h);ctx.restore();
}
function updateForest(dt){
 const f=forest,t=clock-f.start;
 if(f.phase==='choose')f.mobs.forEach(m=>{
  if(!m.alive)return;
  const cycle=(clock+m.seed)%5;m.walking=cycle<3;
  if(m.walking){const old=m.x;m.x=m.homeX+Math.sin(clock*.9+m.seed)*.045;m.y=m.homeY+Math.sin(clock*.65+m.seed)*.025;m.dir=m.x>old?'right':'left'}
 });
 if(f.phase==='approach'||f.phase==='collect'){
  const a=Math.min(t/f.travel,1);f.hero.x=f.from.x+(f.destination.x-f.from.x)*a;f.hero.y=f.from.y+(f.destination.y-f.from.y)*a;
  if(a===1){if(f.phase==='approach')beginFight();else{f.phase='absorb';f.start=clock}}
 }
 if(f.phase==='fight'){
  const fightTime=clock-f.start,round=Math.min(2,Math.floor(fightTime/1.2)),age=fightTime-round*1.2;f.round=round;
  if(age>=.35&&!f.events.has('hero'+round)){
   f.events.add('hero'+round);const dealt=round===0?34:33;f.target.hp-=dealt;damageNumber(f.target.x,f.target.y, '-'+dealt,'#ffe978');
  }
  if(age>=.78&&!f.events.has('mob'+round)){
   f.events.add('mob'+round);const damage=1+Math.floor(Math.random()*10);f.hero.hp-=damage;damageNumber(f.hero.x,f.hero.y,'-'+damage,'#ffb9b9');
  }
  if(fightTime>=3.6){f.target.alive=false;f.target.deadAt=clock;f.phase='death';f.start=clock}
 }
 if(f.phase==='death'&&clock-f.start>=.75){
  if(f.mobs.some(m=>m.alive)){f.phase='choose';hint.textContent='Выберите следующего врага'}
  else{f.phase='loot';f.loot={x:f.target.x,y:f.target.y};hint.textContent='Заберите новый меч'}
 }
 if(f.phase==='absorb'&&clock-f.start>=.55){f.loot=null;f.upgraded=true;f.phase='show';f.start=clock;hint.textContent='UPGRADE!';status.textContent='Новое оружие получено'}
 if(f.phase==='show'&&clock-f.start>=28/24){f.phase='complete';hint.textContent='';status.textContent='';}
 f.numbers=f.numbers.filter(n=>clock-n.time<1);
}
function forestFrame(dt){
 updateForest(dt);updateCamera(document.hidden?0:dt);const f=forest,u=unit(),heroScale=u*.16/37;
 ctx.save();ctx.translate(-camera.x*width,-camera.y*height);drawCover('assets/scene2/scene2_back.png');
 const objects=f.mobs.filter(m=>m.alive||(m.deadAt!==null&&clock-m.deadAt<.75)).map(m=>({y:m.y,m}));objects.push({y:f.hero.y,hero:true});objects.sort((a,b)=>a.y-b.y);
 objects.forEach(o=>{
  if(o.hero){
   let folder='assets/char/i_s_d',elapsed=clock,fps=24,once=false;
   const moving=['approach','collect'].includes(f.phase),combat=f.phase==='fight';
   if(moving){const dx=f.destination.x-f.from.x,dy=f.destination.y-f.from.y;folder='assets/char/m_s_'+(Math.abs(dx*width)>Math.abs(dy*height)?(dx>0?'r':'l'):(dy>0?'d':'u'))}
   if(combat){const dir=f.side<0?'r':'l';folder='assets/char/'+(f.round%2===0?'ap_r,s_':'ah_s,r_')+dir;elapsed=(clock-f.start)%1.2;once=true}
   if(f.upgraded){folder='assets/char_up/'+(f.phase==='show'?'at_b_d':'i_b_d');elapsed=f.phase==='show'?clock-f.start:clock;once=f.phase==='show'}
   sprite(folder,f.hero.x*width,f.hero.y*height,heroScale,elapsed,fps,once);
   bar(f.hero.x*width,f.hero.y*height-u*.23,f.hero.hp,100,'#5ee367');
  }else{
   const m=o.m,isTarget=m===f.target&&['fight','death'].includes(f.phase),dir=isTarget?(f.side<0?'left':'right'):m.dir;
   let action=m.walking?'walk':'stand',elapsed=clock,once=false,x=m.x*width;
   if(!m.alive){action='die';elapsed=clock-m.deadAt;once=true}
   else if(isTarget&&f.phase==='fight'){
    const age=(clock-f.start)%1.2;
    if(age>=.35&&age<.55)action='damage';
    else if(age>=.60&&age<.95){action=m.name==='wolf'?'a-sk':'walk';x+=(f.side<0?-1:1)*Math.sin((age-.60)/.35*Math.PI)*u*.035}
    else action='stand';
   }
   sprite(`assets/scene2/${m.name}_enemy/${action}-${dir}`,x,m.y*height,u*.0028*(m.name==='bear'?1.12:1),elapsed,8,once);
   if(m.alive){bar(m.x*width,m.y*height-u*.155,m.hp,100,'#f04a50',m.name);if(f.phase==='choose')arrow(m.x*width,m.y*height-u*.24)}
  }
 });
 if(f.loot){
  let x=f.loot.x*width,y=f.loot.y*height-u*.06,a=1;
  if(f.phase==='absorb'){const t=Math.min((clock-f.start)/.55,1);x+=(f.hero.x*width-x)*t;y+=(f.hero.y*height-u*.09-y)*t;a=1-t}
  drawSword(x,y,u*.28,a);
  if(f.phase==='loot'){arrow(x,y-u*.11);ctx.save();ctx.textAlign='center';ctx.font=`900 ${Math.max(18,u*.052)}px system-ui`;ctx.fillStyle='#e8b9ff';ctx.strokeStyle='#3a115d';ctx.lineWidth=4;ctx.strokeText('UPGRADE',x,y-u*.23);ctx.fillText('UPGRADE',x,y-u*.23);ctx.restore()}
 }
 if(['absorb','show'].includes(f.phase)){
  const t=clock-f.start,fade=f.phase==='absorb'?1:Math.max(0,1-t/1.16);const x=f.hero.x*width,y=f.hero.y*height-u*.09;
  ctx.save();ctx.globalAlpha=fade;const g=ctx.createRadialGradient(x,y,0,x,y,u*.32);g.addColorStop(0,'#fff9');g.addColorStop(.35,'#db8cff88');g.addColorStop(1,'#9626ff00');ctx.fillStyle=g;ctx.fillRect(x-u*.32,y-u*.32,u*.64,u*.64);
  for(let i=0;i<18;i++){const angle=i*Math.PI*2/18+clock*.5,r=u*(.10+t*.16);ctx.fillStyle=i%2?'#ffe998':'#d3a1ff';ctx.beginPath();ctx.arc(x+Math.cos(angle)*r,y+Math.sin(angle)*r,2+i%3,0,Math.PI*2);ctx.fill()}ctx.restore();
 }
 f.numbers.forEach(n=>{const age=clock-n.time;ctx.save();ctx.globalAlpha=1-age;ctx.textAlign='center';ctx.font=`900 ${Math.max(18,u*.065)}px system-ui`;ctx.fillStyle=n.color;ctx.strokeStyle='#252025';ctx.lineWidth=4;const y=n.y*height-u*.22-age*u*.10;ctx.strokeText(n.text,n.x*width,y);ctx.fillText(n.text,n.x*width,y);ctx.restore()});
 ctx.restore();
 mobButtons.forEach((b,i)=>{const m=f.mobs[i];b.hidden=!m?.alive;b.disabled=f.phase!=='choose';if(m){const p=screenPoint(m.x,m.y);Object.assign(b.style,{left:(p.x-u*.1)+'px',top:(p.y-u*.13)+'px',width:u*.2+'px',height:u*.16+'px'})}});
 lootButton.hidden=f.phase!=='loot';lootButton.disabled=f.phase!=='loot';if(f.loot){const p=screenPoint(f.loot.x,f.loot.y);Object.assign(lootButton.style,{left:(p.x-u*.17)+'px',top:(p.y-u*.19)+'px',width:u*.34+'px',height:u*.25+'px'})};
}
