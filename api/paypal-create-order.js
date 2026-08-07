const {assertServerConfig,paypalRequest,supabaseRest,resolveCustomer,value2,json,allowedMethod,bearer,PAYPAL_MODE}=require('./_paypal');

module.exports = async function handler(req,res){
  if(!allowedMethod(req,res,'POST')) return;
  try{
    assertServerConfig();
    const body = typeof req.body === 'string' ? JSON.parse(req.body||'{}') : (req.body||{});
    const cart = Array.isArray(body.items) ? body.items : [];
    if(!cart.length) return json(res,400,{error:'Your bag is empty.'});
    if(cart.length>36) return json(res,400,{error:'Too many line items.'});

    const requested = cart.map(i=>({slug:String(i.slug||'').trim(),quantity:Math.max(1,Math.min(24,Number(i.quantity)||1))})).filter(i=>i.slug);
    if(!requested.length) return json(res,400,{error:'No valid products supplied.'});
    const uniqueSlugs=[...new Set(requested.map(i=>i.slug))];
    const encoded=uniqueSlugs.map(s=>`"${s.replaceAll('"','')}"`).join(',');
    const products=await supabaseRest('eden_products',{query:`select=id,slug,sku,name,collection,price_nzd,active&slug=in.(${encodeURIComponent(encoded)})&active=eq.true`});
    if(!Array.isArray(products) || products.length!==uniqueSlugs.length) return json(res,409,{error:'One or more products are unavailable.'});
    const bySlug=new Map(products.map(p=>[p.slug,p]));
    const lines=requested.map(i=>({product:bySlug.get(i.slug),quantity:i.quantity}));
    if(lines.some(l=>!l.product)) return json(res,409,{error:'One or more products are unavailable.'});

    const customer=body.customer||{};
    const email=String(customer.email||'').trim().toLowerCase();
    const firstName=String(customer.firstName||'').trim();
    const lastName=String(customer.lastName||'').trim();
    if(!email || !email.includes('@')) return json(res,400,{error:'A valid email address is required.'});
    if(!firstName || !lastName) return json(res,400,{error:'First and last name are required.'});

    const shipping=body.shipping||{};
    const shippingAddress={
      first_name:firstName,last_name:lastName,address_line_1:String(shipping.address1||'').trim(),address_line_2:String(shipping.address2||'').trim(),
      city:String(shipping.city||'').trim(),postcode:String(shipping.postcode||'').trim(),country:String(shipping.country||'New Zealand').trim()
    };
    if(!shippingAddress.address_line_1 || !shippingAddress.city || !shippingAddress.postcode) return json(res,400,{error:'Complete the delivery address.'});

    const subtotal=lines.reduce((sum,l)=>sum+(Number(l.product.price_nzd)*l.quantity),0);
    const shippingTotal=0;
    const total=subtotal+shippingTotal;
    const signedInUser=await resolveCustomer(bearer(req));

    const orderRows=await supabaseRest('eden_orders',{method:'POST',body:{
      customer_id:signedInUser?.id||null,customer_email:email,customer_name:`${firstName} ${lastName}`.trim(),status:'pending_payment',payment_status:'pending',fulfilment_status:'unfulfilled',currency:'NZD',subtotal,shipping_total:shippingTotal,discount_total:0,total,notes:'PayPal checkout initiated',shipping_address:shippingAddress,billing_address:{},placed_at:new Date().toISOString()
    }});
    const edenOrder=Array.isArray(orderRows)?orderRows[0]:orderRows;
    if(!edenOrder?.id) throw new Error('Eden order could not be created.');

    const orderItems=lines.map(l=>({order_id:edenOrder.id,product_id:l.product.id,sku:l.product.sku,product_name:l.product.name,collection:l.product.collection,quantity:l.quantity,unit_price:Number(l.product.price_nzd),line_total:Number(l.product.price_nzd)*l.quantity}));
    await supabaseRest('eden_order_items',{method:'POST',body:orderItems,prefer:'return=minimal'});

    const purchaseItems=lines.map(l=>({name:l.product.name,sku:l.product.sku||l.product.slug,quantity:String(l.quantity),unit_amount:{currency_code:'NZD',value:value2(l.product.price_nzd)}}));
    const paypal=await paypalRequest('/v2/checkout/orders',{method:'POST',requestId:`eden-${edenOrder.id}`,body:{
      intent:'CAPTURE',
      purchase_units:[{reference_id:String(edenOrder.order_number),custom_id:edenOrder.id,invoice_id:`EDEN-${edenOrder.order_number}`,description:'Eden Toy Co ORBITS preorder',amount:{currency_code:'NZD',value:value2(total),breakdown:{item_total:{currency_code:'NZD',value:value2(subtotal)},shipping:{currency_code:'NZD',value:value2(shippingTotal)}}},items:purchaseItems}],
      payment_source:{paypal:{experience_context:{brand_name:'Eden Toy Co · ORBITS',shipping_preference:'GET_FROM_FILE',user_action:'PAY_NOW',return_url:'https://www.edentoyco.com/?paypal=approved',cancel_url:'https://www.edentoyco.com/?paypal=cancelled'}}}
    }});
    const approve=paypal.links?.find(l=>l.rel==='payer-action' || l.rel==='approve')?.href;
    if(!approve) throw new Error('PayPal did not return an approval URL.');

    await supabaseRest('eden_payments',{method:'POST',body:{order_id:edenOrder.id,provider:'paypal',provider_reference:paypal.id,status:'pending',amount:total,currency:'NZD',raw_payload:{paypal_order_status:paypal.status,mode:PAYPAL_MODE}}});
    return json(res,200,{edenOrderId:edenOrder.id,orderNumber:edenOrder.order_number,paypalOrderId:paypal.id,approvalUrl:approve,mode:PAYPAL_MODE});
  }catch(error){
    console.error('paypal-create-order',error);
    return json(res,error.statusCode||500,{error:error.message||'Unable to start PayPal checkout.'});
  }
};
