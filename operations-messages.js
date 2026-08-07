(function(){
  function esc(v=''){return String(v).replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[ch]));}
  function fmt(v){if(!v)return '';try{return new Intl.DateTimeFormat('en-NZ',{dateStyle:'medium',timeStyle:'short'}).format(new Date(v));}catch{return '';}}
  function groups(rows){const map=new Map();for(const r of rows||[]){if(!map.has(r.thread_id))map.set(r.thread_id,[]);map.get(r.thread_id).push(r);}return [...map.entries()].map(([id,items])=>{items.sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));return{id,items,last:items[items.length-1],first:items[0]};}).sort((a,b)=>new Date(b.last.created_at)-new Date(a.last.created_at));}
  async function loadOpsMessages(){
    const section=document.querySelector('[data-admin-section="messages"]');
    if(!section||section.dataset.messagingReady==='1'||typeof edenSupabase==='undefined')return;
    section.dataset.messagingReady='loading';
    const {data,error}=await edenSupabase.from('eden_customer_messages').select('id,thread_id,customer_id,customer_email,order_id,direction,subject,body,status,sender_user_id,created_at').order('created_at',{ascending:true}).limit(1000);
    if(error){section.dataset.messagingReady='';return;}
    const threadGroups=groups(data||[]);
    const awaiting=threadGroups.filter(t=>t.last.status==='awaiting_staff').length;
    section.innerHTML=`<div class="eden-admin-section-head"><div><h2>Customer messages</h2><p>Account-based support conversations between ORBITS customers and Eden Toy Co staff.</p></div><div class="eden-ops-message-count"><strong>${awaiting}</strong><span>awaiting staff</span></div></div><div id="edenOpsMessageNotice" class="eden-admin-message" aria-live="polite"></div><div class="eden-ops-thread-list">${threadGroups.length?threadGroups.map(threadCard).join(''):'<div class="eden-admin-card"><div class="eden-admin-empty">No customer messages yet.</div></div>'}</div>`;
    section.dataset.messagingReady='1';bindOpsMessages(section);
  }
  function threadCard(t){
    const closed=t.last.status==='closed';
    const identity=t.first.customer_email||t.first.customer_id||'Customer';
    return `<details class="eden-ops-thread" data-ops-thread="${esc(t.id)}"><summary><div><strong>${esc(t.first.subject||'Customer message')}</strong><small>${esc(identity)} · ${t.first.order_id?'Order linked · ':''}${fmt(t.last.created_at)}</small></div><span class="eden-admin-status ${esc(t.last.status)}">${esc(String(t.last.status).replaceAll('_',' '))}</span></summary><div class="eden-ops-thread-body">${t.items.map(m=>`<article class="eden-ops-message-bubble ${m.direction==='store_to_customer'?'staff':'customer'}"><div><strong>${m.direction==='store_to_customer'?'Eden Toy Co':esc(identity)}</strong><time>${fmt(m.created_at)}</time></div><p>${esc(m.body)}</p></article>`).join('')}${closed?'<p class="eden-ops-thread-closed">Conversation closed.</p>':`<form class="eden-ops-reply-form" data-ops-reply="${esc(t.id)}"><textarea name="body" rows="4" maxlength="5000" required placeholder="Reply to customer"></textarea><div><button type="submit">Send reply</button><button class="eden-ops-secondary" type="button" data-close-thread="${esc(t.id)}">Close conversation</button></div></form>`}</div></details>`;
  }
  function notice(text,tone='info'){const el=document.getElementById('edenOpsMessageNotice');if(el){el.textContent=text||'';el.dataset.tone=tone;}}
  function bindOpsMessages(section){
    section.querySelectorAll('[data-ops-reply]').forEach(form=>form.addEventListener('submit',async e=>{
      e.preventDefault();const button=form.querySelector('button[type="submit"]');button.disabled=true;notice('Sending reply…');const fd=new FormData(form);
      const {error}=await edenSupabase.rpc('eden_staff_reply_message',{p_thread_id:form.dataset.opsReply,p_body:String(fd.get('body')||'')});
      if(error){notice(error.message,'error');button.disabled=false;return;}notice('Reply sent.','success');section.dataset.messagingReady='';setTimeout(loadOpsMessages,150);
    }));
    section.querySelectorAll('[data-close-thread]').forEach(btn=>btn.addEventListener('click',async()=>{
      if(!confirm('Close this customer conversation?'))return;btn.disabled=true;notice('Closing conversation…');
      const {error}=await edenSupabase.rpc('eden_staff_close_message_thread',{p_thread_id:btn.dataset.closeThread});
      if(error){notice(error.message,'error');btn.disabled=false;return;}notice('Conversation closed.','success');section.dataset.messagingReady='';setTimeout(loadOpsMessages,150);
    }));
  }
  const observer=new MutationObserver(()=>{const section=document.querySelector('[data-admin-section="messages"]');if(section&&section.classList.contains('active'))loadOpsMessages();});
  document.addEventListener('DOMContentLoaded',()=>{observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});setTimeout(loadOpsMessages,200);});
  document.addEventListener('click',e=>{if(e.target?.dataset?.adminView==='messages')setTimeout(loadOpsMessages,50);});
})();
