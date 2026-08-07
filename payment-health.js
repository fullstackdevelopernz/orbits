(function(){
  let providerState={paypal:false,blinkpay:false};
  let healthLoaded=false;

  async function loadPaymentHealth(){
    try{
      const response=await fetch('/api/checkout-health',{cache:'no-store'});
      const data=await response.json().catch(()=>({}));
      providerState={
        paypal:Boolean(data?.providers?.paypal),
        blinkpay:Boolean(data?.providers?.blinkpay)
      };
    }catch{
      providerState={paypal:false,blinkpay:false};
    }
    healthLoaded=true;
    applyPaymentHealth();
  }

  function setText(el,text){
    if(el && el.textContent!==text) el.textContent=text;
  }

  function applyPaymentHealth(){
    const form=document.getElementById('checkoutForm');
    if(!form) return;
    const blinkInput=form.querySelector('input[name="paymentMethod"][value="blinkpay"]');
    const paypalInput=form.querySelector('input[name="paymentMethod"][value="paypal"]');
    const blinkCard=form.querySelector('[data-payment-card="blinkpay"]');
    const paypalCard=form.querySelector('[data-payment-card="paypal"]');
    const blinkBadge=blinkCard?.querySelector('.blinkpay-badge');
    const paypalBadge=paypalCard?.querySelector('.paypal-badge');
    const button=form.querySelector('button[type="submit"]');
    const message=document.getElementById('paypalCheckoutMessage');

    if(!healthLoaded){
      if(button){button.disabled=true;setText(button,'Checking payment options…');}
      return;
    }

    if(blinkInput) blinkInput.disabled=!providerState.blinkpay;
    if(paypalInput) paypalInput.disabled=!providerState.paypal;
    if(blinkCard){
      blinkCard.classList.toggle('payment-method-disabled',!providerState.blinkpay);
      blinkCard.setAttribute('aria-disabled',String(!providerState.blinkpay));
    }
    if(paypalCard){
      paypalCard.classList.toggle('payment-method-disabled',!providerState.paypal);
      paypalCard.setAttribute('aria-disabled',String(!providerState.paypal));
    }
    setText(blinkBadge,providerState.blinkpay?'BlinkPay':'Unavailable');
    setText(paypalBadge,providerState.paypal?'PayPal':'Unavailable');

    let selected=form.querySelector('input[name="paymentMethod"]:checked');
    if(selected?.disabled) selected=null;
    if(!selected){
      const fallback=[blinkInput,paypalInput].find(input=>input && !input.disabled);
      if(fallback){
        fallback.checked=true;
        fallback.dispatchEvent(new Event('change',{bubbles:true}));
        selected=fallback;
      }
    }

    const available=Boolean((blinkInput&&!blinkInput.disabled)||(paypalInput&&!paypalInput.disabled));
    if(button){
      button.disabled=!available;
      if(available){
        const method=selected?.value || (providerState.blinkpay?'blinkpay':'paypal');
        setText(button,method==='blinkpay'?'Continue to Pay by Bank':'Continue to PayPal');
      }else setText(button,'Checkout temporarily unavailable');
    }
    if(message && !available){
      message.textContent='Secure payment is temporarily unavailable. Please try again shortly.';
      message.dataset.tone='error';
    }
  }

  const observer=new MutationObserver(mutations=>{
    if(mutations.some(m=>Array.from(m.addedNodes||[]).some(n=>n.nodeType===1 && (n.id==='checkoutForm'||n.querySelector?.('#checkoutForm'))))) applyPaymentHealth();
  });

  window.addEventListener('DOMContentLoaded',()=>{
    observer.observe(document.body,{childList:true,subtree:true});
    loadPaymentHealth();
  });
  window.addEventListener('hashchange',()=>setTimeout(applyPaymentHealth,0));
})();
