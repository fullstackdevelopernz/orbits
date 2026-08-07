const EDEN_SUPABASE_URL = 'https://hbgopsvvoylsxcebllsq.supabase.co';
const EDEN_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_fscxNAUGn8qpwoJ4vDET6w_o1VLvTGg';
const edenSupabase = window.supabase.createClient(EDEN_SUPABASE_URL, EDEN_SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

let edenAuthSession = null;
let edenRecoveryMode = false;

function edenAccountRouteActive(){
  return location.hash === '#account' || location.hash.startsWith('#account/');
}

function edenAuthMessage(message, tone='info'){
  const el = document.getElementById('edenAuthMessage');
  if(!el) return;
  el.textContent = message || '';
  el.dataset.tone = tone;
}

function edenSignedOutTemplate(){
  return `<section class="page-shell eden-account-shell">
    <div class="eden-account-layout">
      <div class="eden-account-intro">
        <span class="page-kicker">Your Eden Toy Co. account</span>
        <h1>Your Orbits, all in one place.</h1>
        <p>Sign in to keep your customer details together and prepare your account for order history, messages, reviews and future releases.</p>
        <div class="eden-account-points"><span>✦ Secure customer account</span><span>✦ Persistent sign-in</span><span>✦ Built for order history & support</span></div>
      </div>
      <div class="page-panel eden-auth-card">
        <div class="eden-auth-tabs" role="tablist">
          <button class="active" type="button" data-auth-tab="signin">Sign in</button>
          <button type="button" data-auth-tab="signup">Create account</button>
        </div>
        <div id="edenAuthMessage" class="eden-auth-message" aria-live="polite"></div>
        <form id="edenSigninForm" class="eden-auth-form">
          <div class="form-field full"><label>Email address</label><input name="email" type="email" required autocomplete="email" placeholder="you@example.com"></div>
          <div class="form-field full"><label>Password</label><input name="password" type="password" required autocomplete="current-password" minlength="8" placeholder="••••••••"></div>
          <button class="primary wide" type="submit">Sign in</button>
          <button class="eden-text-button" id="edenForgotPassword" type="button">Forgot password?</button>
        </form>
        <form id="edenSignupForm" class="eden-auth-form" hidden>
          <div class="form-field full"><label>Name</label><input name="full_name" type="text" required autocomplete="name" placeholder="Your name"></div>
          <div class="form-field full"><label>Email address</label><input name="email" type="email" required autocomplete="email" placeholder="you@example.com"></div>
          <div class="form-field full"><label>Password</label><input name="password" type="password" required autocomplete="new-password" minlength="8" placeholder="At least 8 characters"></div>
          <label class="eden-check"><input name="marketing" type="checkbox"> <span>Send me new-release and preorder updates.</span></label>
          <button class="primary wide" type="submit">Create account</button>
        </form>
      </div>
    </div>
  </section>`;
}

function edenSignedInTemplate(user, profile){
  const name = profile?.full_name || user.user_metadata?.full_name || '';
  return `<section class="page-shell eden-account-shell">
    <div class="eden-account-layout eden-account-signed-in">
      <div class="eden-account-intro">
        <span class="page-kicker">Signed in</span>
        <h1>${name ? `Hi, ${escapeHtml(name)}.` : 'Welcome to your account.'}</h1>
        <p>Your account is live. This is where order history, customer messages, reviews and saved details will connect as the store backend is rolled out.</p>
        <div class="eden-account-status"><span></span> Account active</div>
      </div>
      <div class="page-panel eden-auth-card">
        <div class="eden-account-email">${escapeHtml(user.email || '')}</div>
        <form id="edenProfileForm" class="eden-auth-form">
          <div class="form-field full"><label>Name</label><input name="full_name" type="text" value="${escapeAttr(name)}" autocomplete="name"></div>
          <div class="form-field full"><label>Phone</label><input name="phone" type="tel" value="${escapeAttr(profile?.phone || '')}" autocomplete="tel" placeholder="Optional"></div>
          <label class="eden-check"><input name="marketing" type="checkbox" ${profile?.marketing_opt_in ? 'checked' : ''}> <span>Send me new-release and preorder updates.</span></label>
          <button class="primary wide" type="submit">Save details</button>
        </form>
        <div id="edenAuthMessage" class="eden-auth-message" aria-live="polite"></div>
        <button class="secondary wide" id="edenSignOut" type="button">Sign out</button>
      </div>
    </div>
  </section>`;
}

function edenRecoveryTemplate(){
  return `<section class="page-shell eden-account-shell"><div class="page-panel eden-auth-card eden-reset-card">
    <span class="page-kicker">Secure account recovery</span><h1>Choose a new password.</h1>
    <div id="edenAuthMessage" class="eden-auth-message" aria-live="polite"></div>
    <form id="edenRecoveryForm" class="eden-auth-form">
      <div class="form-field full"><label>New password</label><input name="password" type="password" required minlength="8" autocomplete="new-password"></div>
      <button class="primary wide" type="submit">Update password</button>
    </form>
  </div></section>`;
}

function escapeHtml(value=''){
  return String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[ch]));
}
function escapeAttr(value=''){ return escapeHtml(value); }

async function edenLoadProfile(userId){
  const { data } = await edenSupabase.from('eden_customer_profiles').select('*').eq('id', userId).maybeSingle();
  return data || null;
}

async function renderEdenAccount(){
  if(!edenAccountRouteActive()) return;
  const app = document.getElementById('app');
  if(!app) return;
  if(edenRecoveryMode){
    app.innerHTML = edenRecoveryTemplate();
    bindEdenRecovery();
    return;
  }
  const { data: { session } } = await edenSupabase.auth.getSession();
  edenAuthSession = session;
  if(session?.user){
    const profile = await edenLoadProfile(session.user.id);
    app.innerHTML = edenSignedInTemplate(session.user, profile);
    bindEdenSignedIn(session.user);
  } else {
    app.innerHTML = edenSignedOutTemplate();
    bindEdenSignedOut();
  }
}

function bindEdenSignedOut(){
  document.querySelectorAll('[data-auth-tab]').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('[data-auth-tab]').forEach(b=>b.classList.toggle('active', b===btn));
    document.getElementById('edenSigninForm').hidden = btn.dataset.authTab !== 'signin';
    document.getElementById('edenSignupForm').hidden = btn.dataset.authTab !== 'signup';
    edenAuthMessage('');
  }));

  document.getElementById('edenSigninForm')?.addEventListener('submit', async e => {
    e.preventDefault(); edenAuthMessage('Signing you in…');
    const fd = new FormData(e.currentTarget);
    const { error } = await edenSupabase.auth.signInWithPassword({email:fd.get('email'), password:fd.get('password')});
    if(error) return edenAuthMessage(error.message, 'error');
    await renderEdenAccount();
  });

  document.getElementById('edenSignupForm')?.addEventListener('submit', async e => {
    e.preventDefault(); edenAuthMessage('Creating your account…');
    const fd = new FormData(e.currentTarget);
    const { data, error } = await edenSupabase.auth.signUp({
      email:fd.get('email'), password:fd.get('password'),
      options:{ data:{ full_name:fd.get('full_name') } }
    });
    if(error) return edenAuthMessage(error.message, 'error');
    if(data.session){
      await edenSupabase.from('eden_customer_profiles').upsert({id:data.user.id,full_name:fd.get('full_name'),marketing_opt_in:fd.get('marketing')==='on'});
      await renderEdenAccount();
    } else {
      edenAuthMessage('Account created. Check your email to confirm your address, then return here to sign in.', 'success');
    }
  });

  document.getElementById('edenForgotPassword')?.addEventListener('click', async () => {
    const email = document.querySelector('#edenSigninForm input[name="email"]')?.value?.trim();
    if(!email) return edenAuthMessage('Enter your email address first, then choose Forgot password.', 'error');
    edenAuthMessage('Sending password reset email…');
    const { error } = await edenSupabase.auth.resetPasswordForEmail(email, {redirectTo:'https://www.edentoyco.com/'});
    edenAuthMessage(error ? error.message : 'Password reset email sent. Open the link in that email to choose a new password.', error ? 'error' : 'success');
  });
}

function bindEdenSignedIn(user){
  document.getElementById('edenProfileForm')?.addEventListener('submit', async e => {
    e.preventDefault(); edenAuthMessage('Saving…');
    const fd = new FormData(e.currentTarget);
    const payload = {id:user.id,full_name:String(fd.get('full_name')||''),phone:String(fd.get('phone')||''),marketing_opt_in:fd.get('marketing')==='on',updated_at:new Date().toISOString()};
    const { error } = await edenSupabase.from('eden_customer_profiles').upsert(payload);
    edenAuthMessage(error ? error.message : 'Your account details have been saved.', error ? 'error' : 'success');
  });
  document.getElementById('edenSignOut')?.addEventListener('click', async () => {
    await edenSupabase.auth.signOut();
    await renderEdenAccount();
  });
}

function bindEdenRecovery(){
  document.getElementById('edenRecoveryForm')?.addEventListener('submit', async e => {
    e.preventDefault(); edenAuthMessage('Updating password…');
    const fd = new FormData(e.currentTarget);
    const { error } = await edenSupabase.auth.updateUser({password:fd.get('password')});
    if(error) return edenAuthMessage(error.message,'error');
    edenRecoveryMode = false;
    edenAuthMessage('Password updated.', 'success');
    location.hash = 'account';
    await renderEdenAccount();
  });
}

window.addEventListener('hashchange', () => setTimeout(renderEdenAccount, 0));
window.addEventListener('DOMContentLoaded', () => setTimeout(renderEdenAccount, 0));

edenSupabase.auth.onAuthStateChange((event, session) => {
  edenAuthSession = session;
  if(event === 'PASSWORD_RECOVERY'){
    edenRecoveryMode = true;
    if(!edenAccountRouteActive()) location.hash = 'account';
    setTimeout(renderEdenAccount,0);
    return;
  }
  if((event === 'SIGNED_IN' || event === 'USER_UPDATED') && /access_token|type=/.test(location.hash)){
    history.replaceState(null,'',location.pathname + location.search + '#account');
  }
  if(edenAccountRouteActive()) setTimeout(renderEdenAccount,0);
});
