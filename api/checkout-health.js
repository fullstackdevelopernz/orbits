export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const checks = {
    paypalClientId: Boolean(process.env.PAYPAL_CLIENT_ID),
    paypalClientSecret: Boolean(process.env.PAYPAL_CLIENT_SECRET),
    paypalMode: process.env.PAYPAL_MODE || null,
    supabaseServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  };

  const ok = checks.paypalClientId && checks.paypalClientSecret && checks.supabaseServiceRoleKey && ['live', 'sandbox'].includes(checks.paypalMode);

  res.setHeader('Cache-Control', 'no-store');
  return res.status(ok ? 200 : 503).json({
    ok,
    environment: process.env.VERCEL_ENV || 'unknown',
    checks
  });
}
