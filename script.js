// simplified script, uses local images and menu.json
const $=(s,scope=document)=>scope.querySelector(s);
const $$=(s,scope=document)=>[...scope.querySelectorAll(s)];

/* Hide splash */
setTimeout(()=>{ const s=document.getElementById('splash'); if(s) s.style.display='none'; },1000);

/* Slider */
const slides=$$('.slide'), dotsWrap=$('#dots'); let idx=0;
slides.forEach((s,i)=>{ const d=document.createElement('button'); d.className='dot'+(i===0?' active':''); d.addEventListener('click',()=>go(i)); dotsWrap.appendChild(d); });
function go(i){ slides[idx].classList.remove('active'); dotsWrap.children[idx].classList.remove('active'); idx=(i+slides.length)%slides.length; slides[idx].classList.add('active'); dotsWrap.children[idx].classList.add('active'); }
$('#prev').onclick=()=>go(idx-1); $('#next').onclick=()=>go(idx+1); setInterval(()=>go(idx+1),6000);

/* Load local menu.json */
fetch('menu.json').then(r=>r.json()).then(MENU=>{
  const grid=$('#menuGrid');
  function money(n){return 'Rp '+n.toLocaleString('id-ID');}
  function render(filter='all'){ grid.innerHTML=''; MENU.filter(m=>filter==='all'||m.type===filter).forEach(m=>{ const card=document.createElement('div'); card.className='card'; card.innerHTML=`<img src="${m.img}" alt="${m.name}"/><div class="meta"><h4>${m.name}</h4><p>${m.desc}</p><span class="price">${money(m.price)}</span><div style="margin-top:.6rem"><button class="addBtn" data-id="${m.id}">Tambah ke Keranjang</button></div></div>`; grid.appendChild(card); }); bindAdd(); }
  render();
  $$('.chip').forEach(ch=>ch.addEventListener('click',()=>{$$('.chip').forEach(c=>c.classList.remove('active')); ch.classList.add('active'); render(ch.dataset.filter);}));
  // Cart
  let cart=JSON.parse(localStorage.getItem('osteria_cart')||'[]');
  function save(){ localStorage.setItem('osteria_cart', JSON.stringify(cart)); }
  function cnt(){ return cart.reduce((a,c)=>a+c.qty,0); }
  function sub(){ return cart.reduce((a,c)=>a+c.qty*c.price,0); }
  function add(id){ const it=MENU.find(m=>m.id===id); const ex=cart.find(c=>c.id===id); if(ex) ex.qty++; else cart.push({id:it.id,name:it.name,price:it.price,img:it.img,qty:1}); toast(it.name+' ditambahkan'); save(); update(); }
  function remove(id){ cart=cart.filter(c=>c.id!==id); save(); update(); }
  function change(id,d){ const it=cart.find(c=>c.id===id); if(!it) return; it.qty+=d; if(it.qty<=0) remove(id); save(); update(); }
  function update(){ $('#cartCount').textContent=cnt(); const items=$('#cartItems'); items.innerHTML=''; if(cart.length===0) items.innerHTML='<p class="empty">Keranjang kosong.</p>'; else{ cart.forEach(c=>{ const el=document.createElement('div'); el.innerHTML=`<div style="display:flex;gap:.6rem;align-items:center"><img src="${c.img}" style="width:70px;height:70px;object-fit:cover;border-radius:8px"/><div><strong>${c.name}</strong><div style="display:flex;gap:.4rem;align-items:center;margin-top:.4rem"><button onclick="change('${c.id}',-1)">−</button><span>${c.qty}</span><button onclick="change('${c.id}',1)">+</button></div></div><div style="margin-left:auto"><strong>${money(c.price*c.qty)}</strong><br/><a href='#' onclick="remove('${c.id}');return false">Hapus</a></div></div><hr/>`; items.appendChild(Object.assign(document.createElement('div'),{innerHTML:el.innerHTML})); }); } $('#subtotal').textContent=money(sub()); const tax=Math.round(sub()*0.10); $('#tax').textContent=money(tax); $('#total').textContent=money(sub()+tax); $('#summaryCount').textContent=cnt(); $('#summaryTotal').textContent=money(sub()+tax); }
  function bindAdd(){ $$('.addBtn').forEach(b=>b.addEventListener('click',()=>add(b.dataset.id))); }
  update();
  // Checkout handlers
  $('#cartBtn').onclick=()=>{ document.getElementById('cartDrawer').classList.add('open'); document.getElementById('cartDrawer').setAttribute('aria-hidden','false'); }
  $('#closeCart').onclick=()=>{ document.getElementById('cartDrawer').classList.remove('open'); document.getElementById('cartDrawer').setAttribute('aria-hidden','true'); }
  $('#openCheckout').onclick=()=>{ document.getElementById('checkoutModal').classList.add('show'); document.getElementById('checkoutModal').setAttribute('aria-hidden','false'); }
  $('#closeCheckout').onclick=()=>{ document.getElementById('checkoutModal').classList.remove('show'); document.getElementById('checkoutModal').setAttribute('aria-hidden','true'); }
  $('#checkoutForm').addEventListener('submit',(e)=>{ e.preventDefault(); alert('Terima kasih! Pesanan diproses. File order akan diunduh.'); const order={customer:{name:e.target.name.value,phone:e.target.phone.value,payment:e.target.payment.value},items:cart,subtotal:sub(),tax:Math.round(sub()*0.10),total:sub()+Math.round(sub()*0.10),created:new Date().toISOString()}; const blob=new Blob([JSON.stringify(order,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='order_'+Date.now()+'.json'; a.click(); URL.revokeObjectURL(url); cart=[]; save(); update(); document.getElementById('checkoutModal').classList.remove('show'); });
  // toast
  function toast(m){ let t=document.getElementById('toast'); if(!t){ t=document.createElement('div'); t.id='toast'; t.style.position='fixed'; t.style.left='50%'; t.style.bottom='24px'; t.style.transform='translateX(-50%)'; t.style.background='#6b1026'; t.style.color='#fff'; t.style.padding='.7rem 1rem'; t.style.borderRadius='12px'; document.body.appendChild(t); } t.textContent=m; t.style.opacity=1; setTimeout(()=>t.style.opacity=0,1600); }
});

/* Ambient backsound */
let audioInited=false, ctx, muted=false;
function initAudio(){ if(audioInited) return; audioInited=true; ctx=new (window.AudioContext||window.webkitAudioContext)(); const master=ctx.createGain(); master.gain.value=0.12; master.connect(ctx.destination); const base=[261.63,329.63,392.00]; function play(){ base.forEach((n,idx)=>{ const o=ctx.createOscillator(); o.type='sine'; o.frequency.value=n*(1+idx*0.004); const g=ctx.createGain(); g.gain.setValueAtTime(0,ctx.currentTime); g.gain.linearRampToValueAtTime(0.12,ctx.currentTime+0.2); g.gain.linearRampToValueAtTime(0,ctx.currentTime+3.6); o.connect(g); g.connect(master); o.start(); o.stop(ctx.currentTime+3.6); }); } setInterval(()=>{ if(!muted) play(); },3800); }
['click','keydown','touchstart'].forEach(ev=>document.addEventListener(ev, initAudio, {once:true}));
document.getElementById && document.getElementById('soundToggle')?.addEventListener('click',()=>{ if(!ctx) initAudio(); muted=!muted; document.getElementById('soundToggle').textContent = muted? '🔇' : '🔊'; });
