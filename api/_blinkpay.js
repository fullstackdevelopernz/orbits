const { BlinkDebitClient, AuthFlowDetailTypeEnum, AmountCurrencyEnum } = require('blink-debit-api-client-node');
const { supabaseRest, resolveCustomer, value2, json, allowedMethod, bearer } = require('./_paypal');

const BLINKPAY_DEBIT_URL = process.env.BLINKPAY_DEBIT_URL || 'https://debit.blinkpay.co.nz';
const BLINKPAY_CLIENT_ID = process.env.BLINKPAY_CLIENT_ID;
const BLINKPAY_CLIENT_SECRET = process.env.BLINKPAY_CLIENT_SECRET;

function assertBlinkPayConfig(){
  const missing=[];
  if(!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if(!BLINKPAY_CLIENT_ID) missing.push('BLINKPAY_CLIENT_ID');
  if(!BLINKPAY_CLIENT_SECRET) missing.push('BLINKPAY_CLIENT_SECRET');
  if(missing.length){ const e=new Error(`Server payment configuration incomplete: ${missing.join(', ')}`); e.statusCode=503; throw e; }
}

function blinkClient(){
  return new BlinkDebitClient(undefined, {
    blinkpay: {
      debitUrl: BLINKPAY_DEBIT_URL,
      clientId: BLINKPAY_CLIENT_ID,
      clientSecret: BLINKPAY_CLIENT_SECRET,
      timeout: 10000,
      retryEnabled: true
    }
  });
}

module.exports={
  assertBlinkPayConfig, blinkClient, AuthFlowDetailTypeEnum, AmountCurrencyEnum,
  supabaseRest, resolveCustomer, value2, json, allowedMethod, bearer, BLINKPAY_DEBIT_URL
};
