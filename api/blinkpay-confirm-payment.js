const {assertBlinkPayConfig,blinkClient,supabaseRest,json,allowedMethod}=require('./_blinkpay');

module.exports = async function handler(req,res){
  if(!allowedMethod(req,res,'POST')) return;
  try{
    assertBlinkPayConfig();
    const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
    const quickPaymentId=String(body.quickPaymentId||'').trim();
    if(!quickPaymentId) return json(res,400,{error:'BlinkPay quick payment ID is required.'});

    const payments=await supabaseRest('eden_payments',{query:`select=*&provider=eq.blinkpay&provider_reference=eq.${encodeURIComponent(quickPaymentId)}&limit=1`});
    const payment=Array.isArray(payments)?payments[0]:null;
    if(!payment) return json(res,404,{error:'BlinkPay payment record not found.'});

    if(payment.status==='paid' || payment.status==='completed'){
      const orders=await supabaseRest('eden_orders',{query:`select=*&id=eq.${payment.order_id}&limit=1`});
      const order=Array.isArray(orders)?orders[0]:null;
      return json(res,200,{alreadyConfirmed:true,orderNumber:order?.order_number,orderId:payment.order_id,quickPaymentId});
    }

    const client=blinkClient();
    let settled;
    try{
      settled=await client.awaitSuccessfulQuickPaymentOrThrowException(quickPaymentId,120);
    }catch(error){
      const current=await client.getQuickPayment(quickPaymentId).catch(()=>null);
      await supabaseRest('eden_payments',{method:'PATCH',query:`id=eq.${payment.id}`,body:{raw_payload:{quick_payment:current,error:String(error?.message||error)},updated_at:new Date().toISOString()},prefer:'return=minimal'});
      return json(res,409,{error:'BlinkPay has not confirmed successful settlement yet.',status:current?.status||null});
    }

    const responseAmount=Number(settled?.amount?.total ?? settled?.payment?.amount?.total ?? NaN);
    const responseCurrency=settled?.amount?.currency ?? settled?.payment?.amount?.currency ?? null;
    if(Number.isFinite(responseAmount) && Math.abs(responseAmount-Number(payment.amount))>0.001){
      await supabaseRest('eden_payments',{method:'PATCH',query:`id=eq.${payment.id}`,body:{status:'failed',raw_payload:{quick_payment:settled,reason:'amount_mismatch'},updated_at:new Date().toISOString()},prefer:'return=minimal'});
      return json(res,409,{error:'BlinkPay payment amount did not match the Eden order.'});
    }
    if(responseCurrency && responseCurrency!==payment.currency){
      await supabaseRest('eden_payments',{method:'PATCH',query:`id=eq.${payment.id}`,body:{status:'failed',raw_payload:{quick_payment:settled,reason:'currency_mismatch'},updated_at:new Date().toISOString()},prefer:'return=minimal'});
      return json(res,409,{error:'BlinkPay payment currency did not match the Eden order.'});
    }

    const now=new Date().toISOString();
    await supabaseRest('eden_payments',{method:'PATCH',query:`id=eq.${payment.id}`,body:{status:'paid',paid_at:now,raw_payload:{quick_payment:settled},updated_at:now},prefer:'return=minimal'});
    const updatedOrders=await supabaseRest('eden_orders',{method:'PATCH',query:`id=eq.${payment.order_id}`,body:{status:'paid',payment_status:'paid',updated_at:now},prefer:'return=representation'});
    const order=Array.isArray(updatedOrders)?updatedOrders[0]:updatedOrders;
    return json(res,200,{success:true,orderNumber:order?.order_number,orderId:payment.order_id,quickPaymentId});
  }catch(error){
    console.error('blinkpay-confirm-payment',error);
    return json(res,error.statusCode||500,{error:error.message||'Unable to confirm BlinkPay payment.'});
  }
};
