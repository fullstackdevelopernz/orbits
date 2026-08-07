export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const checks = {
    supabaseServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    paypal: {
      clientId: Boolean(process.env.PAYPAL_CLIENT_ID),
      clientSecret: Boolean(process.env.PAYPAL_CLIENT_SECRET),
      mode: process.env.PAYPAL_MODE || null
    },
    blinkpay: {
      clientId: Boolean(process.env.BLINKPAY_CLIENT_ID),
      clientSecret: Boolean(process.env.BLINKPAY_CLIENT_SECRET),
      debitUrl: process.env.BLINKPAY_DEBIT_URL || 'https://debit.blinkpay.co.nz'
    }
  };

  const providers = {
    paypal: checks.supabaseServiceRoleKey && checks.paypal.clientId && checks.paypal.clientSecret && ['live', 'sandbox'].includes(checks.paypal.mode),
    blinkpay: checks.supabaseServiceRoleKey && checks.blinkpay.clientId && checks.blinkpay.clientSecret && checks.blinkpay.debitUrl === 'https://debit.blinkpay.co.nz'
  };
  const ok = providers.paypal || providers.blinkpay;

  res.setHeader('Cache-Control', 'no-store');
  return res.status(ok ? 200 : 503).json({
    ok,
    environment: process.env.VERCEL_ENV || 'unknown',
    providers,
    checks
  });
}
