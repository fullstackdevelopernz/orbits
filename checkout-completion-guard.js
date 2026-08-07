(function(){
  function clearCompletedCheckout(){
    if(location.hash!=='#confirmation')return;
    if(!sessionStorage.getItem('eden-last-paid-order'))return;
    try{window.edenClearCustomerCart?.();}catch{}
    try{sessionStorage.removeItem('eden-pending-paypal-order');sessionStorage.removeItem('eden-pending-blinkpay-order');localStorage.removeItem('edentoyco-cart');}catch{}
  }
  window.addEventListener('hashchange',()=>setTimeout(clearCompletedCheckout,0));
  document.addEventListener('DOMContentLoaded',()=>setTimeout(clearCompletedCheckout,50));
})();
