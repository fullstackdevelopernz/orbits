let products = [];
let cart = JSON.parse(localStorage.getItem('edentoyco-cart') || '{}');

const money = cents => new Intl.NumberFormat('en-NZ', {style:'currency', currency:'NZD'}).format(cents/100);
const collectionTitle = key => ({crystal:'Crystal Collection', manifestation:'Manifestation Collection', zodiac:'Zodiac Collection'})[key];
const collectionMeta = key => ({
  crystal:{title:'Crystal', kicker:'Find your energy', copy:'Soft mineral tones, tiny golden symbols and characters inspired by the crystals people love.'},
  manifestation:{title:'Manifestation', kicker:'Carry your intention', copy:'A joyful cast built around love, luck, peace, healing, abundance and more.'},
  zodiac:{title:'Zodiac', kicker:'Meet your sign', copy:'Twelve characterful signs, reimagined as soft companions with collectible details.'}
})[key];

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

function collectionPreview(key, context='card'){
  const meta = collectionMeta(key);
  return `<div class="collection-preview collection-preview-${context} ${key}">
    <img class="collection-art" src="assets/${key}-collection.png" alt="${meta.title} Orbit collection">
    <span class="collection-brand-sticker" aria-label="ORBITS branded collection">
      <img src="assets/branding/orbits-logo.svg" alt="ORBITS">
    </span>
  </div>`;
}

function homeTemplate(){
  return `
  <section class="hero hero-reimagined">
    <div class="hero-copy">
      <img class="hero-master-logo" src="assets/branding/orbits-logo.svg" alt="ORBITS">
      <p class="hero-kicker">By Eden Toy Co.</p>
      <h1>Little plush personalities for bags, keys and everyday magic.</h1>
      <p class="hero-intro">Choose the feeling that fits you. Every Orbit is soft, expressive, giftable and made to bring a little joy wherever it goes.</p>
      <div class="hero-actions">
        <a class="primary" href="#shop">Shop all Orbits</a>
        <a class="secondary" href="#collection/manifestation">Meet the collections</a>
      </div>
      <div class="hero-proof"><span><strong>36</strong> characters</span><span><strong>3</strong> collections</span><span><strong>1</strong> playful world</span></div>
    </div>
    <div class="hero-showcase">
      <div class="spark spark-a">✦</div><div class="spark spark-b">✦</div><div class="spark spark-c">✦</div>
      ${collectionPreview('manifestation','hero')}
      <a class="floating-toy toy-love" href="#product/manifestation-love"><img src="assets/products/manifestation-love.jpg" alt="Love Orbit"></a>
      <a class="floating-toy toy-luck" href="#product/manifestation-luck"><img src="assets/products/manifestation-luck.jpg" alt="Luck Orbit"></a>
      <a class="floating-toy toy-dreams" href="#product/manifestation-dreams"><img src="assets/products/manifestation-dreams.jpg" alt="Dreams Orbit"></a>
      <div class="floating-note">Tap a floating Orbit</div>
    </div>
  </section>
  <section class="section collections-section">
    <div class="section-heading brand-heading">
      <div><p class="eyebrow">Choose your collection</p><h2>Find the Orbit that feels like you.</h2></div>
      <p>Crystal, Manifestation and Zodiac each have their own mood, colour and personality — all unmistakably ORBITS.</p>
    </div>
    <div class="collection-grid collection-grid-brand">
      ${collectionCard('crystal')}
      ${collectionCard('manifestation')}
      ${collectionCard('zodiac')}
    </div>
  </section>
  <section class="shop-shell featured-shop">
    <div class="section-heading"><div><p class="eyebrow">Featured Orbits</p><h2>Start with a favourite.</h2></div><a class="text-link" href="#shop">Shop all 36 →</a></div>
    ${productGrid(products.slice(0,8))}
  </section>`;
}

function collectionCard(key){
  const meta=collectionMeta(key);
  return `<a class="collection-card brand-collection-card ${key}" href="#collection/${key}">
    ${collectionPreview(key,'card')}
    <div class="collection-copy">
      <p class="collection-kicker">${meta.kicker}</p>
      <h3>${meta.title}</h3>
      <p>${meta.copy}</p>
      <span class="collection-link">Explore collection <b>→</b></span>
    </div>
  </a>`;
}

function shopTemplate(items,title){
 return `<section class="shop-shell"><div class="shop-top"><div><p class="eyebrow">ORBITS by Eden Toy Co.</p><h2>${title}</h2></div><div class="filters"><button class="filter active" data-filter="all">All 36</button><button class="filter" data-filter="crystal">Crystal</button><button class="filter" data-filter="manifestation">Manifestation</button><button class="filter" data-filter="zodiac">Zodiac</button></div></div><div id="gridWrap">${productGrid(items)}</div></section>`;
}

function collectionTemplate(key,items){
 return `<section class="collection-hero collection-hero-brand"><div><p class="eyebrow">ORBITS · 12 collectible charms</p><h1>${collectionTitle(key)}</h1><p>${collectionCopy(key)}</p><a class="primary" href="#shop">Shop all Orbits</a></div>${collectionPreview(key,'detail')}</section><section class="shop-shell">${productGrid(items)}</section>`;
}

function collectionCopy(key){ return {crystal:'Twelve crystal-inspired companions, each matched to a distinct intention and finished with signature gold-tone hardware.',manifestation:'Twelve plush symbols of abundance, love, luck, protection, peace, healing, confidence, success, clarity, joy, dreams and alignment.',zodiac:'Twelve character-led plush charms, one for every sign of the zodiac.'}[key]; }
function productGrid(items){ return `<div class="product-grid">${items.map(productCard).join('')}</div>`; }
function productCard(p){ return `<article class="product-card"><a class="product-image-link" href="#product/${p.id}"><img src="${p.image}" alt="${p.name}"><span class="quick-badge">ORBITS</span></a><div class="product-info"><p class="eyebrow">${collectionTitle(p.collection)}</p><a href="#product/${p.id}"><h3>${p.name}</h3></a><p>${p.tagline}</p><div class="product-meta"><strong>${money(p.price)}</strong><span>NZD</span></div><button class="add" data-add="${p.id}">Add to bag</button></div></article>`; }
function productTemplate(p){ return `<section class="product-page"><div class="product-visual"><img src="${p.image}" alt="${p.name}"><span class="product-logo-chip"><img src="assets/branding/orbits-logo.svg" alt="ORBITS"></span></div><div><p class="eyebrow">ORBITS · ${collectionTitle(p.collection)}</p><h1>${p.name}</h1><p class="price">${money(p.price)} NZD</p><p>${p.tagline}. ${p.description}</p><ul class="feature-list">${p.features.map(f=>`<li>✦ ${f}</li>`).join('')}</ul><button class="primary wide add" data-add="${p.id}">Add to bag</button><p class="fineprint">Prototype price shown. Confirm retail price, shipping rules and stock before launch.</p></div></section>`; }
function bindFilters(){ document.querySelectorAll('.filter').forEach(btn=>btn.addEventListener('click',()=>{ document.querySelectorAll('.filter').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); const key=btn.dataset.filter; const items=key==='all'?products:products.filter(p=>p.collection===key); document.getElementById('gridWrap').innerHTML=productGrid(items); bindAddButtons(); })); }
function bindAddButtons(){ document.querySelectorAll('[data-add]').forEach(btn=>btn.addEventListener('click',()=>{ const id=btn.dataset.add; cart[id]=(cart[id]||0)+1; persistCart(); openCart(); })); }
function persistCart(){ localStorage.setItem('edentoyco-cart',JSON.stringify(cart)); updateCart(); }
function updateCart(){ const count=Object.values(cart).reduce((a,b)=>a+b,0); document.getElementById('cartCount').textContent=count; const rows=Object.entries(cart).map(([id,qty])=>{ const p=products.find(x=>x.id===id); if(!p)return ''; return `<div class="cart-item"><img src="${p.image}" alt="${p.name}"><div><strong>${p.name}</strong><p>${money(p.price)}</p><div class="qty"><button data-qty="${id}" data-delta="-1">−</button><span>${qty}</span><button data-qty="${id}" data-delta="1">+</button></div></div><strong>${money(p.price*qty)}</strong></div>`; }).join(''); document.getElementById('cartItems').innerHTML=rows||'<div class="empty">Your ORBITS bag is empty.</div>'; const subtotal=Object.entries(cart).reduce((sum,[id,qty])=>{ const p=products.find(x=>x.id===id); return sum+(p?p.price*qty:0); },0); document.getElementById('subtotal').textContent=money(subtotal)+' NZD'; document.querySelectorAll('[data-qty]').forEach(btn=>btn.addEventListener('click',()=>{ const id=btn.dataset.qty; cart[id]=(cart[id]||0)+Number(btn.dataset.delta); if(cart[id]<=0)delete cart[id]; persistCart(); })); }
function openCart(){ document.getElementById('cartDrawer').classList.add('open'); document.getElementById('overlay').classList.add('show'); document.getElementById('cartDrawer').setAttribute('aria-hidden','false'); }
function closeCart(){ document.getElementById('cartDrawer').classList.remove('open'); document.getElementById('overlay').classList.remove('show'); document.getElementById('cartDrawer').setAttribute('aria-hidden','true'); }
document.getElementById('cartButton').addEventListener('click',openCart);
document.getElementById('closeCart').addEventListener('click',closeCart);
document.getElementById('overlay').addEventListener('click',closeCart);
document.getElementById('checkoutButton').addEventListener('click',()=>alert('ORBITS checkout integration is not yet live. Connect Stripe, Shopify, or another provider before accepting payment.'));
init();
