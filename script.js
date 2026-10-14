(()=>{
const $=(s,c=document)=>c.querySelector(s),$$=(s,c=document)=>[...c.querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine=matchMedia('(hover: hover) and (pointer: fine)').matches;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

/* ---------- nav menu ---------- */
const menu=$('#menu'),nav=$('#navlinks');
menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.textContent=open?'Close −':'Menu +'});
$$('a',nav).forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.textContent='Menu +'}));
$('#year').textContent=new Date().getFullYear();

/* ---------- word-by-word heading split ---------- */
function splitWords(el){
  let i=0;
  (function walk(n){
    [...n.childNodes].forEach(c=>{
      if(c.nodeType===3){
        const f=document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach(t=>{
          if(!t)return;
          if(/^\s+$/.test(t)){f.appendChild(document.createTextNode(' '));return}
          const w=document.createElement('span');w.className='w';
          const wi=document.createElement('span');wi.className='wi';wi.style.setProperty('--i',i++);wi.textContent=t;
          w.appendChild(wi);f.appendChild(w);
        });
        c.replaceWith(f);
      }else if(c.nodeType===1&&c.tagName!=='BR')walk(c);
    });
  })(el);
}
$$('.section-head h2,.contact-card h2,.manifesto').forEach(el=>{
  el.setAttribute('aria-label',el.textContent.replace(/\s+/g,' ').trim());
  splitWords(el);
});

/* ---------- marquee clone ---------- */
const mq=$('#marquee'),g=mq.firstElementChild;
g.innerHTML+=g.innerHTML;mq.appendChild(g.cloneNode(true));

/* ---------- stagger delays ---------- */
[['.project-grid .project',110],['.values .value',110],['.timeline .timeline-item',100]].forEach(([sel,step])=>{
  $$(sel).forEach((el,i)=>{ if(matchMedia('(min-width:801px)').matches||sel.includes('timeline')) el.style.setProperty('--d',(i%(sel.includes('project')?2:4))*step+'ms') });
});

/* ---------- reveal on scroll ---------- */
const reveal=el=>{
  el.classList.add('visible');
  if(el.classList.contains('project')){setTimeout(()=>el.classList.add('settled'),1100)}
};
if('IntersectionObserver' in window){
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){reveal(e.target);io.unobserve(e.target)}}),{threshold:.12});
  $$('.reveal').forEach(el=>io.observe(el));
}else $$('.reveal').forEach(reveal);

/* ---------- scroll progress, AF parallax, active nav ---------- */
const bar=$('#progress'),card=$('.contact-card');let ticking=false;
function onScroll(){
  ticking=false;
  const h=document.documentElement,max=h.scrollHeight-innerHeight;
  bar.style.transform=`scaleX(${max>0?clamp(scrollY/max,0,1):0})`;
  if(!reduce){const r=card.getBoundingClientRect();card.style.setProperty('--af',(r.top*-.1).toFixed(1))}
}
addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(onScroll)}},{passive:true});
onScroll();
if('IntersectionObserver' in window){
  const so=new IntersectionObserver(es=>es.forEach(e=>{
    if(e.isIntersecting){$$('a',nav).forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+e.target.id))}
  }),{rootMargin:'-45% 0px -50% 0px'});
  $$('section[id]').forEach(s=>so.observe(s));
}

/* ---------- hero network canvas ---------- */
const cv=$('#net'),cx=cv.getContext('2d'),hb=$('.hero-bg');
let W=0,H=0,pts=[],dpr=Math.min(devicePixelRatio||1,2),running=true,m={x:-999,y:-999},raf=0;
function size(){
  const r=hb.getBoundingClientRect();W=r.width;H=r.height;
  cv.width=W*dpr;cv.height=H*dpr;cx.setTransform(dpr,0,0,dpr,0,0);
  const n=Math.min(70,Math.round(W*H/15000));
  pts=Array.from({length:n},()=>({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.28,vy:(Math.random()-.5)*.28,r:Math.random()*1.3+.6}));
  if(reduce)draw();
}
function draw(){
  cx.clearRect(0,0,W,H);
  const rc=cv.getBoundingClientRect(),mx=m.x-rc.left,my=m.y-rc.top;
  for(const p of pts){
    if(!reduce){
      p.x+=p.vx;p.y+=p.vy;
      if(p.x<0||p.x>W)p.vx*=-1;if(p.y<0||p.y>H)p.vy*=-1;
      const dx=p.x-mx,dy=p.y-my,d=Math.hypot(dx,dy);
      if(d<150&&d>0){const f=(150-d)*.012;p.x+=dx/d*f;p.y+=dy/d*f}
    }
  }
  for(let i=0;i<pts.length;i++){
    const a=pts[i];
    for(let j=i+1;j<pts.length;j++){
      const b=pts[j],d=Math.hypot(a.x-b.x,a.y-b.y);
      if(d<125){cx.strokeStyle=`rgba(169,181,138,${(1-d/125)*.2})`;cx.lineWidth=1;cx.beginPath();cx.moveTo(a.x,a.y);cx.lineTo(b.x,b.y);cx.stroke()}
    }
    const dm=Math.hypot(a.x-mx,a.y-my);
    if(dm<180){cx.strokeStyle=`rgba(185,110,75,${(1-dm/180)*.55})`;cx.beginPath();cx.moveTo(a.x,a.y);cx.lineTo(mx,my);cx.stroke()}
    cx.fillStyle='rgba(169,181,138,.55)';cx.beginPath();cx.arc(a.x,a.y,a.r,0,6.283);cx.fill();
  }
}
function frame(){if(!running)return;draw();raf=requestAnimationFrame(frame)}
size();
if('ResizeObserver' in window)new ResizeObserver(size).observe(hb);else addEventListener('resize',size);
if(!reduce){
  frame();
  if('IntersectionObserver' in window)new IntersectionObserver(es=>{
    const v=es[0].isIntersecting;
    if(v&&!running){running=true;frame()}else if(!v){running=false;cancelAnimationFrame(raf)}
  }).observe(hb);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){running=false;cancelAnimationFrame(raf)}else if(!running){running=true;frame()}});
}
addEventListener('pointermove',e=>{m.x=e.clientX;m.y=e.clientY},{passive:true});

/* ---------- pointer effects (mouse only, motion allowed) ---------- */
if(fine&&!reduce){
  const root=document.documentElement;root.classList.add('has-cursor');
  const dot=document.createElement('div'),ring=document.createElement('div');
  dot.className='cursor-dot';ring.className='cursor-ring';ring.innerHTML='<span>VIEW</span>';
  document.body.append(dot,ring);
  const glow=$('#glow'),hv=$('#heroVisual');
  let mx=innerWidth/2,my=innerHeight/2,rx=mx,ry=my,gx=mx,gy=my,thx=0,thy=0,hx=0,hy=0,shown=false;

  addEventListener('pointermove',e=>{
    if(e.pointerType==='touch')return;
    mx=e.clientX;my=e.clientY;
    if(!shown){shown=true;rx=gx=mx;ry=gy=my;dot.style.opacity=1;ring.style.opacity=1}
    thx=(mx/innerWidth-.5)*2;thy=(my/innerHeight-.5)*2;
  },{passive:true});
  root.addEventListener('mouseleave',()=>{dot.style.opacity=0;ring.style.opacity=0;shown=false});
  root.addEventListener('mouseenter',()=>{dot.style.opacity=1;ring.style.opacity=1});
  addEventListener('pointerdown',()=>ring.classList.add('down'));
  addEventListener('pointerup',()=>ring.classList.remove('down'));
  document.addEventListener('pointerover',e=>{
    const t=e.target,onCard=t.closest&&t.closest('.project'),onLink=t.closest&&t.closest('a,button');
    ring.classList.toggle('view',!!onCard&&!onLink);
    ring.classList.toggle('hover',!!onLink||(!!t.closest&&!!t.closest('.value,.timeline-item')&&!onCard));
  });

  (function loop(){
    rx+=(mx-rx)*.18;ry+=(my-ry)*.18;gx+=(mx-gx)*.06;gy+=(my-gy)*.06;
    dot.style.transform=`translate(${mx}px,${my}px)`;
    ring.style.transform=`translate(${rx}px,${ry}px)`;
    glow.style.transform=`translate(${gx}px,${gy}px)`;
    hx+=(thx-hx)*.07;hy+=(thy-hy)*.07;
    hv.style.setProperty('--hx',hx.toFixed(3));hv.style.setProperty('--hy',hy.toFixed(3));
    requestAnimationFrame(loop);
  })();

  /* project cards: 3D tilt + spotlight + inner parallax */
  $$('.project').forEach(p=>{
    const gl=document.createElement('div');gl.className='glow';p.appendChild(gl);
    p.addEventListener('pointermove',e=>{
      const r=p.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;
      p.style.setProperty('--ry',((x-.5)*8).toFixed(2)+'deg');
      p.style.setProperty('--rx',((.5-y)*8).toFixed(2)+'deg');
      p.style.setProperty('--mx',(x*r.width).toFixed(0)+'px');
      p.style.setProperty('--my',(y*r.height).toFixed(0)+'px');
      p.style.setProperty('--px',((x-.5)*2).toFixed(3));
      p.style.setProperty('--py',((y-.5)*2).toFixed(3));
    });
    p.addEventListener('pointerleave',()=>{['--rx','--ry','--px','--py'].forEach(k=>p.style.setProperty(k,k.includes('x')||k.includes('y')?'0':'0'));p.style.setProperty('--rx','0deg');p.style.setProperty('--ry','0deg')});
  });

  /* magnetic buttons */
  $$('.btn').forEach(b=>{
    b.addEventListener('pointermove',e=>{
      const r=b.getBoundingClientRect();
      b.style.translate=`${((e.clientX-r.left-r.width/2)*.28).toFixed(1)}px ${((e.clientY-r.top-r.height/2)*.4).toFixed(1)}px`;
    });
    b.addEventListener('pointerleave',()=>{b.style.translate=''});
  });

  /* contact card spotlight */
  card.addEventListener('pointermove',e=>{
    const r=card.getBoundingClientRect();
    card.style.setProperty('--mx',(e.clientX-r.left)+'px');card.style.setProperty('--my',(e.clientY-r.top)+'px');
  });
}
})();
