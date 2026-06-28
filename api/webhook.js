/**
 * webhook.js (Netlify Function)
 * Recibe PURCHASE_APPROVED de Hotmart, busca datos en Supabase, llama a Railway.
 */

const crypto = require('crypto');

const SUPABASE_URL  = process.env.SUPABASE_URL;
const SUPABASE_KEY  = process.env.SUPABASE_SECRET_KEY;
const RAILWAY_URL   = process.env.RAILWAY_URL || 'https://imconsulting-production.up.railway.app';
const ADMIN_SECRET  = process.env.ADMIN_SECRET;
const HOTTOK        = process.env.HOTMART_HOTTOK;
const RESEND_KEY    = process.env.RESEND_API_KEY;
const ISAAC_EMAIL   = process.env.ISAAC_EMAIL || 'its.isaacmoreno@gmail.com';
const EMAIL_FROM    = process.env.REPORT_EMAIL_FROM || 'onboarding@resend.dev';

// Aviso al admin cuando algo falla en el camino del dinero. No-op sin RESEND_API_KEY.
async function alertarIsaac(asunto, detalle) {
  if (!RESEND_KEY) return;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: ISAAC_EMAIL,
        subject: `⚠️ IM Consulting — ${asunto}`,
        html: `<pre style="font-family:monospace;font-size:13px;white-space:pre-wrap">${detalle}</pre>`,
      }),
    });
  } catch (err) {
    console.error(`[ALERTA] No se pudo avisar a Isaac: ${err.message}`);
  }
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  // Validar hottok de Hotmart (comparación timing-safe)
  const hottok = event.headers['x-hotmart-hottok'] || '';
  const hottokOk = HOTTOK && hottok.length === HOTTOK.length &&
    crypto.timingSafeEqual(Buffer.from(hottok), Buffer.from(HOTTOK));
  if (!hottokOk) {
    console.error('Hottok inválido');
    return { statusCode: 401, body: 'Unauthorized' };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  // Solo procesar compras aprobadas
  if (body.event !== 'PURCHASE_APPROVED') {
    return { statusCode: 200, body: 'Ignored' };
  }

  const email       = body.data?.buyer?.email;
  const nombre      = `${body.data?.buyer?.first_name || ''} ${body.data?.buyer?.last_name || ''}`.trim();
  const transaction = body.data?.purchase?.transaction;

  if (!email) {
    console.error('No email en payload Hotmart');
    return { statusCode: 400, body: 'Missing email' };
  }

  console.log(`[${transaction}] Compra aprobada para ${email}`);

  // Buscar pedido pendiente en Supabase
  const query = `${SUPABASE_URL}/rest/v1/pedidos?email=eq.${encodeURIComponent(email)}&status=eq.pending&order=created_at.desc&limit=1`;
  const sbRes = await fetch(query, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Accept': 'application/json' },
  });

  const pedidos = await sbRes.json();

  if (!pedidos?.length) {
    console.error(`[${transaction}] No se encontró pedido pendiente para ${email}`);
    // Cliente pagó pero no hay fila pending con ese email (probable: usó otro email en Hotmart).
    // Avisar a Isaac para resolución manual y devolver 200 para que Hotmart no reintente (evita spam).
    await alertarIsaac('Pago sin pedido — cliente NO recibirá su reporte',
      `transaction: ${transaction}\nbuyer email (Hotmart): ${email}\nnombre: ${nombre}\n\n` +
      `No existe fila 'pending' en 'pedidos' con ese email. Probablemente el comprador usó un email ` +
      `distinto al del checkout. Acción manual: buscar la compra en Hotmart y generar el reporte vía ` +
      `POST /admin-report en Railway con los datos correctos.`);
    return { statusCode: 200, body: 'Pedido no encontrado — admin notificado' };
  }

  const pedido = pedidos[0];
  console.log(`[${transaction}] Pedido encontrado: ${pedido.id}`);

  // Llamar a Railway para generar el reporte
  try {
    const railwayRes = await fetch(`${RAILWAY_URL}/admin-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Secret': ADMIN_SECRET || '',
      },
      body: JSON.stringify({
        id:      pedido.id,
        nombre:  pedido.nombre || nombre,
        email:   pedido.email,
        fecha:   pedido.fecha_nacimiento,
        hora:    pedido.hora_nacimiento,
        ciudad:  pedido.ciudad,
        plan:    pedido.plan,
      }),
    });

    if (!railwayRes.ok) {
      throw new Error(`Railway ${railwayRes.status}: ${await railwayRes.text()}`);
    }

    console.log(`[${transaction}] ✅ Railway aceptó la generación`);
  } catch (err) {
    console.error(`[${transaction}] ❌ Error Railway:`, err.message);
    // Marcar como failed pero devolver 200 a Hotmart para que no reintente
    await actualizarStatus(pedido.id, 'failed', transaction);
    return { statusCode: 200, body: 'Railway error — logged' };
  }

  // Actualizar status en Supabase
  await actualizarStatus(pedido.id, 'processing', transaction);

  return { statusCode: 200, body: 'OK' };
};

async function actualizarStatus(id, status, transaction) {
  await fetch(`${SUPABASE_URL}/rest/v1/pedidos?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status, hotmart_transaction: transaction }),
  });
}
