const {assertServerConfig,paypalRequest,supabaseRest,json,allowedMethod}=require('./_paypal');

module.exports = async function handler(req,res){
  if(!allowedMethod(req,res,'POST')) return;
  try{
    assertServerConfig();
    const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
    const paypalOrderId=String(body.paypalOrderId||'').trim();
    if(!paypalOrderId) return json(res,400,{error:'PayPal order ID is required.'});

    const payments=await supabaseRest('eden_payments',{query:`select=*&provider=eq.paypal&provider_reference=eq.${encodeURIComponent(paypalOrderId)}&limit=1`});
    const payment=Array.isArray(payments)?payments[0]:null;
    if(!payment) return json(res,404,{error:'Payment record not found.'});

    if(payment.status==='paid' || payment.status==='completed'){
      const orders=await supabaseRest('eden_orders',{query:`select=*&id=eq.${payment.order_id}&limit=1`});
      return json(res,200,{alreadyCaptured:true,order:Array.isArray(orders)?orders[0]:null});
    }

    const capture=await paypalRequest(`/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`,{method:'POST',requestId:`capture-${payment.order_id}`});
    const captureUnit=capture.purchase_units?.[0]?.payments?.captures?.[0];
    const completed=capture.status==='COMPLETED' && captureUnit?.status==='COMPLETED';
    if(!completed) return json(res,409,{error:'PayPal payment has not completed.',paypalStatus:capture.status});

    const capturedAmount=Number(captureUnit.amount?.value||0);
    const capturedCurrency=captureUnit.amount?.currency_code||'';
    if(capturedCurrency!==payment.currency || Math.abs(capturedAmount-Number(payment.amount))>0.001){
      await supabaseRest('eden_payments',{method:'PATCH',query:`id=eq.${payment.id}`,body:{status:'failed',raw_payload:capture,updated_at:new Date().toISOString()},prefer:'return=minimal'});
      return json(res,409,{error:'Captured payment amount did not match the Eden order.'});
    }

    const now=new Date().toISOString();
    await supabaseRest('eden_payments',{method:'PATCH',query:`id=eq.${payment.id}`,body:{status:'paid',paid_at:now,raw_payload:capture,updated_at:now},prefer:'return=minimal'});
    const updatedOrders=await supabaseRest('eden_orders',{method:'PATCH',query:`id=eq.${payment.order_id}`,body:{status:'paid',payment_status:'paid',updated_at:now},prefer:'return=representation'});
    const order=Array.isArray(updatedOrders)?updatedOrders[0]:updatedOrders;
    return json(res,200,{success:true,orderNumber:order?.order_number,orderId:payment.order_id,paypalOrderId});
  }catch(error){
    console.error('paypal-capture-order',error);
    return json(res,error.statusCode||500,{error:error.message||'Unable to capture PayPal payment.'});
  }
};
