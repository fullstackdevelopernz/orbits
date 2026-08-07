(function(){
  function esc(v=''){return String(v).replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[ch]));}
  function status(v=''){return `<span class="eden-admin-status ${esc(v)}">${esc(String(v).replaceAll('_',' '))}</span>`;}

  async function loadSupplierOps(){
    if(location.hash!=='#admin' && !location.hash.startsWith('#admin/')) return;
    if(typeof edenSupabase==='undefined') return;
    const section=document.querySelector('[data-admin-section="suppliers"]');
    if(!section || section.querySelector('.eden-supplier-ops')) return;

    const [{data:suppliers,error:supplierError},{data:backlog,error:backlogError},{data:batches,error:batchError}] = await Promise.all([
      edenSupabase.from('eden_suppliers').select('id,name,contact_name,email,active').eq('active',true).order('name'),
      edenSupabase.from('eden_orders').select('id,order_number,status,payment_status,eden_order_items(id,sku,product_name,quantity,eden_order_batch_allocations(quantity))').eq('payment_status','paid').in('status',['paid','processing']),
      edenSupabase.from('eden_supplier_batches').select('id,batch_number,status,supplier_id,notes,created_at,sent_at,expected_at,received_at,eden_supplier_batch_items(id,sku,product_name,quantity_ordered,quantity_received)').order('created_at',{ascending:false}).limit(50)
    ]);
    if(supplierError||backlogError||batchError) return;

    let unallocatedUnits=0;
    let readyOrders=0;
    for(const order of backlog||[]){
      let orderUnits=0;
      for(const item of order.eden_order_items||[]){
        const allocated=(item.eden_order_batch_allocations||[]).reduce((s,a)=>s+Number(a.quantity||0),0);
        orderUnits+=Math.max(0,Number(item.quantity||0)-allocated);
      }
      if(orderUnits>0){readyOrders++;unallocatedUnits+=orderUnits;}
    }

    const supplierOptions=(suppliers||[]).map(s=>`<option value="${s.id}">${esc(s.name)}${s.contact_name?` · ${esc(s.contact_name)}`:''}</option>`).join('');
    const batchCards=(batches||[]).map(b=>{
      const units=(b.eden_supplier_batch_items||[]).reduce((s,i)=>s+Number(i.quantity_ordered||0),0);
      const received=(b.eden_supplier_batch_items||[]).reduce((s,i)=>s+Number(i.quantity_received||0),0);
      const lines=(b.eden_supplier_batch_items||[]).map(i=>`<tr><td>${esc(i.sku||'—')}</td><td>${esc(i.product_name)}</td><td>${Number(i.quantity_ordered||0)}</td><td>${Number(i.quantity_received||0)}</td></tr>`).join('');
      return `<details class="eden-supplier-batch-card"><summary><strong>Batch #${esc(b.batch_number)}</strong>${status(b.status)}<span>${units} units · ${received} received</span></summary><div class="eden-supplier-batch-body"><p>${esc(b.notes||'No notes')}</p>${lines?`<div class="eden-admin-table-wrap"><table class="eden-admin-table"><thead><tr><th>SKU</th><th>Orbit</th><th>Ordered</th><th>Received</th></tr></thead><tbody>${lines}</tbody></table></div>`:''}</div></details>`;
    }).join('');

    const panel=document.createElement('div');
    panel.className='eden-supplier-ops';
    panel.innerHTML=`
      <div class="eden-supplier-control-card">
        <div class="eden-supplier-control-head"><div><span class="eden-admin-eyebrow">Production queue</span><h3>Build supplier order from paid preorders</h3><p>Automatically groups every paid, unallocated Orbit by SKU and preserves the customer-order allocation behind each unit.</p></div><div class="eden-supplier-backlog"><strong>${unallocatedUnits}</strong><span>units ready</span><small>${readyOrders} paid orders</small></div></div>
        <div class="eden-supplier-form-row">
          <label>Supplier<select id="edenSupplierBatchSupplier"><option value="">Unassigned supplier</option>${supplierOptions}</select></label>
          <label>Batch note<input id="edenSupplierBatchNote" type="text" placeholder="e.g. First Zodiac preorder production run"></label>
          <button id="edenCreateSupplierBatch" type="button" ${unallocatedUnits===0?'disabled':''}>Create production batch</button>
        </div>
        <div id="edenSupplierBatchMessage" class="eden-admin-message" aria-live="polite"></div>
      </div>
      <div class="eden-supplier-batch-list"><h3>Production batches</h3>${batchCards||'<div class="eden-admin-empty">No supplier batches yet.</div>'}</div>`;

    section.querySelector('.eden-admin-section-head')?.after(panel);

    document.getElementById('edenCreateSupplierBatch')?.addEventListener('click',async()=>{
      const button=document.getElementById('edenCreateSupplierBatch');
      const message=document.getElementById('edenSupplierBatchMessage');
      const supplierId=document.getElementById('edenSupplierBatchSupplier')?.value||null;
      const note=document.getElementById('edenSupplierBatchNote')?.value?.trim()||null;
      button.disabled=true; button.textContent='Creating batch…'; if(message){message.textContent='Consolidating paid orders by Orbit SKU…';message.dataset.tone='info';}
      const {data,error}=await edenSupabase.rpc('eden_staff_create_supplier_batch',{p_supplier_id:supplierId||null,p_notes:note});
      if(error){ if(message){message.textContent=error.message||'Unable to create supplier batch.';message.dataset.tone='error';} button.disabled=false; button.textContent='Create production batch'; return; }
      if(message){message.textContent=`Batch #${data.batch_number} created: ${data.units} units across ${data.orders} customer orders.`;message.dataset.tone='success';}
      setTimeout(()=>{document.querySelector('.eden-supplier-ops')?.remove();loadSupplierOps();},500);
    });
  }

  const observer=new MutationObserver(()=>loadSupplierOps());
  window.addEventListener('DOMContentLoaded',()=>{observer.observe(document.body,{subtree:true,childList:true});setTimeout(loadSupplierOps,250);});
  window.addEventListener('hashchange',()=>setTimeout(loadSupplierOps,250));
})();
