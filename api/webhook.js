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

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  // Validar hottok de Hotmart
  const hottok = event.headers['x-hotmart-hottok'];
  if (!hottok || hottok !== HOTTOK) {
    console.error('Hottok inválido:', hottok);
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
    headers: { 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Accept': 'application/json' },
  });

  const pedidos = await sbRes.json();

  if (!pedidos?.length) {
    console.error(`[${transaction}] No se encontró pedido pendiente para ${email}`);
    return { statusCode: 404, body: 'Pedido no encontrado' };
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
  await fetch(`${SUPABASE_URL}/rest/v1/pedidos?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status, hotmart_transaction: transaction }),
  });
}
