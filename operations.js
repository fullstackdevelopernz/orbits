const EDEN_OPS_SUPABASE_URL='https://hbgopsvvoylsxcebllsq.supabase.co';
const EDEN_OPS_PUBLISHABLE_KEY='sb_publishable_fscxNAUGn8qpwoJ4vDET6w_o1VLvTGg';
const edenSupabase=window.supabase.createClient(EDEN_OPS_SUPABASE_URL,EDEN_OPS_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
window.edenSupabase=edenSupabase;
let edenAdminData=null;
let edenAdminRole=null;

function adminEsc(value=''){return String(value).replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[ch]));}
function adminMoney(value,currency='NZD'){try{return new Intl.NumberFormat('en-NZ',{style:'currency',currency}).format(Number(value||0));}catch{return `$${Number(value||0).toFixed(2)}`;}}
function adminDate(value){if(!value)return '—';try{return new Intl.DateTimeFormat('en-NZ',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));}catch{return '—';}}
function adminStatus(value=''){const v=String(value||'unknown').toLowerCase();return `<span class="eden-admin-status ${adminEsc(v)}">${adminEsc(v.replaceAll('_',' '))}</span>`;}

function staffSigninTemplate(message=''){
  return `<section class="eden-admin-shell"><div class="eden-admin-gate"><div class="eden-admin-gate-card"><span class="eden-admin-eyebrow">Eden Toy Co · Staff access</span><h1>Operations sign in.</h1><p>This workspace is separate from customer accounts and is restricted to authorised Eden Toy Co staff.</p><form id="edenOpsSigninForm" class="eden-admin-form"><label>Email address<input name="email" type="email" required autocomplete="username"></label><label>Password<input name="password" type="password" required autocomplete="current-password" minlength="8"></label><button type="submit">Sign in to operations</button></form><div id="edenOpsSigninMessage" class="eden-admin-message" aria-live="polite">${adminEsc(message)}</div><a href="/" class="eden-admin-signout">Return to store</a></div></div></section>`;
}

function deniedTemplate(){
  return `<section class="eden-admin-shell"><div class="eden-admin-gate"><div class="eden-admin-gate-card"><span class="eden-admin-eyebrow">Access denied</span><h1>Staff permission required.</h1><p>This account is a customer account and does not have access to Eden Toy Co operations.</p><button id="edenOpsDeniedReturn" class="eden-admin-button" type="button">Return to store</button></div></div></section>`;
}

function tableRows(items,type){
  if(!items?.length)return '<div class="eden-admin-empty">No records yet.</div>';
  if(type==='orders') return `<div class="eden-admin-table-wrap"><table class="eden-admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Payment</th><th>Fulfilment</th><th>Total</th><th>Placed</th></tr></thead><tbody>${items.map(o=>`<tr><td><strong>#${adminEsc(o.order_number)}</strong></td><td>${adminEsc(o.customer_name)}<br><small>${adminEsc(o.customer_email)}</small></td><td>${adminStatus(o.status)}</td><td>${adminStatus(o.payment_status)}</td><td>${adminStatus(o.fulfilment_status)}</td><td>${adminMoney(o.total,o.currency)}</td><td>${adminDate(o.placed_at||o.created_at)}</td></tr>`).join('')}</tbody></table></div>`;
  if(type==='payments') return `<div class="eden-admin-table-wrap"><table class="eden-admin-table"><thead><tr><th>Provider</th><th>Reference</th><th>Status</th><th>Amount</th><th>Created</th></tr></thead><tbody>${items.map(p=>`<tr><td><strong>${adminEsc(p.provider)}</strong></td><td>${adminEsc(p.provider_reference||'—')}</td><td>${adminStatus(p.status)}</td><td>${adminMoney(p.amount,p.currency)}</td><td>${adminDate(p.paid_at||p.created_at)}</td></tr>`).join('')}</tbody></table></div>`;
  if(type==='products') return `<div class="eden-admin-table-wrap"><table class="eden-admin-table"><thead><tr><th>Orbit</th><th>Collection</th><th>SKU</th><th>Price</th><th>State</th></tr></thead><tbody>${items.map(p=>`<tr><td><strong>${adminEsc(p.name)}</strong></td><td>${adminEsc(p.collection)}</td><td>${adminEsc(p.sku||'—')}</td><td>${adminMoney(p.price_nzd)}</td><td>${p.active?'Active':'Inactive'}</td></tr>`).join('')}</tbody></table></div>`;
  if(type==='reviews') return `<div class="eden-admin-table-wrap"><table class="eden-admin-table"><thead><tr><th>Rating</th><th>Review</th><th>Status</th><th>Moderate</th></tr></thead><tbody>${items.map(r=>`<tr><td>${'★'.repeat(Math.max(0,Math.min(5,Number(r.rating||0))))}</td><td><strong>${adminEsc(r.title||'Review')}</strong><br>${adminEsc(r.body||'')}</td><td>${adminStatus(r.status)}</td><td><button data-review-id="${r.id}" data-review-status="approved">Approve</button> <button data-review-id="${r.id}" data-review-status="rejected">Reject</button></td></tr>`).join('')}</tbody></table></div>`;
  return '<div class="eden-admin-empty">No records yet.</div>';
}

async function edenLoadAdminData(){
  const [orders,payments,products,fulfilments,batches,messages,reviews]=await Promise.all([
    edenSupabase.from('eden_orders').select('*').order('created_at',{ascending:false}).limit(200),
    edenSupabase.from('eden_payments').select('*').order('created_at',{ascending:false}).limit(200),
    edenSupabase.from('eden_products').select('*').order('sort_order',{ascending:true}).limit(200),
    edenSupabase.from('eden_fulfilments').select('*').order('created_at',{ascending:false}).limit(200),
    edenSupabase.from('eden_supplier_batches').select('*').order('created_at',{ascending:false}).limit(100),
    edenSupabase.from('eden_customer_messages').select('*').order('created_at',{ascending:false}).limit(200),
    edenSupabase.from('eden_product_reviews').select('*').order('created_at',{ascending:false}).limit(200)
  ]);
  const failure=[orders,payments,products,fulfilments,batches,messages,reviews].find(x=>x.error);if(failure)throw failure.error;
  return {orders:orders.data||[],payments:payments.data||[],products:products.data||[],fulfilments:fulfilments.data||[],batches:batches.data||[],messages:messages.data||[],reviews:reviews.data||[]};
}

function operationsTemplate(user,role,data){
  const revenue=data.payments.filter(p=>['paid','completed'].includes(p.status)).reduce((s,p)=>s+Number(p.amount||0),0);
  const awaiting=data.orders.filter(o=>o.payment_status==='paid'&&!['shipped','delivered'].includes(o.fulfilment_status)).length;
  const openMessages=data.messages.filter(m=>!['resolved','closed'].includes(m.status)).length;
  return `<section class="eden-admin-shell"><header class="eden-admin-header"><div><span class="eden-admin-eyebrow">Eden Toy Co · ${adminEsc(role.role)}</span><h1>Commerce control room.</h1></div><div class="eden-admin-header-actions"><span class="eden-admin-user">${adminEsc(user.email)}</span><button id="edenOpsSignOut" class="eden-admin-signout" type="button">Sign out</button></div></header><div class="eden-admin-layout"><nav class="eden-admin-nav"><div class="eden-admin-brand">orbits</div>${[['dashboard','Overview'],['operations','Order operations'],['orders','Orders'],['payments','Payments'],['products','Products'],['fulfilment','Fulfilment'],['suppliers','Supplier batches'],['messages','Messages'],['reviews','Reviews']].map(([k,l],i)=>`<button type="button" data-admin-view="${k}" class="${i===0?'active':''}">${l}</button>`).join('')}<small>Staff workspace · not customer facing</small></nav><main class="eden-admin-main">
  <section class="eden-admin-section active" data-admin-section="dashboard"><div class="eden-admin-section-head"><div><h2>Today at a glance</h2><p>Live operational state from Eden Toy Co.</p></div></div><div class="eden-admin-metrics"><div class="eden-admin-metric"><span>Orders</span><strong>${data.orders.length}</strong></div><div class="eden-admin-metric"><span>Paid revenue</span><strong>${adminMoney(revenue)}</strong></div><div class="eden-admin-metric"><span>Awaiting shipment</span><strong>${awaiting}</strong></div><div class="eden-admin-metric"><span>Open messages</span><strong>${openMessages}</strong></div></div><div class="eden-admin-card"><h3>Latest orders</h3>${tableRows(data.orders.slice(0,10),'orders')}</div></section>
  <section class="eden-admin-section" data-admin-section="operations"><div class="eden-admin-card"><div class="eden-admin-empty">Loading controlled order operations…</div></div></section>
  <section class="eden-admin-section" data-admin-section="orders"><div class="eden-admin-section-head"><div><h2>Orders</h2><p>Customer orders and current state.</p></div></div><div class="eden-admin-card">${tableRows(data.orders,'orders')}</div></section>
  <section class="eden-admin-section" data-admin-section="payments"><div class="eden-admin-section-head"><div><h2>Payments</h2><p>PayPal and BlinkPay payment records.</p></div></div><div class="eden-admin-card">${tableRows(data.payments,'payments')}</div></section>
  <section class="eden-admin-section" data-admin-section="products"><div class="eden-admin-section-head"><div><h2>Products</h2><p>Live ORBITS catalogue.</p></div></div><div class="eden-admin-card">${tableRows(data.products,'products')}</div></section>
  <section class="eden-admin-section" data-admin-section="fulfilment"><div class="eden-admin-section-head"><div><h2>Fulfilment</h2><p>Shipment and delivery records.</p></div></div><div class="eden-admin-card"><div class="eden-admin-empty">${data.fulfilments.length} fulfilment records.</div></div></section>
  <section class="eden-admin-section" data-admin-section="suppliers"><div class="eden-admin-section-head"><div><h2>Supplier batches</h2><p>Production batching and supplier allocation.</p></div></div><div class="eden-admin-card"><div class="eden-admin-empty">${data.batches.length} production batches recorded.</div></div></section>
  <section class="eden-admin-section" data-admin-section="messages"><div class="eden-admin-section-head"><div><h2>Messages</h2><p>Customer support correspondence.</p></div></div><div class="eden-admin-card">${data.messages.length?data.messages.map(m=>`<article class="eden-admin-list-item"><strong>${adminEsc(m.subject||'Customer message')}</strong><span>${adminEsc(m.customer_email||m.channel||'')}</span><p>${adminEsc(m.body||'')}</p>${adminStatus(m.status)}</article>`).join(''):'<div class="eden-admin-empty">No customer messages.</div>'}</div></section>
  <section class="eden-admin-section" data-admin-section="reviews"><div class="eden-admin-section-head"><div><h2>Reviews</h2><p>Moderate customer reviews.</p></div></div><div class="eden-admin-card">${tableRows(data.reviews,'reviews')}</div></section>
</main></div></section>`;
}

function bindOperationsConsole(){
  document.querySelectorAll('[data-admin-view]').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('[data-admin-view]').forEach(b=>b.classList.toggle('active',b===btn));
    document.querySelectorAll('[data-admin-section]').forEach(s=>s.classList.toggle('active',s.dataset.adminSection===btn.dataset.adminView));
    if(btn.dataset.adminView==='operations'&&typeof edenOpsLoad==='function')edenOpsLoad();
  }));
  document.getElementById('edenOpsSignOut')?.addEventListener('click',async()=>{await edenSupabase.auth.signOut();location.replace('/');});
  document.querySelectorAll('[data-review-id]').forEach(btn=>btn.addEventListener('click',async()=>{
    btn.disabled=true;
    const {error}=await edenSupabase.from('eden_product_reviews').update({status:btn.dataset.reviewStatus,moderated_at:new Date().toISOString()}).eq('id',btn.dataset.reviewId);
    if(error){btn.disabled=false;alert(error.message);return;}
    await renderOperations();
  }));
}

async function renderOperations(){
  if(!location.hash.startsWith('#admin'))history.replaceState(null,'',location.pathname+'#admin');
  const app=document.getElementById('app');
  const {data:{session}}=await edenSupabase.auth.getSession();
  if(!session?.user){app.innerHTML=staffSigninTemplate();bindStaffSignin();return;}
  const {data:role,error}=await edenSupabase.from('eden_staff_roles').select('*').eq('user_id',session.user.id).eq('active',true).maybeSingle();
  if(error||!role){app.innerHTML=deniedTemplate();document.getElementById('edenOpsDeniedReturn')?.addEventListener('click',async()=>{await edenSupabase.auth.signOut();location.replace('/');});return;}
  edenAdminRole=role;
  try{edenAdminData=await edenLoadAdminData();app.innerHTML=operationsTemplate(session.user,role,edenAdminData);bindOperationsConsole();}
  catch(err){app.innerHTML=`<section class="eden-admin-shell"><div class="eden-admin-gate"><div class="eden-admin-gate-card"><span class="eden-admin-eyebrow">Operations error</span><h1>Unable to load operations.</h1><p>${adminEsc(err.message||'Unknown error')}</p></div></div></section>`;}
}

function bindStaffSignin(){
  document.getElementById('edenOpsSigninForm')?.addEventListener('submit',async e=>{
    e.preventDefault();const fd=new FormData(e.currentTarget);const msg=document.getElementById('edenOpsSigninMessage');if(msg)msg.textContent='Signing in…';
    const {data,error}=await edenSupabase.auth.signInWithPassword({email:String(fd.get('email')||'').trim(),password:String(fd.get('password')||'')});
    if(error){if(msg)msg.textContent=error.message;return;}
    const {data:role}=await edenSupabase.from('eden_staff_roles').select('*').eq('user_id',data.user.id).eq('active',true).maybeSingle();
    if(!role){await edenSupabase.auth.signOut();app.innerHTML=deniedTemplate();document.getElementById('edenOpsDeniedReturn')?.addEventListener('click',()=>location.replace('/'));return;}
    await renderOperations();
  });
}

document.addEventListener('DOMContentLoaded',renderOperations);
edenSupabase.auth.onAuthStateChange((event)=>{if(event==='SIGNED_OUT'&&location.pathname.endsWith('/operations.html'))setTimeout(renderOperations,0);});
