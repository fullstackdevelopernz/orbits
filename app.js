let products = [];
let cart = JSON.parse(localStorage.getItem('edentoyco-cart') || '{}');

const money = cents => new Intl.NumberFormat('en-NZ', {style:'currency', currency:'NZD'}).format(cents/100);
const collectionTitle = key => ({crystal:'Crystal Collection', manifestation:'Manifestation Collection', zodiac:'Zodiac Collection'})[key];

async function init(){
  products = await fetch('products.json').then(r=>r.json());
  render();
  updateCart();
}
window.addEventListener('hashchange', render);

function render(){
  const route = location.hash.slice(1) || 'home';
  const app = document.getElementById('app');
  if(route === 'home'){
    app.innerHTML = homeTemplate();
  } else if(route === 'shop'){
    app.innerHTML = shopTemplate(products, 'All Orbits');
    bindFilters();
  } else if(route.startsWith('collection/')){
    const key = route.split('/')[1];
    const filtered = products.filter(p=>p.collection===key);
    app.innerHTML = collectionTemplate(key, filtered);
  } else if(route.startsWith('product/')){
    const id = route.split('/')[1];
    const product = products.find(p=>p.id===id);
    app.innerHTML = product ? productTemplate(product) : '<div class="empty">That Orbit could not be found.</div>';
  }
  bindAddButtons();
  window.scrollTo({top:0, behavior:'instant'});
}

function homeTemplate(){
  return `
  <section class="hero hero-reimagined">
    <div class="hero-copy">
      <img class="hero-master-logo" src="assets/branding/eden-toy-co-logo.png" alt="Eden Toy Co.">
      <p class="hero-kicker">Meet Orbits</p>
      <h1>Little plush personalities for bags, keys and everyday magic.</h1>
      <p class="hero-intro">Collect the feeling that fits you. Each Eden Toy Co. Orbit is soft, giftable and made to bring a little joy wherever it goes.</p>
      <div class="hero-actions">
        <a class="primary" href="#shop">Shop all Orbits</a>
        <a class="secondary" href="#collection/manifestation">Meet the collections</a>
      </div>
      <div class="hero-proof">
        <span><strong>36</strong> characters</span>
        <span><strong>3</strong> worlds</span>
        <span><strong>1</strong> joyful collection</span>
      </div>
    </div>
    <div class="hero-showcase">
      <div class="spark spark-a">✦</div>
      <div class="spark spark-b">✦</div>
      <div class="spark spark-c">✦</div>
      <img class="hero-collection-image" src="assets/manifestation-collection.png" alt="Manifestation Orbit plush bag charm collection">
      <a class="floating-toy toy-love" href="#product/manifestation-love"><img src="assets/products/manifestation-love.jpg" alt="Love Orbit"></a>
      <a class="floating-toy toy-luck" href="#product/manifestation-luck"><img src="assets/products/manifestation-luck.jpg" alt="Luck Orbit"></a>
      <a class="floating-toy toy-dreams" href="#product/manifestation-dreams"><img src="assets/products/manifestation-dreams.jpg" alt="Dreams Orbit"></a>
      <div class="floating-note">Tap a floating Orbit</div>
    </div>
  </section>
  <section class="section collections-section">
    <div class="section-heading brand-heading">
      <div><p class="eyebrow">Three ways to collect</p><h2>Choose your Orbit world</h2></div>
      <p>Each world has its own mood, palette and personality — designed as part of one unmistakable Eden Toy Co. family.</p>
    </div>
    <div class="collection-grid collection-grid-brand">
      ${collectionCard('crystal','Crystal','Find your energy','Soft mineral tones, tiny golden symbols and characters inspired by the crystals people love.')}
      ${collectionCard('manifestation','Manifestation','Carry your intention','A joyful cast built around love, luck, peace, healing, abundance and more.')}
      ${collectionCard('zodiac','Zodiac','Meet your sign','Twelve characterful signs, reimagined as soft companions with collectible details.')}
    </div>
  </section>
  <section class="shop-shell">
    <div class="section-heading"><div><p class="eyebrow">Featured Orbits</p><h2>Start with a favourite</h2></div></div>
    ${productGrid(products.slice(0,8))}
  </section>`;
}
function collectionCard(key,title,kicker,copy){
 return `<a class="collection-card brand-collection-card ${key}" href="#collection/${key}">
   <div class="collection-number">0${key==='crystal'?1:key==='manifestation'?2:3}</div>
   <img src="assets/${key}-collection.png" alt="${title} Orbit collection">
   <div class="collection-chip">12 Orbits</div>
   <div class="collection-copy">
     <p class="collection-kicker">${kicker}</p>
     <h3>${title}</h3>
     <p>${copy}</p>
     <span class="collection-link">Explore collection <b>→</b></span>
   </div>
 </a>`;
}
function shopTemplate(items,title){
 return `<section class="shop-shell">
   <div class="shop-top">
     <div><p class="eyebrow">Eden Toy Co. range</p><h2>${title}</h2></div>
     <div class="filters">
       <button class="filter active" data-filter="all">All 36</button>
       <button class="filter" data-filter="crystal">Crystal</button>
       <button class="filter" data-filter="manifestation">Manifestation</button>
       <button class="filter" data-filter="zodiac">Zodiac</button>
     </div>
   </div>
   <div id="gridWrap">${productGrid(items)}</div>
 </section>`;
}
function collectionTemplate(key,items){
 return `<section class="collection-hero">
   <div><p class="eyebrow">Eden Toy Co. · 12 collectible Orbits</p><h1>${collectionTitle(key)}</h1><p>${collectionCopy(key)}</p><a class="primary" href="#shop">Shop all Orbits</a></div>
   <img src="assets/${key}-collection.png" alt="${collectionTitle(key)}">
 </section>
 <section class="shop-shell">${productGrid(items)}</section>`;
}
function collectionCopy(key){
 return {
   crystal:'Twelve crystal-inspired companions, each matched to a distinct intention and finished with signature gold-tone hardware.',
   manifestation:'Twelve plush symbols of abundance, love, luck, protection, peace, healing, confidence, success, clarity, joy, dreams and alignment.',
   zodiac:'Twelve character-led plush charms, one for every sign of the zodiac.'
 }[key];
}
function productGrid(items){ return `<div class="product-grid">${items.map(productCard).join('')}</div>`; }
function productCard(p){
 return `<article class="product-card">
   <a href="#product/${p.id}"><img src="${p.image}" alt="${p.name}"></a>
   <div class="product-info">
     <p class="eyebrow">${collectionTitle(p.collection)}</p>
     <a href="#product/${p.id}"><h3>${p.name}</h3></a>
     <p>${p.tagline}</p>
     <div class="product-meta"><strong>${money(p.price)}</strong><span>NZD</span></div>
     <button class="add" data-add="${p.id}">Add to bag</button>
   </div>
 </article>`;
}
function productTemplate(p){
 return `<section class="product-page">
   <img src="${p.image}" alt="${p.name}">
   <div>
     <p class="eyebrow">Eden Toy Co. · ${collectionTitle(p.collection)}</p>
     <h1>${p.name}</h1>
     <p class="price">${money(p.price)} NZD</p>
     <p>${p.tagline}. ${p.description}</p>
     <ul class="feature-list">${p.features.map(f=>`<li>✦ ${f}</li>`).join('')}</ul>
     <button class="primary wide add" data-add="${p.id}">Add to bag</button>
     <p class="fineprint">Prototype price shown. Confirm retail price, shipping rules and stock before launch.</p>
   </div>
 </section>`;
}
function bindFilters(){
 document.querySelectorAll('.filter').forEach(btn=>btn.addEventListener('click',()=>{
   document.querySelectorAll('.filter').forEach(b=>b.classList.remove('active'));
   btn.classList.add('active');
   const key=btn.dataset.filter;
   const items=key==='all'?products:products.filter(p=>p.collection===key);
   document.getElementById('gridWrap').innerHTML=productGrid(items);
   bindAddButtons();
 }));
}
function bindAddButtons(){
 document.querySelectorAll('[data-add]').forEach(btn=>btn.addEventListener('click',()=>{
   const id=btn.dataset.add;
   cart[id]=(cart[id]||0)+1;
   persistCart();
   openCart();
 }));
}
function persistCart(){ localStorage.setItem('edentoyco-cart',JSON.stringify(cart)); updateCart(); }
function updateCart(){
 const count=Object.values(cart).reduce((a,b)=>a+b,0);
 document.getElementById('cartCount').textContent=count;
 const rows=Object.entries(cart).map(([id,qty])=>{
   const p=products.find(x=>x.id===id); if(!p)return '';
   return `<div class="cart-item"><img src="${p.image}" alt="${p.name}"><div><strong>${p.name}</strong><p>${money(p.price)}</p><div class="qty"><button data-qty="${id}" data-delta="-1">−</button><span>${qty}</span><button data-qty="${id}" data-delta="1">+</button></div></div><strong>${money(p.price*qty)}</strong></div>`;
 }).join('');
 document.getElementById('cartItems').innerHTML=rows||'<div class="empty">Your Eden Toy Co. bag is empty.</div>';
 const subtotal=Object.entries(cart).reduce((sum,[id,qty])=>{ const p=products.find(x=>x.id===id); return sum+(p?p.price*qty:0); },0);
 document.getElementById('subtotal').textContent=money(subtotal)+' NZD';
 document.querySelectorAll('[data-qty]').forEach(btn=>btn.addEventListener('click',()=>{
   const id=btn.dataset.qty; cart[id]=(cart[id]||0)+Number(btn.dataset.delta);
   if(cart[id]<=0)delete cart[id]; persistCart();
 }));
}
function openCart(){ document.getElementById('cartDrawer').classList.add('open'); document.getElementById('overlay').classList.add('show'); document.getElementById('cartDrawer').setAttribute('aria-hidden','false'); }
function closeCart(){ document.getElementById('cartDrawer').classList.remove('open'); document.getElementById('overlay').classList.remove('show'); document.getElementById('cartDrawer').setAttribute('aria-hidden','true'); }
document.getElementById('cartButton').addEventListener('click',openCart);
document.getElementById('closeCart').addEventListener('click',closeCart);
document.getElementById('overlay').addEventListener('click',closeCart);
document.getElementById('checkoutButton').addEventListener('click',()=>alert('Eden Toy Co. checkout integration is not yet live. Connect Stripe, Shopify, or another provider before accepting payment.'));
init();
