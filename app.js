let products = [];
let cart = JSON.parse(localStorage.getItem('edentoyco-cart') || '{}');
let heroTimer = null;

const money = cents => new Intl.NumberFormat('en-NZ', {style:'currency', currency:'NZD'}).format(cents/100);
const collectionTitle = key => ({crystal:'Crystal Collection', manifestation:'Manifestation Collection', zodiac:'Zodiac Collection'})[key];
const collectionMeta = key => ({
  crystal:{title:'Crystal', kicker:'Find your energy', copy:'Soft mineral tones, golden symbols and crystal-inspired personalities.'},
  manifestation:{title:'Manifestation', kicker:'Carry your intention', copy:'Love, luck, peace, healing, abundance and more — made soft and collectible.'},
  zodiac:{title:'Zodiac', kicker:'Meet your sign', copy:'Twelve character-led signs reimagined as plush companions.'}
})[key];

const campaignSlides = [
  {
    key:'zodiac',
    eyebrow:'FIRST DROP · PREORDERS OPEN',
    headline:'YOUR SIGN. YOUR ORBIT.',
    copy:'12 zodiac personalities. One collectible universe.',
    cta:'PREORDER ZODIAC',
    secondary:'MEET ALL 12',
    images:[
      ['assets/products/zodiac-aries.jpg','Aries'],
      ['assets/products/zodiac-taurus.jpg','Taurus'],
      ['assets/products/zodiac-gemini.jpg','Gemini'],
      ['assets/products/zodiac-cancer.jpg','Cancer'],
      ['assets/products/zodiac-leo.jpg','Leo'],
      ['assets/products/zodiac-virgo.jpg','Virgo'],
      ['assets/products/zodiac-libra.jpg','Libra'],
      ['assets/products/zodiac-scorpio.jpg','Scorpio']
    ]
  },
  {
    key:'manifestation',
    eyebrow:'FIRST RELEASE · PREORDERS OPEN',
    headline:'CARRY WHAT YOU WANT TO CREATE.',
    copy:'Love. Luck. Abundance. Peace. Protection. And seven more intentions to collect.',
    cta:'PREORDER MANIFESTATION',
    secondary:'EXPLORE THE COLLECTION',
    images:[
      ['assets/products/manifestation-love.jpg','Love'],
      ['assets/products/manifestation-luck.jpg','Luck'],
      ['assets/products/manifestation-abundance.jpg','Abundance'],
      ['assets/products/manifestation-peace.jpg','Peace'],
      ['assets/products/manifestation-protection.jpg','Protection'],
      ['assets/products/manifestation-joy.jpg','Joy'],
      ['assets/products/manifestation-dreams.jpg','Dreams'],
      ['assets/products/manifestation-confidence.jpg','Confidence']
    ]
  },
  {
    key:'crystal',
    eyebrow:'FIRST RELEASE · PREORDERS OPEN',
    headline:'FIND YOUR ENERGY.',
    copy:'12 crystal-inspired Orbits designed around energy, intention and everyday magic.',
    cta:'PREORDER CRYSTAL',
    secondary:'MEET THE CRYSTALS',
    images:[
      ['assets/products/crystal-amethyst.jpg','Amethyst'],
      ['assets/products/crystal-clear-quartz.jpg','Clear Quartz'],
      ['assets/products/crystal-citrine.jpg','Citrine'],
      ['assets/products/crystal-green-aventurine.jpg','Green Aventurine'],
      ['assets/products/crystal-black-obsidian.jpg','Black Obsidian'],
      ['assets/products/crystal-fluorite.jpg','Fluorite'],
      ['assets/products/crystal-lapis-lazuli.jpg','Lapis Lazuli'],
      ['assets/products/crystal-rose-quartz.jpg','Rose Quartz']
    ]
  }
];

async function init(){
  products = await fetch('products.json').then(r=>r.json());
  render();
  updateCart();
}
window.addEventListener('hashchange', render);

function render(){
  if(heroTimer){ clearInterval(heroTimer); heroTimer=null; }
  const route = location.hash.slice(1) || 'home';
  const app = document.getElementById('app');
  if(route === 'home') { app.innerHTML = homeTemplate(); bindHeroCarousel(); }
  else if(route === 'shop') { app.innerHTML = shopTemplate(products,'All Orbits'); bindFilters(); }
  else if(route.startsWith('collection/')) {
    const key = route.split('/')[1];
    app.innerHTML = collectionTemplate(key, products.filter(p=>p.collection===key));
  }
  else if(route.startsWith('product/')) {
    const id = route.split('/')[1];
    const product = products.find(p=>p.id===id);
    app.innerHTML = product ? productTemplate(product) : emptyTemplate('That Orbit could not be found.');
  }
  else if(route === 'search') { app.innerHTML = searchTemplate(); bindSearch(); }
  else if(route === 'account') app.innerHTML = accountTemplate();
  else if(route === 'bag') { app.innerHTML = bagTemplate(); bindBagButtons(); }
  else if(route === 'checkout') { app.innerHTML = checkoutTemplate(); bindCheckout(); }
  else if(route === 'confirmation') app.innerHTML = confirmationTemplate();
  else app.innerHTML = emptyTemplate('That page could not be found.');
  bindAddButtons();
  window.scrollTo({top:0,behavior:'instant'});
}

function campaignPanel([src,label],index){
  return `<figure class="campaign-panel panel-${index+1}"><img src="${src}" alt="${label} Orbit"><figcaption>${label}</figcaption></figure>`;
}
function campaignSlide(slide,index){
  return `<article class="campaign-slide ${slide.key}${index===0?' active':''}" data-slide="${index}" aria-hidden="${index===0?'false':'true'}">
    <div class="campaign-art" aria-label="${collectionTitle(slide.key)} campaign">
      ${slide.images.map(campaignPanel).join('')}
      <span class="comic-mark mark-a">★</span><span class="comic-mark mark-b">✦</span><span class="comic-mark mark-c">WOW!</span>
      <div class="campaign-title-lockup"><span>${slide.key.toUpperCase()}</span><strong>COLLECTION</strong></div>
    </div>
    <div class="campaign-copy">
      <span class="launch-chip">${slide.eyebrow}</span>
      <h1>${slide.headline}</h1>
      <p>${slide.copy}</p>
      <div class="campaign-actions"><a class="primary" href="#collection/${slide.key}">${slide.cta}</a><a class="secondary" href="#collection/${slide.key}">${slide.secondary}</a></div>
      <p class="launch-note">Preorder the first release while launch availability lasts.</p>
    </div>
  </article>`;
}
function homeTemplate(){
  return `<section class="campaign-carousel" id="campaignCarousel" aria-roledescription="carousel">
    <div class="campaign-track">${campaignSlides.map(campaignSlide).join('')}</div>
    <button class="carousel-arrow carousel-prev" type="button" aria-label="Previous collection">‹</button>
    <button class="carousel-arrow carousel-next" type="button" aria-label="Next collection">›</button>
    <div class="carousel-dots" role="tablist">${campaignSlides.map((s,i)=>`<button type="button" class="carousel-dot${i===0?' active':''}" data-go="${i}" aria-label="Show ${collectionTitle(s.key)}"></button>`).join('')}</div>
  </section>
  <section class="launch-journey section"><div class="section-heading"><div><p class="eyebrow">Choose your world</p><h2>Three drops. Thirty-six Orbits.</h2></div><p>Meet each collection, find your favourites and preorder from the first Eden Toy Co. ORBITS release.</p></div><div class="collection-grid">${collectionCard('zodiac')}${collectionCard('manifestation')}${collectionCard('crystal')}</div></section>
  <section class="shop-shell"><div class="section-heading"><div><p class="eyebrow">First-release favourites</p><h2>Start your collection</h2></div><a class="secondary" href="#shop">See all 36</a></div>${productGrid(products.slice(0,8))}</section>`;
}

function collectionPreview(key, context='card'){
  const meta = collectionMeta(key);
  return `<div class="collection-preview collection-preview-${context} ${key}"><img class="collection-art" src="assets/${key}-collection.png" alt="${meta.title} Orbit collection"></div>`;
}
function collectionCard(key){
  const meta = collectionMeta(key);
  return `<a class="collection-card brand-collection-card ${key}" href="#collection/${key}">${collectionPreview(key,'card')}<div class="collection-copy"><p class="collection-kicker">${meta.kicker}</p><h3>${meta.title}</h3><p>${meta.copy}</p><span class="collection-link">Explore collection <b>→</b></span></div></a>`;
}
function shopTemplate(items,title){
  return `<section class="shop-shell"><div class="shop-top"><div><p class="eyebrow">FIRST DROP · PREORDERS OPEN</p><h2>${title}</h2></div><div class="filters"><button class="filter active" data-filter="all">All 36</button><button class="filter" data-filter="crystal">Crystal</button><button class="filter" data-filter="manifestation">Manifestation</button><button class="filter" data-filter="zodiac">Zodiac</button></div></div><div id="gridWrap">${productGrid(items)}</div></section>`;
}
function collectionTemplate(key,items){
  const meta = collectionMeta(key);
  return `<section class="collection-hero collection-hero-brand ${key}"><div><span class="launch-chip">FIRST RELEASE · PREORDERS OPEN</span><p class="eyebrow">ORBITS · 12 collectible charms</p><h1>${collectionTitle(key)}</h1><p>${collectionCopy(key)}</p><a class="primary" href="#shop">Preorder ${meta.title}</a></div>${collectionPreview(key,'detail')}</section><section class="shop-shell"><div class="section-heading"><div><p class="eyebrow">${meta.kicker}</p><h2>Collect all 12</h2></div><p>${meta.copy}</p></div>${productGrid(items)}</section>`;
}
function collectionCopy(key){ return {crystal:'Twelve crystal-inspired companions, each matched to a distinct intention and finished with signature gold-tone hardware.',manifestation:'Twelve plush symbols of abundance, love, luck, protection, peace, healing, confidence, success, clarity, joy, dreams and alignment.',zodiac:'Twelve character-led plush charms, one for every sign of the zodiac.'}[key]; }
function productGrid(items){ return `<div class="product-grid">${items.map(productCard).join('')}</div>`; }
function productCard(p){ return `<article class="product-card"><a class="product-image-link" href="#product/${p.id}"><img src="${p.image}" alt="${p.name}"><span class="quick-badge">PREORDER</span></a><div class="product-info"><p class="eyebrow">${collectionTitle(p.collection)}</p><a href="#product/${p.id}"><h3>${p.name}</h3></a><p>${p.tagline}</p><div class="product-meta"><strong>${money(p.price)}</strong><span>NZD</span></div><button class="add" data-add="${p.id}">Preorder</button></div></article>`; }
function productTemplate(p){ return `<section class="product-page"><div class="product-visual"><img src="${p.image}" alt="${p.name}"></div><div><span class="launch-chip">FIRST RELEASE · PREORDER</span><p class="eyebrow">ORBITS · ${collectionTitle(p.collection)}</p><h1>${p.name}</h1><p class="price">${money(p.price)} NZD</p><p>${p.tagline}. ${p.description}</p><ul class="feature-list">${p.features.map(f=>`<li>✦ ${f}</li>`).join('')}</ul><button class="primary wide add" data-add="${p.id}">Preorder this Orbit</button><p class="fineprint">First-release preorder. Final stock, shipping dates and live payment configuration must be confirmed before launch.</p></div></section>`; }

function searchTemplate(){ return `<section class="page-shell"><div class="page-panel"><span class="page-kicker">Find your Orbit</span><h1>Search the whole universe.</h1><p class="muted">Search by sign, crystal, intention or character name.</p><div class="search-box"><input id="searchInput" type="search" placeholder="Try: Aries, love, amethyst…" autocomplete="off"><button class="primary" id="searchButton">Search</button></div><div id="searchResults">${productGrid(products.slice(0,8))}</div></div></section>`; }
function accountTemplate(){ return `<section class="page-shell"><div class="page-panel account-card"><span class="page-kicker">Your Eden Toy Co. account</span><h1>Welcome back.</h1><p class="muted">Account functionality is not connected yet. This screen establishes the calmer pop-art treatment for sign-in and account flows without pretending authentication is live.</p><div class="form-grid"><div class="form-field full"><label>Email address</label><input type="email" placeholder="you@example.com"></div><div class="form-field full"><label>Password</label><input type="password" placeholder="••••••••"></div></div><button class="primary">Sign in</button><span class="demo-chip">Design preview · authentication not connected</span></div></section>`; }
function bagTemplate(){ const entries=cartEntries(); if(!entries.length) return `<section class="page-shell"><div class="page-panel"><span class="page-kicker">Your bag</span><h1>Nothing clipped in yet.</h1><p class="muted">Pick an Orbit and start your collection.</p><a class="primary" href="#shop">Shop Orbits</a></div></section>`; return `<section class="page-shell"><div class="page-panel"><span class="page-kicker">Preorder bag</span><h1>Your Orbit lineup.</h1><div>${entries.map(({p,qty})=>`<div class="order-row"><img src="${p.image}" alt="${p.name}"><div><strong>${p.name}</strong><div class="qty"><button data-bagqty="${p.id}" data-delta="-1">−</button><span>${qty}</span><button data-bagqty="${p.id}" data-delta="1">+</button></div></div><strong>${money(p.price*qty)}</strong></div>`).join('')}</div><div class="order-total"><span>Subtotal</span><span>${money(cartSubtotal())}</span></div><a class="primary wide" href="#checkout">Continue preorder</a></div></section>`; }
function checkoutTemplate(){ const entries=cartEntries(); if(!entries.length) return bagTemplate(); return `<section class="page-shell"><div class="checkout-grid"><form class="checkout-card" id="checkoutForm"><span class="page-kicker">Preorder checkout</span><h1>Almost yours.</h1><div class="checkout-step"><h2>Contact</h2><div class="form-grid"><div class="form-field full"><label>Email</label><input required type="email" placeholder="you@example.com"></div></div></div><div class="checkout-step"><h2>Delivery</h2><div class="form-grid"><div class="form-field"><label>First name</label><input required></div><div class="form-field"><label>Last name</label><input required></div><div class="form-field full"><label>Address</label><input required></div><div class="form-field"><label>City</label><input required></div><div class="form-field"><label>Postcode</label><input required></div><div class="form-field full"><label>Country</label><select><option>New Zealand</option></select></div></div></div><div class="checkout-step"><h2>Payment</h2><p class="secure-note">Secure-payment styling preview. A live payment gateway has not been connected, so no card details are collected and no charge will occur.</p></div><button class="primary wide" type="submit">Complete demo preorder</button></form><aside class="order-summary"><h2>Preorder summary</h2>${entries.map(({p,qty})=>`<div class="order-row"><img src="${p.image}" alt="${p.name}"><div><strong>${p.name}</strong><small>Qty ${qty}</small></div><strong>${money(p.price*qty)}</strong></div>`).join('')}<div class="order-total"><span>Total</span><span>${money(cartSubtotal())} NZD</span></div></aside></div></section>`; }
function confirmationTemplate(){ return `<section class="page-shell"><div class="page-panel account-card"><span class="page-kicker">Demo preorder complete</span><h1>Your Orbits are looking good.</h1><p class="muted">This is the confirmation-state design only. No order was submitted and no payment was taken.</p><a class="primary" href="#shop">Keep exploring</a></div></section>`; }
function emptyTemplate(message){ return `<section class="page-shell"><div class="page-panel"><h1>${message}</h1><a class="primary" href="#home">Back home</a></div></section>`; }

function bindHeroCarousel(){
  const root=document.getElementById('campaignCarousel'); if(!root) return;
  const slides=[...root.querySelectorAll('.campaign-slide')], dots=[...root.querySelectorAll('.carousel-dot')]; let index=0, startX=0;
  const show=i=>{ index=(i+slides.length)%slides.length; slides.forEach((s,n)=>{s.classList.toggle('active',n===index);s.setAttribute('aria-hidden',n===index?'false':'true')}); dots.forEach((d,n)=>d.classList.toggle('active',n===index)); };
  const restart=()=>{ if(heroTimer) clearInterval(heroTimer); heroTimer=setInterval(()=>show(index+1),6000); };
  root.querySelector('.carousel-prev').addEventListener('click',()=>{show(index-1);restart()});
  root.querySelector('.carousel-next').addEventListener('click',()=>{show(index+1);restart()});
  dots.forEach((d,n)=>d.addEventListener('click',()=>{show(n);restart()}));
  root.addEventListener('mouseenter',()=>{if(heroTimer)clearInterval(heroTimer)}); root.addEventListener('mouseleave',restart);
  root.addEventListener('touchstart',e=>{startX=e.touches[0].clientX},{passive:true}); root.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-startX;if(Math.abs(dx)>45){show(index+(dx<0?1:-1));restart()}},{passive:true});
  if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches) restart();
}
function cartEntries(){ return Object.entries(cart).map(([id,qty])=>({p:products.find(x=>x.id===id),qty})).filter(x=>x.p); }
function cartSubtotal(){ return cartEntries().reduce((sum,{p,qty})=>sum+p.price*qty,0); }
function bindFilters(){ document.querySelectorAll('.filter').forEach(btn=>btn.addEventListener('click',()=>{ document.querySelectorAll('.filter').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); const key=btn.dataset.filter; const items=key==='all'?products:products.filter(p=>p.collection===key); document.getElementById('gridWrap').innerHTML=productGrid(items); bindAddButtons(); })); }
function bindSearch(){ const input=document.getElementById('searchInput'); const run=()=>{ const q=input.value.trim().toLowerCase(); const items=!q?products:products.filter(p=>[p.name,p.shortName,p.collection,p.tagline,p.description].join(' ').toLowerCase().includes(q)); document.getElementById('searchResults').innerHTML=items.length?productGrid(items):'<div class="empty">No Orbits matched that search.</div>'; bindAddButtons(); }; document.getElementById('searchButton').addEventListener('click',run); input.addEventListener('input',run); input.focus(); }
function bindBagButtons(){ document.querySelectorAll('[data-bagqty]').forEach(btn=>btn.addEventListener('click',()=>{ const id=btn.dataset.bagqty; cart[id]=(cart[id]||0)+Number(btn.dataset.delta); if(cart[id]<=0) delete cart[id]; persistCart(); render(); })); }
function bindCheckout(){ const form=document.getElementById('checkoutForm'); if(form) form.addEventListener('submit',e=>{ e.preventDefault(); location.hash='confirmation'; }); }
function bindAddButtons(){ document.querySelectorAll('[data-add]').forEach(btn=>btn.addEventListener('click',()=>{ const id=btn.dataset.add; cart[id]=(cart[id]||0)+1; persistCart(); openCart(); })); }
function persistCart(){ localStorage.setItem('edentoyco-cart',JSON.stringify(cart)); updateCart(); }
function updateCart(){ const count=Object.values(cart).reduce((a,b)=>a+b,0); const countEl=document.getElementById('cartCount'); if(countEl) countEl.textContent=count; const itemsEl=document.getElementById('cartItems'); if(itemsEl){ const rows=cartEntries().map(({p,qty})=>`<div class="cart-item"><img src="${p.image}" alt="${p.name}"><div><strong>${p.name}</strong><p>${money(p.price)}</p><div class="qty"><button data-qty="${p.id}" data-delta="-1">−</button><span>${qty}</span><button data-qty="${p.id}" data-delta="1">+</button></div></div><strong>${money(p.price*qty)}</strong></div>`).join(''); itemsEl.innerHTML=rows||'<div class="empty">Your ORBITS bag is empty.</div>'; document.querySelectorAll('[data-qty]').forEach(btn=>btn.addEventListener('click',()=>{ const id=btn.dataset.qty; cart[id]=(cart[id]||0)+Number(btn.dataset.delta); if(cart[id]<=0)delete cart[id]; persistCart(); })); } const subtotalEl=document.getElementById('subtotal'); if(subtotalEl) subtotalEl.textContent=money(cartSubtotal())+' NZD'; }
function openCart(){ document.getElementById('cartDrawer').classList.add('open'); document.getElementById('overlay').classList.add('show'); document.getElementById('cartDrawer').setAttribute('aria-hidden','false'); }
function closeCart(){ document.getElementById('cartDrawer').classList.remove('open'); document.getElementById('overlay').classList.remove('show'); document.getElementById('cartDrawer').setAttribute('aria-hidden','true'); }

document.getElementById('cartButton').addEventListener('click',openCart);
document.getElementById('closeCart').addEventListener('click',closeCart);
document.getElementById('overlay').addEventListener('click',closeCart);
document.getElementById('checkoutButton').addEventListener('click',()=>{ closeCart(); location.hash='checkout'; });
init();
