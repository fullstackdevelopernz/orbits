(function(){
  const MAX_BODY=5000;
  function esc(v=''){return String(v).replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[ch]));}
  function fmt(value){if(!value)return '';try{return new Intl.DateTimeFormat('en-NZ',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));}catch{return '';}}
  function groupThreads(messages){
    const map=new Map();
    for(const m of messages||[]){
      if(!map.has(m.thread_id))map.set(m.thread_id,[]);
      map.get(m.thread_id).push(m);
    }
    return [...map.entries()].map(([threadId,items])=>{
      items.sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));
      const last=items[items.length-1];
      return {threadId,items,last,subject:items[0]?.subject||'ORBITS support',orderId:items.find(x=>x.order_id)?.order_id||null};
    }).sort((a,b)=>new Date(b.last.created_at)-new Date(a.last.created_at));
  }
  function statusLabel(v=''){return String(v).replaceAll('_',' ');}

  async function loadAccountMessages(){
    if(location.hash!=='#account' && !location.hash.startsWith('#account/'))return;
    if(typeof edenSupabase==='undefined')return;
    const {data:{session}}=await edenSupabase.auth.getSession();
    const signedIn=document.querySelector('.eden-account-signed-in');
    if(!session?.user || !signedIn)return;
    if(document.getElementById('edenCustomerMessages'))return;

    const [{data:messages,error:messageError},{data:orders,error:orderError}]=await Promise.all([
      edenSupabase.from('eden_customer_messages').select('id,thread_id,customer_id,order_id,direction,channel,subject,body,status,created_at').eq('customer_id',session.user.id).order('created_at',{ascending:true}).limit(500),
      edenSupabase.from('eden_orders').select('id,order_number,status,payment_status,created_at').eq('customer_id',session.user.id).order('created_at',{ascending:false}).limit(100)
    ]);
    if(messageError||orderError)return;

    const threads=groupThreads(messages||[]);
    const panel=document.createElement('section');
    panel.id='edenCustomerMessages';
    panel.className='eden-customer-messages';
    const orderOptions=(orders||[]).map(o=>`<option value="${esc(o.id)}">Order #${esc(o.order_number)} · ${esc(statusLabel(o.status))}</option>`).join('');
    panel.innerHTML=`
      <div class="eden-customer-message-head"><div><span class="page-kicker">Support</span><h2>Messages</h2><p>Message Eden Toy Co directly about an order, preorder or your account.</p></div><button class="secondary" id="edenNewMessageToggle" type="button">New message</button></div>
      <div class="eden-new-message" id="edenNewMessagePanel" hidden>
        <form id="edenNewMessageForm" class="eden-auth-form">
          <div class="form-field full"><label>Subject</label><input name="subject" maxlength="160" required placeholder="How can we help?"></div>
          <div class="form-field full"><label>Order <span>Optional</span></label><select name="order_id"><option value="">Not about a specific order</option>${orderOptions}</select></div>
          <div class="form-field full"><label>Message</label><textarea name="body" maxlength="${MAX_BODY}" required rows="5" placeholder="Write your message here"></textarea></div>
          <button class="primary" type="submit">Send message</button>
          <div id="edenCustomerMessageNotice" class="eden-auth-message" aria-live="polite"></div>
        </form>
      </div>
      <div class="eden-message-thread-list">${threads.length?threads.map(threadCard).join(''):'<div class="eden-message-empty"><strong>No messages yet.</strong><p>Use New message whenever you need help from Eden Toy Co.</p></div>'}</div>`;
    signedIn.insertAdjacentElement('afterend',panel);
    bindCustomerMessages();
  }

  function threadCard(t){
    const last=t.last||{};
    const closed=last.status==='closed';
    const orderLabel=t.orderId?`<span>Order linked</span>`:'';
    return `<details class="eden-message-thread" data-thread-id="${esc(t.threadId)}"><summary><div><strong>${esc(t.subject)}</strong><small>${fmt(last.created_at)} ${orderLabel}</small></div><span class="eden-message-status ${esc(last.status||'')}">${esc(statusLabel(last.status||'open'))}</span></summary><div class="eden-message-thread-body">${t.items.map(m=>`<article class="eden-message-bubble ${m.direction==='store_to_customer'?'store':'customer'}"><div><strong>${m.direction==='store_to_customer'?'Eden Toy Co':'You'}</strong><time>${fmt(m.created_at)}</time></div><p>${esc(m.body)}</p></article>`).join('')}${closed?'<p class="eden-thread-closed">This conversation is closed. Start a new message if you need more help.</p>':`<form class="eden-thread-reply" data-thread-reply="${esc(t.threadId)}"><textarea name="body" maxlength="${MAX_BODY}" required rows="3" placeholder="Reply to Eden Toy Co"></textarea><button class="secondary" type="submit">Send reply</button><div class="eden-auth-message" aria-live="polite"></div></form>`}</div></details>`;
  }

  function bindCustomerMessages(){
    document.getElementById('edenNewMessageToggle')?.addEventListener('click',()=>{
      const panel=document.getElementById('edenNewMessagePanel'); if(panel)panel.hidden=!panel.hidden;
    });
    document.getElementById('edenNewMessageForm')?.addEventListener('submit',async e=>{
      e.preventDefault();const form=e.currentTarget;const fd=new FormData(form);const notice=document.getElementById('edenCustomerMessageNotice');
      if(notice){notice.textContent='Sending…';notice.dataset.tone='info';}
      const {error}=await edenSupabase.rpc('eden_customer_send_message',{p_subject:String(fd.get('subject')||''),p_body:String(fd.get('body')||''),p_order_id:fd.get('order_id')||null,p_thread_id:null});
      if(error){if(notice){notice.textContent=error.message;notice.dataset.tone='error';}return;}
      form.reset();if(notice){notice.textContent='Message sent to Eden Toy Co.';notice.dataset.tone='success';}
      setTimeout(()=>{document.getElementById('edenCustomerMessages')?.remove();loadAccountMessages();},350);
    });
    document.querySelectorAll('[data-thread-reply]').forEach(form=>form.addEventListener('submit',async e=>{
      e.preventDefault();const fd=new FormData(form);const msg=form.querySelector('.eden-auth-message');const button=form.querySelector('button');button.disabled=true;if(msg)msg.textContent='Sending…';
      const {error}=await edenSupabase.rpc('eden_customer_send_message',{p_subject:'Reply',p_body:String(fd.get('body')||''),p_order_id:null,p_thread_id:form.dataset.threadReply});
      if(error){if(msg){msg.textContent=error.message;msg.dataset.tone='error';}button.disabled=false;return;}
      document.getElementById('edenCustomerMessages')?.remove();await loadAccountMessages();
    }));
  }

  const observer=new MutationObserver(()=>setTimeout(loadAccountMessages,0));
  window.addEventListener('DOMContentLoaded',()=>{observer.observe(document.getElementById('app')||document.body,{subtree:true,childList:true});setTimeout(loadAccountMessages,100);});
  window.addEventListener('hashchange',()=>setTimeout(loadAccountMessages,100));
})();
