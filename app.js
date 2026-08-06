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
  <section class="hero">
    <div class="hero-copy">
      <p class="eyebrow">Eden Toy Co.</p>
      <h1>Orbits are made to be clipped on, carried everywhere and collected with joy.</h1>
      <p>Meet Eden Toy Co.’s signature plush bag charm line — 36 soft, collectible Orbits across Crystal, Manifestation and Zodiac. Premium enough to gift, playful enough to love every day.</p>
      <div class="hero-actions">
        <a class="primary" href="#shop">Shop Orbits</a>
        <a class="secondary" href="#collection/manifestation">Explore collections</a>
      </div>
    </div>
    <div class="hero-visual brand-stage">
      <img class="hero-brand-logo" src="assets/branding/eden-toy-co-logo.png" alt="Eden Toy Co.">
      <img class="hero-collection-image" src="assets/manifestation-collection.png" alt="Orbit Manifestation plush bag charm collection">
      <div class="floating-note">36 Orbits · 3 collections</div>
    </div>
  </section>
  <section class="section">
    <div class="section-heading">
      <div><p class="eyebrow">Collect by feeling</p><h2>Choose your Orbit world</h2></div>
      <p>Eden Toy Co. builds Orbits as collectible plush charm series — each one lovable on its own, even better as a full set.</p>
    </div>
    <div class="collection-grid">
      ${collectionCard('crystal','Crystal Collection','Energy, intention and elemental beauty.')}
      ${collectionCard('manifestation','Manifestation Collection','Carry the feeling you want to create.')}
      ${collectionCard('zodiac','Zodiac Collection','Your sign, your character, your Orbit.')}
    </div>
  </section>
  <section class="shop-shell">
    <div class="section-heading"><div><p class="eyebrow">Featured Orbits</p><h2>Start with a favourite</h2></div></div>
    ${productGrid(products.slice(0,8))}
  </section>`;
}
function collectionCard(key,title,copy){
 return `<a class="collection-card" href="#collection/${key}">
   <img src="assets/${key}-collection.png" alt="${title}">
   <div class="collection-copy"><p class="eyebrow">12 plush bag charms</p><h3>${title}</h3><p>${copy}</p></div>
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
function productGrid(items){
 return `<div class="product-grid">${items.map(productCard).join('')}</div>`;
}
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
function persistCart(){
 localStorage.setItem('edentoyco-cart',JSON.stringify(cart));
 updateCart();
}
function updateCart(){
 const count=Object.values(cart).reduce((a,b)=>a+b,0);
 document.getElementById('cartCount').textContent=count;
 const rows=Object.entries(cart).map(([id,qty])=>{
   const p=products.find(x=>x.id===id); if(!p)return '';
   return `<div class="cart-item">
    <img src="${p.image}" alt="${p.name}">
    <div><strong>${p.name}</strong><p>${money(p.price)}</p><div class="qty"><button data-qty="${id}" data-delta="-1">−</button><span>${qty}</span><button data-qty="${id}" data-delta="1">+</button></div></div>
    <strong>${money(p.price*qty)}</strong>
   </div>`;
 }).join('');
 document.getElementById('cartItems').innerHTML=rows||'<div class="empty">Your Eden Toy Co. bag is empty.</div>';
 const subtotal=Object.entries(cart).reduce((sum,[id,qty])=>{
   const p=products.find(x=>x.id===id); return sum+(p?p.price*qty:0);
 },0);
 document.getElementById('subtotal').textContent=money(subtotal)+' NZD';
 document.querySelectorAll('[data-qty]').forEach(btn=>btn.addEventListener('click',()=>{
   const id=btn.dataset.qty; cart[id]=(cart[id]||0)+Number(btn.dataset.delta);
   if(cart[id]<=0)delete cart[id]; persistCart();
 }));
}
function openCart(){
 document.getElementById('cartDrawer').classList.add('open');
 document.getElementById('overlay').classList.add('show');
 document.getElementById('cartDrawer').setAttribute('aria-hidden','false');
}
function closeCart(){
 document.getElementById('cartDrawer').classList.remove('open');
 document.getElementById('overlay').classList.remove('show');
 document.getElementById('cartDrawer').setAttribute('aria-hidden','true');
}
document.getElementById('cartButton').addEventListener('click',openCart);
document.getElementById('closeCart').addEventListener('click',closeCart);
document.getElementById('overlay').addEventListener('click',closeCart);
document.getElementById('checkoutButton').addEventListener('click',()=>alert('Eden Toy Co. checkout integration is not yet live. Connect Stripe, Shopify, or another provider before accepting payment.'));
init();
