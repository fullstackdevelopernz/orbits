let edenAdminData = null;

function edenAdminRouteActive(){ return location.hash === '#admin' || location.hash.startsWith('#admin/'); }
function adminEsc(value=''){ return String(value).replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[ch])); }
function adminMoney(value,currency='NZD'){ return new Intl.NumberFormat('en-NZ',{style:'currency',currency}).format(Number(value||0)); }
function adminDate(value){ if(!value) return '—'; try{return new Intl.DateTimeFormat('en-NZ',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));}catch{return '—';} }
function adminStatus(value=''){ const v=String(value||'unknown').toLowerCase(); return `<span class="eden-admin-status ${adminEsc(v)}">${adminEsc(v.replaceAll('_',' '))}</span>`; }

function edenAdminMessage(message,tone='info'){
  const el=document.getElementById('edenAdminMessage'); if(!el) return; el.textContent=message||''; el.dataset.tone=tone;
}

function edenAdminSignedOutTemplate(){
  return `<section class="eden-admin-shell"><div class="eden-admin-gate"><div class="eden-admin-gate-card">
    <span class="eden-admin-eyebrow">Eden Toy Co · Staff only</span>
    <h1>Store operations.</h1>
    <p>Sign in with your Eden Toy Co staff account to manage orders, customers, fulfilment, suppliers, messages and reviews.</p>
    <form id="edenAdminSigninForm" class="eden-admin-form">
      <label>Email address<input name="email" type="email" required autocomplete="email"></label>
      <label>Password<input name="password" type="password" required autocomplete="current-password" minlength="8"></label>
      <button type="submit">Sign in to staff console</button>
    </form>
    <div id="edenAdminMessage" class="eden-admin-message" aria-live="polite"></div>
  </div></div></section>`;
}

function edenAdminDeniedTemplate(user){
  return `<section class="eden-admin-shell"><div class="eden-admin-gate"><div class="eden-admin-gate-card">
    <span class="eden-admin-eyebrow">Access controlled</span><h1>Staff access required.</h1>
    <p>${adminEsc(user.email||'This account')} is authenticated, but it has not been assigned an active Eden Toy Co staff role.</p>
    <button id="edenAdminSignOutDenied" class="eden-admin-button" type="button">Sign out</button>
  </div></div></section>`;
}

function adminMetric(label,value,note=''){
  return `<div class="eden-admin-metric"><span>${label}</span><strong>${value}</strong>${note?`<em>${note}</em>`:''}</div>`;
}

function adminOrdersTable(orders){
  if(!orders?.length) return `<div class="eden-admin-empty">No orders have been received yet.</div>`;
  return `<div class="eden-admin-table-wrap"><table class="eden-admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Payment</th><th>Fulfilment</th><th>Total</th><th>Placed</th></tr></thead><tbody>${orders.map(o=>`<tr><td><strong>#${adminEsc(o.order_number)}</strong></td><td><strong>${adminEsc(o.customer_name||'Customer')}</strong><br>${adminEsc(o.customer_email||'')}</td><td>${adminStatus(o.status)}</td><td>${adminStatus(o.payment_status)}</td><td>${adminStatus(o.fulfilment_status)}</td><td><strong>${adminMoney(o.total,o.currency||'NZD')}</strong></td><td>${adminDate(o.placed_at||o.created_at)}</td></tr>`).join('')}</tbody></table></div>`;
}

function adminPaymentsTable(items){
  if(!items?.length) return `<div class="eden-admin-empty">No payment records yet.</div>`;
  return `<div class="eden-admin-table-wrap"><table class="eden-admin-table"><thead><tr><th>Provider</th><th>Reference</th><th>Status</th><th>Amount</th><th>Paid</th></tr></thead><tbody>${items.map(p=>`<tr><td><strong>${adminEsc(p.provider)}</strong></td><td>${adminEsc(p.provider_reference||'—')}</td><td>${adminStatus(p.status)}</td><td>${adminMoney(p.amount,p.currency||'NZD')}</td><td>${adminDate(p.paid_at||p.created_at)}</td></tr>`).join('')}</tbody></table></div>`;
}

function adminProductsTable(items){
  if(!items?.length) return `<div class="eden-admin-empty">No products have been synced into the commerce database yet.</div>`;
  return `<div class="eden-admin-table-wrap"><table class="eden-admin-table"><thead><tr><th>Product</th><th>Collection</th><th>SKU</th><th>Price</th><th>Preorder</th><th>PayPal</th></tr></thead><tbody>${items.map(p=>`<tr><td><strong>${adminEsc(p.name)}</strong></td><td>${adminEsc(p.collection)}</td><td>${adminEsc(p.sku||'—')}</td><td>${adminMoney(p.price_nzd)}</td><td>${p.preorder?'Yes':'No'}</td><td>${p.paypal_payment_url?'Connected':'Not linked'}</td></tr>`).join('')}</tbody></table></div>`;
}

function adminFulfilmentTable(items){
  if(!items?.length) return `<div class="eden-admin-empty">No fulfilments have been created yet.</div>`;
  return `<div class="eden-admin-table-wrap"><table class="eden-admin-table"><thead><tr><th>Status</th><th>Carrier</th><th>Tracking</th><th>Shipped</th><th>Delivered</th></tr></thead><tbody>${items.map(f=>`<tr><td>${adminStatus(f.status)}</td><td>${adminEsc(f.carrier||'—')}</td><td>${adminEsc(f.tracking_number||'—')}</td><td>${adminDate(f.shipped_at)}</td><td>${adminDate(f.delivered_at)}</td></tr>`).join('')}</tbody></table></div>`;
}

function adminSupplierTable(items){
  if(!items?.length) return `<div class="eden-admin-empty">No supplier production batches yet.</div>`;
  return `<div class="eden-admin-table-wrap"><table class="eden-admin-table"><thead><tr><th>Batch</th><th>Status</th><th>Sent</th><th>Expected</th><th>Received</th><th>Notes</th></tr></thead><tbody>${items.map(b=>`<tr><td><strong>#${adminEsc(b.batch_number)}</strong></td><td>${adminStatus(b.status)}</td><td>${adminDate(b.sent_at)}</td><td>${adminDate(b.expected_at)}</td><td>${adminDate(b.received_at)}</td><td>${adminEsc(b.notes||'')}</td></tr>`).join('')}</tbody></table></div>`;
}

function adminMessagesList(items){
  if(!items?.length) return `<div class="eden-admin-empty">No customer messages yet.</div>`;
  return `<div class="eden-admin-list">${items.map(m=>`<article class="eden-admin-list-item"><strong>${adminEsc(m.subject||'Customer message')}</strong><span>${adminEsc(m.channel)} · ${adminEsc(m.direction.replaceAll('_',' '))} · ${adminDate(m.created_at)}</span><p>${adminEsc(m.body||'')}</p>${adminStatus(m.status)}</article>`).join('')}</div>`;
}

function adminReviewsTable(items){
  if(!items?.length) return `<div class="eden-admin-empty">No product reviews yet.</div>`;
  return `<div class="eden-admin-table-wrap"><table class="eden-admin-table"><thead><tr><th>Rating</th><th>Review</th><th>Status</th><th>Verified</th><th>Submitted</th><th>Moderation</th></tr></thead><tbody>${items.map(r=>`<tr><td><strong>${'★'.repeat(Math.max(0,Math.min(5,r.rating||0)))}</strong></td><td><strong>${adminEsc(r.title||'Review')}</strong><br>${adminEsc(r.body||'')}</td><td>${adminStatus(r.status)}</td><td>${r.verified_purchase?'Yes':'No'}</td><td>${adminDate(r.created_at)}</td><td><div class="eden-admin-review-actions"><button data-review-id="${r.id}" data-review-status="approved">Approve</button><button data-review-id="${r.id}" data-review-status="rejected">Reject</button></div></td></tr>`).join('')}</tbody></table></div>`;
}

function edenAdminConsoleTemplate(user,role,data){
  const paidRevenue=(data.payments||[]).filter(p=>p.status==='paid'||p.status==='completed').reduce((sum,p)=>sum+Number(p.amount||0),0);
  const openMessages=(data.messages||[]).filter(m=>!['closed','resolved'].includes(m.status)).length;
  const pendingReviews=(data.reviews||[]).filter(r=>r.status==='pending').length;
  const awaitingShip=(data.orders||[]).filter(o=>o.payment_status==='paid' && !['shipped','delivered'].includes(o.fulfilment_status)).length;
  return `<section class="eden-admin-shell">
    <header class="eden-admin-header"><div><span class="eden-admin-eyebrow">Eden Toy Co · ${adminEsc(role.role)}</span><h1>Commerce control room.</h1></div><div class="eden-admin-header-actions"><span class="eden-admin-user">${adminEsc(user.email||'')}</span><button id="edenAdminSignOut" class="eden-admin-signout" type="button">Sign out</button></div></header>
    <div class="eden-admin-layout">
      <nav class="eden-admin-nav" aria-label="Admin navigation"><div class="eden-admin-brand">orbits</div>
        ${[['dashboard','Overview'],['orders','Orders'],['payments','Payments'],['products','Products'],['fulfilment','Fulfilment'],['suppliers','Supplier batches'],['messages','Messages'],['reviews','Reviews']].map(([key,label],i)=>`<button class="${i===0?'active':''}" data-admin-view="${key}" type="button">${label}</button>`).join('')}
        <small>Protected by Supabase Auth + Eden staff roles.</small>
      </nav>
      <main class="eden-admin-main">
        <section class="eden-admin-section active" data-admin-section="dashboard"><div class="eden-admin-section-head"><div><h2>Today at a glance</h2><p>Operational signals from the live Eden commerce database.</p></div></div><div class="eden-admin-metrics">${adminMetric('Orders',data.orders.length,'All recorded orders')}${adminMetric('Paid revenue',adminMoney(paidRevenue),'Recorded successful payments')}${adminMetric('Awaiting shipment',awaitingShip,'Paid orders not shipped')}${adminMetric('Open messages',openMessages,'Customer enquiries requiring attention')}</div><div class="eden-admin-grid"><div class="eden-admin-card"><h3>Latest orders</h3>${adminOrdersTable(data.orders.slice(0,8))}</div><div class="eden-admin-card"><h3>Control queue</h3><div class="eden-admin-list"><div class="eden-admin-list-item"><strong>${pendingReviews} reviews awaiting moderation</strong><span>Approve or reject before publication.</span></div><div class="eden-admin-list-item"><strong>${data.batches.filter(b=>!['received','closed'].includes(b.status)).length} supplier batches active</strong><span>Production and inbound supply queue.</span></div><div class="eden-admin-list-item"><strong>${data.products.filter(p=>!p.paypal_payment_url).length} products without PayPal links</strong><span>Payment URLs still need to be connected.</span></div></div></div></div></section>
        <section class="eden-admin-section" data-admin-section="orders"><div class="eden-admin-section-head"><div><h2>Orders</h2><p>Customer orders and operational status.</p></div></div><div class="eden-admin-card">${adminOrdersTable(data.orders)}</div></section>
        <section class="eden-admin-section" data-admin-section="payments"><div class="eden-admin-section-head"><div><h2>Payments</h2><p>Provider references and payment state.</p></div></div><div class="eden-admin-card">${adminPaymentsTable(data.payments)}</div></section>
        <section class="eden-admin-section" data-admin-section="products"><div class="eden-admin-section-head"><div><h2>Products</h2><p>Commerce catalogue and payment-link readiness.</p></div></div><div class="eden-admin-card">${adminProductsTable(data.products)}</div></section>
        <section class="eden-admin-section" data-admin-section="fulfilment"><div class="eden-admin-section-head"><div><h2>Fulfilment</h2><p>Shipment and delivery tracking.</p></div></div><div class="eden-admin-card">${adminFulfilmentTable(data.fulfilments)}</div></section>
        <section class="eden-admin-section" data-admin-section="suppliers"><div class="eden-admin-section-head"><div><h2>Supplier batches</h2><p>Bulk production and inbound supply.</p></div></div><div class="eden-admin-card">${adminSupplierTable(data.batches)}</div></section>
        <section class="eden-admin-section" data-admin-section="messages"><div class="eden-admin-section-head"><div><h2>Messages</h2><p>Customer-account and email-channel correspondence records.</p></div></div><div class="eden-admin-card">${adminMessagesList(data.messages)}</div></section>
        <section class="eden-admin-section" data-admin-section="reviews"><div class="eden-admin-section-head"><div><h2>Reviews</h2><p>Moderate customer product reviews.</p></div></div><div class="eden-admin-card">${adminReviewsTable(data.reviews)}</div></section>
      </main>
    </div>
  </section>`;
}

async function edenLoadAdminData(){
  const [orders,payments,products,fulfilments,batches,messages,reviews] = await Promise.all([
    edenSupabase.from('eden_orders').select('*').order('created_at',{ascending:false}).limit(100),
    edenSupabase.from('eden_payments').select('*').order('created_at',{ascending:false}).limit(100),
    edenSupabase.from('eden_products').select('*').order('sort_order',{ascending:true}).limit(200),
    edenSupabase.from('eden_fulfilments').select('*').order('created_at',{ascending:false}).limit(100),
    edenSupabase.from('eden_supplier_batches').select('*').order('created_at',{ascending:false}).limit(100),
    edenSupabase.from('eden_customer_messages').select('*').order('created_at',{ascending:false}).limit(100),
    edenSupabase.from('eden_product_reviews').select('*').order('created_at',{ascending:false}).limit(100)
  ]);
  const failure=[orders,payments,products,fulfilments,batches,messages,reviews].find(r=>r.error); if(failure?.error) throw failure.error;
  return {orders:orders.data||[],payments:payments.data||[],products:products.data||[],fulfilments:fulfilments.data||[],batches:batches.data||[],messages:messages.data||[],reviews:reviews.data||[]};
}

async function renderEdenAdmin(){
  if(!edenAdminRouteActive()) return;
  const app=document.getElementById('app'); if(!app) return;
  const {data:{session}}=await edenSupabase.auth.getSession();
  if(!session?.user){ app.innerHTML=edenAdminSignedOutTemplate(); bindEdenAdminSignedOut(); return; }
  const {data:role,error}=await edenSupabase.from('eden_staff_roles').select('*').eq('user_id',session.user.id).eq('active',true).maybeSingle();
  if(error || !role){ app.innerHTML=edenAdminDeniedTemplate(session.user); document.getElementById('edenAdminSignOutDenied')?.addEventListener('click',async()=>{await edenSupabase.auth.signOut();renderEdenAdmin();}); return; }
  try{ edenAdminData=await edenLoadAdminData(); app.innerHTML=edenAdminConsoleTemplate(session.user,role,edenAdminData); bindEdenAdminConsole(); }
  catch(err){ app.innerHTML=`<section class="eden-admin-shell"><div class="eden-admin-gate"><div class="eden-admin-gate-card"><span class="eden-admin-eyebrow">Admin data error</span><h1>Console could not load.</h1><p>${adminEsc(err.message||'Unable to load commerce data.')}</p></div></div></section>`; }
}

function bindEdenAdminSignedOut(){
  document.getElementById('edenAdminSigninForm')?.addEventListener('submit',async e=>{e.preventDefault();edenAdminMessage('Signing in…');const fd=new FormData(e.currentTarget);const {error}=await edenSupabase.auth.signInWithPassword({email:fd.get('email'),password:fd.get('password')});if(error)return edenAdminMessage(error.message,'error');await renderEdenAdmin();});
}

function bindEdenAdminConsole(){
  document.querySelectorAll('[data-admin-view]').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('[data-admin-view]').forEach(b=>b.classList.toggle('active',b===btn));document.querySelectorAll('[data-admin-section]').forEach(s=>s.classList.toggle('active',s.dataset.adminSection===btn.dataset.adminView));}));
  document.getElementById('edenAdminSignOut')?.addEventListener('click',async()=>{await edenSupabase.auth.signOut();await renderEdenAdmin();});
  document.querySelectorAll('[data-review-id]').forEach(btn=>btn.addEventListener('click',async()=>{btn.disabled=true;const {error}=await edenSupabase.from('eden_product_reviews').update({status:btn.dataset.reviewStatus,updated_at:new Date().toISOString()}).eq('id',btn.dataset.reviewId);if(error){btn.disabled=false;alert(error.message);return;}await renderEdenAdmin();}));
}

window.addEventListener('hashchange',()=>setTimeout(renderEdenAdmin,0));
window.addEventListener('DOMContentLoaded',()=>setTimeout(renderEdenAdmin,0));
edenSupabase.auth.onAuthStateChange(()=>{ if(edenAdminRouteActive()) setTimeout(renderEdenAdmin,0); });
