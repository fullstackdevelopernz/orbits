(function(){
  const CART_KEY='edentoyco-cart';
  const OWNER_KEY='edentoyco-cart-owner';

  function readSessionCart(){
    try{
      const raw=sessionStorage.getItem(CART_KEY);
      const parsed=raw?JSON.parse(raw):{};
      return parsed && typeof parsed==='object' && !Array.isArray(parsed) ? parsed : {};
    }catch{return {};}
  }

  function writeSessionCart(){
    try{
      sessionStorage.setItem(CART_KEY,JSON.stringify(cart||{}));
      localStorage.removeItem(CART_KEY);
    }catch{}
    if(typeof updateCart==='function') updateCart();
  }

  function clearCustomerCart(){
    try{
      cart={};
      sessionStorage.removeItem(CART_KEY);
      sessionStorage.removeItem(OWNER_KEY);
      localStorage.removeItem(CART_KEY);
      if(typeof updateCart==='function') updateCart();
    }catch{}
  }

  try{ localStorage.removeItem(CART_KEY); }catch{}
  try{ cart=readSessionCart(); }catch{}

  try{ persistCart=function(){ writeSessionCart(); }; }catch{}

  function guardCustomerRoute(){
    if(location.pathname.endsWith('/operations.html')) return;
    if(location.hash==='#admin' || location.hash.startsWith('#admin/')){
      location.replace(location.pathname+location.search+'#account');
      return;
    }
    if(location.hash==='#confirmation') clearCustomerCart();
  }

  function bindAuthIsolation(){
    if(typeof edenSupabase==='undefined') return;
    window.edenSupabase=edenSupabase;
    edenSupabase.auth.getSession().then(({data})=>{
      const userId=data?.session?.user?.id||null;
      if(!userId) return;
      const owner=sessionStorage.getItem(OWNER_KEY);
      if(owner && owner!==userId) clearCustomerCart();
      sessionStorage.setItem(OWNER_KEY,userId);
    }).catch(()=>{});

    edenSupabase.auth.onAuthStateChange((event,session)=>{
      if(event==='SIGNED_OUT'){
        clearCustomerCart();
        return;
      }
      if(event==='SIGNED_IN'){
        const userId=session?.user?.id||null;
        if(!userId) return;
        const owner=sessionStorage.getItem(OWNER_KEY);
        if(owner && owner!==userId) clearCustomerCart();
        sessionStorage.setItem(OWNER_KEY,userId);
      }
    });
  }

  window.addEventListener('DOMContentLoaded',()=>{
    guardCustomerRoute();
    bindAuthIsolation();
    writeSessionCart();
  });
  window.addEventListener('hashchange',guardCustomerRoute);

  window.edenClearCustomerCart=clearCustomerCart;
})();
