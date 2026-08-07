(function(){
  let providerState={paypal:true,blinkpay:false};

  async function loadPaymentHealth(){
    try{
      const response=await fetch('/api/checkout-health',{cache:'no-store'});
      const data=await response.json().catch(()=>({}));
      providerState={
        paypal:Boolean(data?.providers?.paypal ?? true),
        blinkpay:Boolean(data?.providers?.blinkpay)
      };
    }catch{
      providerState={paypal:true,blinkpay:false};
    }
    applyPaymentHealth();
  }

  function applyPaymentHealth(){
    const form=document.getElementById('checkoutForm');
    if(!form) return;
    const blinkInput=form.querySelector('input[name="paymentMethod"][value="blinkpay"]');
    const paypalInput=form.querySelector('input[name="paymentMethod"][value="paypal"]');
    const blinkCard=form.querySelector('[data-payment-card="blinkpay"]');
    const blinkBadge=blinkCard?.querySelector('.blinkpay-badge');
    const button=form.querySelector('button[type="submit"]');

    if(blinkInput){
      blinkInput.disabled=!providerState.blinkpay;
      if(!providerState.blinkpay && blinkInput.checked && paypalInput){
        paypalInput.checked=true;
        blinkInput.checked=false;
        paypalInput.dispatchEvent(new Event('change',{bubbles:true}));
      }
    }
    if(blinkCard){
      blinkCard.classList.toggle('payment-method-disabled',!providerState.blinkpay);
      blinkCard.setAttribute('aria-disabled',String(!providerState.blinkpay));
    }
    if(blinkBadge && !providerState.blinkpay) blinkBadge.textContent='Connecting';
    if(blinkBadge && providerState.blinkpay) blinkBadge.textContent='BlinkPay';
    if(button && !providerState.blinkpay && paypalInput?.checked && !button.disabled) button.textContent='Continue to PayPal';
  }

  const observer=new MutationObserver(()=>applyPaymentHealth());
  window.addEventListener('DOMContentLoaded',()=>{
    observer.observe(document.body,{childList:true,subtree:true});
    loadPaymentHealth();
  });
  window.addEventListener('hashchange',()=>setTimeout(applyPaymentHealth,0));
})();
