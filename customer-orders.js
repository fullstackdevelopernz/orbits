(function(){
  function esc(v=''){return String(v).replace(/[&<>'\"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','\"':'&quot;'}[ch]));}
  function money(v,c='NZD'){try{return new Intl.NumberFormat('en-NZ',{style:'currency',currency:c}).format(Number(v||0));}catch{return `$${Number(v||0).toFixed(2)}`;}}
  function fmt(v){if(!v)return '—';try{return new Intl.DateTimeFormat('en-NZ',{dateStyle:'medium',timeStyle:'short'}).format(new Date(v));}catch{return '—';}}
  function status(v=''){const s=String(v||'unknown').toLowerCase();return `<span class="eden-customer-order-status ${esc(s)}">${esc(s.replaceAll('_',' '))}</span>`;}

  async function loadOrders(){
    if(location.hash!=='#account'||typeof edenSupabase==='undefined')return;
    const host=document.querySelector('.eden-account-signed-in');
    if(!host||host.querySelector('.eden-customer-orders'))return;
    const {data:{session}}=await edenSupabase.auth.getSession();
    if(!session?.user)return;
    try{await edenSupabase.rpc('eden_expire_stale_payments');}catch{}
    const {data:orders,error}=await edenSupabase.from('eden_orders').select('id,order_number,status,payment_status,fulfilment_status,currency,total,placed_at,created_at,eden_order_items(id,product_name,sku,quantity,line_total),eden_payments(id,provider,provider_reference,status,amount,paid_at,created_at,expires_at),eden_fulfilments(id,status,carrier,tracking_number,tracking_url,shipped_at,delivered_at)').eq('customer_id',session.user.id).order('created_at',{ascending:false}).limit(100);
    const section=document.createElement('section');section.className='eden-customer-orders';
    if(error){section.innerHTML=`<div class="eden-customer-orders-head"><div><span>Orders</span><h2>Your orders</h2></div></div><p class="eden-orders-empty">${esc(error.message)}</p>`;host.after(section);return;}
    section.innerHTML=`<div class="eden-customer-orders-head"><div><span>Your purchases</span><h2>Orders & tracking</h2><p>Payment, production and delivery status for your ORBITS orders.</p></div></div><div class="eden-customer-order-list">${(orders||[]).length?(orders||[]).map(orderCard).join(''):'<div class="eden-orders-empty">You do not have any orders yet.</div>'}</div>`;
    host.after(section);
  }

  function orderCard(o){
    const items=o.eden_order_items||[];
    const payments=(o.eden_payments||[]).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
    const payment=payments[0];
    const fulfils=(o.eden_fulfilments||[]).sort((a,b)=>new Date(b.shipped_at||0)-new Date(a.shipped_at||0));
    const fulfil=fulfils[0];
    const tracking=fulfil?.tracking_number?`<div class="eden-order-tracking"><span>${esc(fulfil.carrier||'Carrier')}</span><strong>${esc(fulfil.tracking_number)}</strong>${fulfil.tracking_url?`<a href="${esc(fulfil.tracking_url)}" target="_blank" rel="noopener">Track parcel</a>`:''}</div>`:'';
    return `<article class="eden-customer-order"><div class="eden-customer-order-top"><div><span>ORDER #${esc(o.order_number)}</span><h3>${money(o.total,o.currency||'NZD')}</h3><small>Placed ${fmt(o.placed_at||o.created_at)}</small></div><div class="eden-order-statuses"><div><small>Payment</small>${status(o.payment_status)}</div><div><small>Order</small>${status(o.status)}</div><div><small>Fulfilment</small>${status(o.fulfilment_status)}</div></div></div><div class="eden-order-items">${items.map(i=>`<div><strong>${esc(i.product_name)}</strong><span>${esc(i.sku||'')} · Qty ${Number(i.quantity||0)}</span><b>${money(i.line_total,o.currency||'NZD')}</b></div>`).join('')}</div>${payment?`<div class="eden-order-payment"><span>Payment method</span><strong>${esc(payment.provider==='blinkpay'?'Pay by Bank · BlinkPay':'PayPal')}</strong><small>${esc(payment.provider_reference||'')}</small></div>`:''}${tracking}<a class="eden-order-message-link" href="#account" data-message-order="${esc(o.id)}">Message us about this order</a></article>`;
  }

  document.addEventListener('click',e=>{
    const link=e.target.closest?.('[data-message-order]');if(!link)return;
    sessionStorage.setItem('eden-message-order-id',link.dataset.messageOrder);
    setTimeout(()=>document.querySelector('.eden-customer-messages')?.scrollIntoView({behavior:'smooth',block:'start'}),100);
  });
  const obs=new MutationObserver(()=>setTimeout(loadOrders,0));
  document.addEventListener('DOMContentLoaded',()=>{obs.observe(document.body,{childList:true,subtree:true});setTimeout(loadOrders,100);});
  window.addEventListener('hashchange',()=>setTimeout(loadOrders,100));
})();
