function bindStaffSignin(){
  document.getElementById('edenOpsSigninForm')?.addEventListener('submit',async e=>{
    e.preventDefault();
    const app=document.getElementById('app');
    const fd=new FormData(e.currentTarget);
    const msg=document.getElementById('edenOpsSigninMessage');
    if(msg) msg.textContent='Signing in…';
    const {data,error}=await edenSupabase.auth.signInWithPassword({
      email:String(fd.get('email')||'').trim(),
      password:String(fd.get('password')||'')
    });
    if(error){if(msg)msg.textContent=error.message;return;}
    const {data:role,error:roleError}=await edenSupabase.from('eden_staff_roles').select('*').eq('user_id',data.user.id).eq('active',true).maybeSingle();
    if(roleError||!role){
      await edenSupabase.auth.signOut();
      if(app) app.innerHTML=deniedTemplate();
      document.getElementById('edenOpsDeniedReturn')?.addEventListener('click',()=>location.replace('/'));
      return;
    }
    await renderOperations();
  });
}
