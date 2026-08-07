let edenOpsBound = false;
let edenOpsLoading = false;

function edenOpsEsc(value=''){
  return String(value).replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[ch]));
}

function edenOpsMoney(value,currency='NZD'){
  try { return new Intl.NumberFormat('en-NZ',{style:'currency',currency}).format(Number(value||0)); }
  catch { return `$${Number(value||0).toFixed(2)}`; }
}

function edenOpsStatus(value=''){
  const v=String(value||'unknown').toLowerCase();
  return `<span class="eden-ops-status eden-ops-${edenOpsEsc(v)}">${edenOpsEsc(v.replaceAll('_',' '))}</span>`;
}

function edenOpsNextAction(order){
  if(order.payment_status !== 'paid') return {label:'Awaiting PayPal',disabled:true};
  switch(order.status){
    case 'paid': return {label:'Start processing',action:'processing'};
    case 'processing': return {label:'Send to supplier',action:'supplier_ordered'};
    case 'supplier_ordered': return {label:'Ready to ship',action:'ready_to_ship'};
    case 'ready_to_ship': return {label:'Ship order',action:'ship'};
    case 'shipped': return {label:'Mark delivered',action:'delivered'};
    case 'delivered': return {label:'Complete',disabled:true};
    case 'cancelled': return {label:'Cancelled',disabled:true};
    case 'refunded': return {label:'Refunded',disabled:true};
    default: return {label:'Review order',disabled:true};
  }
}

function edenOpsCard(order){
  const next=edenOpsNextAction(order);
  const tracking=order.latest_tracking_number
    ? `<div class="eden-ops-tracking"><span>${edenOpsEsc(order.latest_carrier||'Carrier')}</span><strong>${edenOpsEsc(order.latest_tracking_number)}</strong></div>`
    : '';
  return `<article class="eden-ops-order" data-order-id="${edenOpsEsc(order.id)}">
    <div class="eden-ops-order-head">
      <div><span class="eden-ops-kicker">ORDER #${edenOpsEsc(order.order_number)}</span><h3>${edenOpsEsc(order.customer_name||'Customer')}</h3><p>${edenOpsEsc(order.customer_email||'')}</p></div>
      <strong class="eden-ops-total">${edenOpsMoney(order.total,order.currency||'NZD')}</strong>
    </div>
    <div class="eden-ops-facts">
      <div><span>Payment</span>${edenOpsStatus(order.payment_status)}</div>
      <div><span>Order</span>${edenOpsStatus(order.status)}</div>
      <div><span>Fulfilment</span>${edenOpsStatus(order.fulfilment_status)}</div>
      <div><span>Units</span><strong>${Number(order.unit_count||0)}</strong></div>
    </div>
    ${tracking}
    <div class="eden-ops-actions">
      <button type="button" data-eden-order-action="${next.action||''}" data-order-id="${edenOpsEsc(order.id)}" ${next.disabled?'disabled':''}>${edenOpsEsc(next.label)}</button>
      <button type="button" class="eden-ops-secondary" data-eden-order-detail="${edenOpsEsc(order.id)}">View details</button>
    </div>
    <div class="eden-ops-detail" data-eden-detail-for="${edenOpsEsc(order.id)}" hidden></div>
  </article>`;
}

function edenOpsTemplate(orders){
  const paid=orders.filter(o=>o.payment_status==='paid' && !['delivered','cancelled','refunded'].includes(o.status));
  const pending=orders.filter(o=>o.payment_status!=='paid');
  const complete=orders.filter(o=>['delivered','cancelled','refunded'].includes(o.status));
  return `<div class="eden-ops-wrap">
    <div class="eden-admin-section-head"><div><h2>Order operations</h2><p>Controlled workflow from payment confirmation through supplier processing, shipment and delivery.</p></div><button type="button" class="eden-ops-refresh" id="edenOpsRefresh">Refresh</button></div>
    <div class="eden-ops-summary">
      <div><span>Action queue</span><strong>${paid.length}</strong></div>
      <div><span>Awaiting payment</span><strong>${pending.length}</strong></div>
      <div><span>Closed</span><strong>${complete.length}</strong></div>
    </div>
    <div id="edenOpsMessage" class="eden-ops-message" aria-live="polite"></div>
    <div class="eden-ops-list">${orders.length?orders.map(edenOpsCard).join(''):'<div class="eden-admin-empty">No orders recorded yet.</div>'}</div>
  </div>`;
}

async function edenOpsLoad(){
  if(edenOpsLoading || !window.edenSupabase) return;
  edenOpsLoading=true;
  const host=document.querySelector('[data-admin-section="operations"]');
  if(!host){ edenOpsLoading=false; return; }
  host.innerHTML='<div class="eden-admin-card"><div class="eden-admin-empty">Loading live order operations…</div></div>';
  try{
    const {data,error}=await edenSupabase.from('eden_order_operations').select('*').order('created_at',{ascending:false}).limit(200);
    if(error) throw error;
    host.innerHTML=edenOpsTemplate(data||[]);
    edenOpsBindButtons();
  }catch(err){
    host.innerHTML=`<div class="eden-admin-card"><div class="eden-admin-empty">${edenOpsEsc(err.message||'Unable to load order operations.')}</div></div>`;
  }finally{ edenOpsLoading=false; }
}

function edenOpsMessage(text,tone='info'){
  const el=document.getElementById('edenOpsMessage');
  if(!el) return;
  el.textContent=text||'';
  el.dataset.tone=tone;
}

async function edenOpsTransition(orderId,status){
  edenOpsMessage(`Updating order to ${status.replaceAll('_',' ')}…`);
  const {error}=await edenSupabase.rpc('eden_staff_transition_order',{p_order_id:orderId,p_status:status,p_notes:null});
  if(error) throw error;
}

async function edenOpsShip(orderId){
  const carrier=window.prompt('Carrier name (for example NZ Post, DHL or FedEx):');
  if(!carrier) return false;
  const tracking=window.prompt('Tracking number:');
  if(!tracking) return false;
  const trackingUrl=window.prompt('Tracking URL (optional):')||'';
  edenOpsMessage('Recording shipment and tracking…');
  const {error}=await edenSupabase.rpc('eden_staff_ship_order',{p_order_id:orderId,p_carrier:carrier,p_tracking_number:tracking,p_tracking_url:trackingUrl});
  if(error) throw error;
  return true;
}

async function edenOpsDelivered(orderId){
  edenOpsMessage('Marking order delivered…');
  const {error}=await edenSupabase.rpc('eden_staff_mark_delivered',{p_order_id:orderId});
  if(error) throw error;
}

async function edenOpsDetail(orderId,detailEl){
  if(!detailEl.hidden){ detailEl.hidden=true; return; }
  detailEl.hidden=false;
  detailEl.innerHTML='Loading order detail…';
  try{
    const [items,payments,fulfilments]=await Promise.all([
      edenSupabase.from('eden_order_items').select('*').eq('order_id',orderId).order('created_at'),
      edenSupabase.from('eden_payments').select('*').eq('order_id',orderId).order('created_at',{ascending:false}),
      edenSupabase.from('eden_fulfilments').select('*').eq('order_id',orderId).order('created_at',{ascending:false})
    ]);
    const failure=[items,payments,fulfilments].find(x=>x.error); if(failure) throw failure.error;
    detailEl.innerHTML=`
      <div class="eden-ops-detail-grid">
        <div><h4>Items</h4>${(items.data||[]).map(i=>`<p><strong>${edenOpsEsc(i.product_name)}</strong> × ${Number(i.quantity)} <span>${edenOpsMoney(i.line_total)}</span></p>`).join('')||'<p>No items.</p>'}</div>
        <div><h4>Payment record</h4>${(payments.data||[]).map(p=>`<p>${edenOpsStatus(p.status)} <strong>${edenOpsMoney(p.amount,p.currency||'NZD')}</strong><br><small>${edenOpsEsc(p.provider_reference||'No PayPal reference yet')}</small></p>`).join('')||'<p>No payment record.</p>'}</div>
        <div><h4>Fulfilment</h4>${(fulfilments.data||[]).map(f=>`<p>${edenOpsStatus(f.status)} <strong>${edenOpsEsc(f.carrier||'')}</strong><br><small>${edenOpsEsc(f.tracking_number||'No tracking yet')}</small></p>`).join('')||'<p>Not shipped yet.</p>'}</div>
      </div>`;
  }catch(err){ detailEl.textContent=err.message||'Unable to load detail.'; }
}

function edenOpsBindButtons(){
  document.getElementById('edenOpsRefresh')?.addEventListener('click',edenOpsLoad);
  document.querySelectorAll('[data-eden-order-action]').forEach(btn=>btn.addEventListener('click',async()=>{
    const orderId=btn.dataset.orderId;
    const action=btn.dataset.edenOrderAction;
    if(!orderId||!action) return;
    btn.disabled=true;
    try{
      if(action==='ship'){
        const completed=await edenOpsShip(orderId); if(!completed){btn.disabled=false;return;}
      } else if(action==='delivered') await edenOpsDelivered(orderId);
      else await edenOpsTransition(orderId,action);
      edenOpsMessage('Order updated successfully.','success');
      await edenOpsLoad();
      if(typeof edenLoadAdminData==='function') edenAdminData=await edenLoadAdminData();
    }catch(err){ edenOpsMessage(err.message||'Order update failed.','error'); btn.disabled=false; }
  }));
  document.querySelectorAll('[data-eden-order-detail]').forEach(btn=>btn.addEventListener('click',()=>{
    const id=btn.dataset.edenOrderDetail;
    const detail=document.querySelector(`[data-eden-detail-for="${CSS.escape(id)}"]`);
    if(detail) edenOpsDetail(id,detail);
  }));
}

function edenOpsInject(){
  if(location.hash!=='#admin' && !location.hash.startsWith('#admin/')) return;
  const nav=document.querySelector('.eden-admin-nav');
  const main=document.querySelector('.eden-admin-main');
  if(!nav||!main||nav.querySelector('[data-admin-view="operations"]')) return;

  const button=document.createElement('button');
  button.type='button'; button.dataset.adminView='operations'; button.textContent='Order operations';
  const small=nav.querySelector('small'); nav.insertBefore(button,small||null);

  const section=document.createElement('section');
  section.className='eden-admin-section'; section.dataset.adminSection='operations';
  section.innerHTML='<div class="eden-admin-card"><div class="eden-admin-empty">Loading live order operations…</div></div>';
  main.appendChild(section);

  button.addEventListener('click',()=>{
    document.querySelectorAll('[data-admin-view]').forEach(b=>b.classList.toggle('active',b===button));
    document.querySelectorAll('[data-admin-section]').forEach(s=>s.classList.toggle('active',s===section));
    edenOpsLoad();
  });

  edenOpsBound=true;
}

const edenOpsObserver=new MutationObserver(()=>edenOpsInject());
edenOpsObserver.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('hashchange',()=>setTimeout(edenOpsInject,50));
document.addEventListener('DOMContentLoaded',()=>setTimeout(edenOpsInject,100));
