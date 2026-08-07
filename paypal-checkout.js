(function(){
  function esc(v=''){return String(v).replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[ch]));}

  checkoutTemplate = function(){
    const entries=cartEntries();
    if(!entries.length) return bagTemplate();
    return `<section class="page-shell paypal-checkout-shell"><div class="checkout-grid"><form class="checkout-card" id="checkoutForm">
      <span class="page-kicker">Secure preorder checkout</span><h1>Where should we send your Orbits?</h1>
      <p class="paypal-checkout-intro">Your Eden Toy Co order is created first, then you choose how you want to pay.</p>
      <div id="paypalCheckoutMessage" class="paypal-checkout-message" aria-live="polite"></div>
      <div class="checkout-step"><h2>Contact</h2><div class="form-grid">
        <div class="form-field full"><label>Email</label><input name="email" required type="email" autocomplete="email" placeholder="you@example.com"></div>
        <div class="form-field"><label>First name</label><input name="firstName" required autocomplete="given-name"></div>
        <div class="form-field"><label>Last name</label><input name="lastName" required autocomplete="family-name"></div>
      </div></div>
      <div class="checkout-step"><h2>Delivery</h2><div class="form-grid">
        <div class="form-field full"><label>Address</label><input name="address1" required autocomplete="address-line1"></div>
        <div class="form-field full"><label>Apartment, suite, etc. <span>Optional</span></label><input name="address2" autocomplete="address-line2"></div>
        <div class="form-field"><label>City</label><input name="city" required autocomplete="address-level2"></div>
        <div class="form-field"><label>Postcode</label><input name="postcode" required autocomplete="postal-code"></div>
        <div class="form-field full"><label>Country</label><select name="country" autocomplete="country-name"><option>New Zealand</option></select></div>
      </div></div>
      <div class="checkout-step payment-choice-step">
        <div class="payment-choice-heading"><div><span class="page-kicker">Payment</span><h2>Choose how to pay</h2></div><span class="paypal-lock">Secure</span></div>
        <label class="payment-method-card active" data-payment-card="blinkpay">
          <input type="radio" name="paymentMethod" value="blinkpay" checked>
          <span class="payment-method-copy"><strong>Pay by Bank</strong><small>Pay directly from your NZ bank through BlinkPay. No card details required.</small></span>
          <span class="payment-method-badge blinkpay-badge">BlinkPay</span>
        </label>
        <label class="payment-method-card" data-payment-card="paypal">
          <input type="radio" name="paymentMethod" value="paypal">
          <span class="payment-method-copy"><strong>PayPal</strong><small>Pay with your PayPal account or the payment methods PayPal makes available.</small></span>
          <span class="payment-method-badge paypal-badge">PayPal</span>
        </label>
      </div>
      <button class="primary wide paypal-checkout-button" type="submit">Continue to Pay by Bank</button>
      <p class="fineprint">Your order is only marked paid after Eden Toy Co receives confirmation from your selected payment provider.</p>
    </form><aside class="order-summary"><span class="page-kicker">Your preorder</span><h2>Order summary</h2>${entries.map(({p,qty})=>`<div class="order-row"><img src="${p.image}" alt="${esc(p.name)}"><div><strong>${esc(p.name)}</strong><small>Qty ${qty}</small></div><strong>${money(p.price*qty)}</strong></div>`).join('')}<div class="order-total"><span>Total</span><span>${money(cartSubtotal())} NZD</span></div><div class="paypal-summary-note">Choose Pay by Bank with BlinkPay or PayPal. Your order enters Eden Toy Co operations only after payment is confirmed.</div></aside></div></section>`;
  };

  confirmationTemplate = function(){
    const last=JSON.parse(sessionStorage.getItem('eden-last-paid-order')||'null');
    const provider=last?.provider==='blinkpay'?'BlinkPay':'PayPal';
    return `<section class="page-shell"><div class="page-panel account-card eden-confirmation-card"><span class="page-kicker">Payment confirmed</span><div class="confirmation-check">✓</div><h1>Your Orbits are officially on order.</h1><p>${last?.orderNumber?`Order <strong>#${esc(last.orderNumber)}</strong> has been paid and recorded by Eden Toy Co.`:`Your ${provider} payment has been confirmed and your Eden Toy Co order is recorded.`}</p><p class="muted">Keep an eye on your email for order and shipping updates.</p><div class="confirmation-actions"><a class="primary" href="#shop">Keep exploring</a><a class="secondary" href="#account">View account</a></div></div></section>`;
  };

  bindCheckout = function(){
    const form=document.getElementById('checkoutForm');
    if(!form) return;
    const message=document.getElementById('paypalCheckoutMessage');
    const button=form.querySelector('button[type="submit"]');
    const setMessage=(text,tone='info')=>{if(message){message.textContent=text;message.dataset.tone=tone;}};
    const refreshPaymentChoice=()=>{
      const selected=form.querySelector('input[name="paymentMethod"]:checked')?.value||'blinkpay';
      form.querySelectorAll('[data-payment-card]').forEach(card=>card.classList.toggle('active',card.dataset.paymentCard===selected));
      if(button&&!button.disabled) button.textContent=selected==='blinkpay'?'Continue to Pay by Bank':'Continue to PayPal';
    };
    form.querySelectorAll('input[name="paymentMethod"]').forEach(input=>input.addEventListener('change',refreshPaymentChoice));
    refreshPaymentChoice();

    (async()=>{
      try{
        if(typeof edenSupabase!=='undefined'){
          const {data:{session}}=await edenSupabase.auth.getSession();
          if(session?.user?.email){ const input=form.querySelector('[name="email"]'); if(input&&!input.value) input.value=session.user.email; }
          if(session?.user?.id){
            const {data:profile}=await edenSupabase.from('eden_customer_profiles').select('full_name').eq('id',session.user.id).maybeSingle();
            if(profile?.full_name){ const parts=profile.full_name.trim().split(/\s+/); const first=form.querySelector('[name="firstName"]'); const last=form.querySelector('[name="lastName"]'); if(first&&!first.value) first.value=parts.shift()||''; if(last&&!last.value) last.value=parts.join(' '); }
          }
        }
      }catch{}
    })();

    form.addEventListener('submit',async e=>{
      e.preventDefault();
      const fd=new FormData(form);
      const entries=cartEntries();
      const method=String(fd.get('paymentMethod')||'blinkpay');
      if(!entries.length) return setMessage('Your bag is empty.','error');
      button.disabled=true; button.textContent='Creating secure checkout…'; setMessage('Creating your Eden Toy Co order…');
      try{
        let accessToken=null;
        if(typeof edenSupabase!=='undefined'){ const {data:{session}}=await edenSupabase.auth.getSession(); accessToken=session?.access_token||null; }
        const payload={
          items:entries.map(({p,qty})=>({slug:p.id,quantity:qty})),
          customer:{email:fd.get('email'),firstName:fd.get('firstName'),lastName:fd.get('lastName')},
          shipping:{address1:fd.get('address1'),address2:fd.get('address2'),city:fd.get('city'),postcode:fd.get('postcode'),country:fd.get('country')}
        };
        const endpoint=method==='blinkpay'?'/api/blinkpay-create-payment':'/api/paypal-create-order';
        const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',...(accessToken?{Authorization:`Bearer ${accessToken}`}:{})},body:JSON.stringify(payload)});
        const data=await response.json().catch(()=>({}));
        if(!response.ok) throw new Error(data.error||`Unable to start ${method==='blinkpay'?'BlinkPay':'PayPal'} checkout.`);
        if(method==='blinkpay'){
          sessionStorage.setItem('eden-pending-blinkpay-order',JSON.stringify({quickPaymentId:data.quickPaymentId,edenOrderId:data.edenOrderId,orderNumber:data.orderNumber}));
          setMessage('Opening secure Pay by Bank checkout…','success');
          window.location.assign(data.redirectUrl);
        }else{
          sessionStorage.setItem('eden-pending-paypal-order',JSON.stringify({paypalOrderId:data.paypalOrderId,edenOrderId:data.edenOrderId,orderNumber:data.orderNumber}));
          setMessage('Opening PayPal…','success');
          window.location.assign(data.approvalUrl);
        }
      }catch(err){
        setMessage(err.message||'Unable to start checkout.','error');
        button.disabled=false; refreshPaymentChoice();
      }
    });
  };

  function finishPaidOrder(data,provider,providerReference){
    sessionStorage.setItem('eden-last-paid-order',JSON.stringify({orderNumber:data.orderNumber,orderId:data.orderId,provider,providerReference}));
    sessionStorage.removeItem(provider==='blinkpay'?'eden-pending-blinkpay-order':'eden-pending-paypal-order');
    cart={}; localStorage.setItem('edentoyco-cart',JSON.stringify(cart)); updateCart();
    location.hash='confirmation'; render();
  }

  async function processPayPalReturn(){
    const params=new URLSearchParams(location.search);
    const state=params.get('paypal');
    if(!state) return false;
    history.replaceState({},'',location.pathname+(location.hash||''));
    if(state==='cancelled'){
      sessionStorage.removeItem('eden-pending-paypal-order');
      location.hash='bag';
      return true;
    }
    if(state!=='approved') return true;
    const paypalOrderId=params.get('token') || JSON.parse(sessionStorage.getItem('eden-pending-paypal-order')||'null')?.paypalOrderId;
    if(!paypalOrderId){ location.hash='bag'; return true; }
    document.getElementById('app').innerHTML=`<section class="page-shell"><div class="page-panel account-card eden-confirmation-card"><span class="page-kicker">PayPal approved</span><div class="paypal-processing-spinner"></div><h1>Confirming your payment…</h1><p class="muted">Keep this page open while Eden Toy Co records the payment.</p></div></section>`;
    try{
      const response=await fetch('/api/paypal-capture-order',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({paypalOrderId})});
      const data=await response.json().catch(()=>({}));
      if(!response.ok) throw new Error(data.error||'Payment capture could not be confirmed.');
      finishPaidOrder(data,'paypal',paypalOrderId);
    }catch(err){
      document.getElementById('app').innerHTML=`<section class="page-shell"><div class="page-panel account-card eden-confirmation-card"><span class="page-kicker">Payment confirmation issue</span><h1>We need to verify your PayPal payment.</h1><p>${esc(err.message||'The payment could not be reconciled automatically.')}</p><p class="muted">Do not pay again. Contact <a href="mailto:orders@edentoyco.com">orders@edentoyco.com</a> and include PayPal reference ${esc(paypalOrderId)}.</p><a class="primary" href="#account">Go to account</a></div></section>`;
    }
    return true;
  }

  async function processBlinkPayReturn(){
    const params=new URLSearchParams(location.search);
    if(params.get('blinkpay')!=='returned') return false;
    history.replaceState({},'',location.pathname+(location.hash||''));
    const pending=JSON.parse(sessionStorage.getItem('eden-pending-blinkpay-order')||'null');
    const quickPaymentId=pending?.quickPaymentId;
    if(!quickPaymentId){ location.hash='bag'; return true; }
    document.getElementById('app').innerHTML=`<section class="page-shell"><div class="page-panel account-card eden-confirmation-card"><span class="page-kicker">Pay by Bank</span><div class="paypal-processing-spinner"></div><h1>Confirming your bank payment…</h1><p class="muted">Keep this page open while BlinkPay confirms settlement with Eden Toy Co.</p></div></section>`;
    try{
      const response=await fetch('/api/blinkpay-confirm-payment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({quickPaymentId})});
      const data=await response.json().catch(()=>({}));
      if(!response.ok) throw new Error(data.error||'Bank payment could not be confirmed yet.');
      finishPaidOrder(data,'blinkpay',quickPaymentId);
    }catch(err){
      document.getElementById('app').innerHTML=`<section class="page-shell"><div class="page-panel account-card eden-confirmation-card"><span class="page-kicker">Payment verification</span><h1>Your bank payment is still being verified.</h1><p>${esc(err.message||'BlinkPay has not completed settlement confirmation yet.')}</p><p class="muted">Do not pay again. If this does not update, contact <a href="mailto:orders@edentoyco.com">orders@edentoyco.com</a> and include BlinkPay reference ${esc(quickPaymentId)}.</p><button class="primary" id="blinkpayRetry">Check payment again</button></div></section>`;
      document.getElementById('blinkpayRetry')?.addEventListener('click',()=>{ location.search='?blinkpay=returned'; });
    }
    return true;
  }

  window.addEventListener('DOMContentLoaded',()=>setTimeout(async()=>{
    if(await processBlinkPayReturn()) return;
    await processPayPalReturn();
  },50));
})();
