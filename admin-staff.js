function edenOwnerStaffPanel(){
  return `<section class="eden-owner-staff" id="edenOwnerStaffPanel">
    <div class="eden-owner-staff-head"><div><span>Owner controls</span><h2>Staff access</h2><p>Add or update Eden Toy Co staff roles. Staff must have an Eden Toy Co account before they can be assigned access.</p></div></div>
    <form id="edenOwnerStaffForm" class="eden-owner-staff-form">
      <label>Email address<input type="email" name="email" required placeholder="staff@edentoyco.com"></label>
      <label>Role<select name="role" required>
        <option value="admin">Admin</option><option value="operations">Operations</option><option value="fulfilment">Fulfilment</option><option value="support">Support</option><option value="merchandising">Merchandising</option><option value="read_only">Read only</option><option value="owner">Owner</option>
      </select></label>
      <label class="eden-owner-active"><input type="checkbox" name="active" checked> Active</label>
      <button type="submit">Save staff access</button>
    </form>
    <div id="edenOwnerStaffMessage" class="eden-owner-staff-message" aria-live="polite"></div>
    <div id="edenOwnerStaffList" class="eden-owner-staff-list"></div>
  </section>`;
}

async function edenOwnerLoadStaff(){
  const list=document.getElementById('edenOwnerStaffList'); if(!list) return;
  list.innerHTML='<p>Loading staff…</p>';
  const {data,error}=await edenSupabase.rpc('eden_owner_list_staff');
  if(error){ list.innerHTML=`<p>${adminEsc(error.message)}</p>`; return; }
  list.innerHTML=(data||[]).map(s=>`<article class="eden-owner-staff-row"><div><strong>${adminEsc(s.email)}</strong><span>${adminEsc(s.role.replaceAll('_',' '))}</span></div><em>${s.active?'Active':'Disabled'}</em></article>`).join('') || '<p>No staff assigned yet.</p>';
}

async function edenOwnerBindStaff(){
  const form=document.getElementById('edenOwnerStaffForm'); if(!form || form.dataset.bound) return;
  form.dataset.bound='1';
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const msg=document.getElementById('edenOwnerStaffMessage');
    const fd=new FormData(form);
    const email=String(fd.get('email')||'').trim();
    const role=String(fd.get('role')||'admin');
    const active=form.elements.active.checked;
    msg.textContent='Saving staff access…';
    const {error}=await edenSupabase.rpc('eden_owner_set_staff',{p_email:email,p_role:role,p_active:active});
    if(error){ msg.textContent=error.message; return; }
    msg.textContent='Staff access saved.';
    form.reset(); form.elements.active.checked=true;
    await edenOwnerLoadStaff();
  });
  await edenOwnerLoadStaff();
}

async function edenOwnerInjectStaff(){
  if(!location.hash.startsWith('#admin')) return;
  const eyebrow=document.querySelector('.eden-admin-eyebrow');
  const main=document.querySelector('.eden-admin-main');
  if(!eyebrow||!main||document.getElementById('edenOwnerStaffPanel')) return;
  if(!/·\s*owner\b/i.test(eyebrow.textContent||'')) return;
  main.insertAdjacentHTML('beforeend',edenOwnerStaffPanel());
  await edenOwnerBindStaff();
}

const edenOwnerObserver=new MutationObserver(()=>{ edenOwnerInjectStaff(); });
edenOwnerObserver.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('hashchange',()=>setTimeout(edenOwnerInjectStaff,50));
setTimeout(edenOwnerInjectStaff,100);
