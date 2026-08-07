const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hbgopsvvoylsxcebllsq.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_MODE = (process.env.PAYPAL_MODE || 'sandbox').toLowerCase();
const PAYPAL_API_BASE = PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

function assertServerConfig(){
  const missing=[];
  if(!SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if(!PAYPAL_CLIENT_ID) missing.push('PAYPAL_CLIENT_ID');
  if(!PAYPAL_CLIENT_SECRET) missing.push('PAYPAL_CLIENT_SECRET');
  if(missing.length){ const e=new Error(`Server payment configuration incomplete: ${missing.join(', ')}`); e.statusCode=503; throw e; }
}

async function paypalAccessToken(){
  const basic = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method:'POST',
    headers:{Authorization:`Basic ${basic}`,'Content-Type':'application/x-www-form-urlencoded'},
    body:'grant_type=client_credentials'
  });
  const body=await response.json().catch(()=>({}));
  if(!response.ok || !body.access_token){ const e=new Error(body.error_description || body.error || 'PayPal authentication failed'); e.statusCode=502; throw e; }
  return body.access_token;
}

async function paypalRequest(path,{method='GET',body,requestId}={}){
  const token=await paypalAccessToken();
  const headers={Authorization:`Bearer ${token}`,'Content-Type':'application/json','Prefer':'return=representation'};
  if(requestId) headers['PayPal-Request-Id']=requestId;
  const response=await fetch(`${PAYPAL_API_BASE}${path}`,{method,headers,body:body?JSON.stringify(body):undefined});
  const data=await response.json().catch(()=>({}));
  if(!response.ok){ const detail=data?.details?.[0]?.description || data.message || `PayPal request failed (${response.status})`; const e=new Error(detail); e.statusCode=502; e.paypal=data; throw e; }
  return data;
}

async function supabaseRest(table,{method='GET',query='',body,prefer='return=representation'}={}){
  const response=await fetch(`${SUPABASE_URL}/rest/v1/${table}${query?`?${query}`:''}`,{
    method,
    headers:{apikey:SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,'Content-Type':'application/json',Prefer:prefer},
    body:body===undefined?undefined:JSON.stringify(body)
  });
  const text=await response.text();
  let data=null; try{ data=text?JSON.parse(text):null; }catch{ data=text; }
  if(!response.ok){ const e=new Error(data?.message || data?.hint || `Database request failed (${response.status})`); e.statusCode=500; throw e; }
  return data;
}

async function resolveCustomer(accessToken){
  if(!accessToken) return null;
  const response=await fetch(`${SUPABASE_URL}/auth/v1/user`,{headers:{apikey:SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${accessToken}`}});
  if(!response.ok) return null;
  return response.json();
}

function value2(n){ return Number(n||0).toFixed(2); }
function json(res,status,payload){ res.status(status).setHeader('Content-Type','application/json'); res.end(JSON.stringify(payload)); }
function allowedMethod(req,res,method='POST'){ if(req.method!==method){ res.setHeader('Allow',method); json(res,405,{error:'Method not allowed'}); return false; } return true; }
function bearer(req){ const h=req.headers.authorization||''; return h.startsWith('Bearer ')?h.slice(7):null; }

module.exports={assertServerConfig,paypalRequest,supabaseRest,resolveCustomer,value2,json,allowedMethod,bearer,PAYPAL_MODE};
