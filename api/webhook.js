/**
 * Webhook Handler: webhook.js
 * 
 * Procesa eventos de Stripe (payment_intent.succeeded)
 * Orquesta todo el flujo:
 * 1. Crea dataset con datos del cliente
 * 2. Llama a generate-report.js para 14-20 bloques
 * 3. Convierte HTML a PDF con Puppeteer
 * 4. Envía email con link descarga
 * 5. Retorna ID del pedido
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const crypto = require('crypto');
const fs   = require('fs');
const path = require('path');
const { sendEmailReporte } = require('./send-email');
const TemplateInjector = require('./template-injector');
const HTMLtoPDF = require('./html-to-pdf');

const TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'reporte-maestro-2026.html');
const https = require('https');

// Geocodifica "Ciudad, País" con Nominatim (OpenStreetMap) — sin API key
function geocodificar(ciudadTexto) {
  return new Promise((resolve) => {
    const q   = encodeURIComponent(ciudadTexto);
    const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&addressdetails=1`;
    const req = https.get(url, { headers: { 'User-Agent': 'IMConsulting/1.0 (imconsulting.me@gmail.com)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const results = JSON.parse(data);
          if (!results.length) return resolve(null);
          const r = results[0];
          resolve({
            lat:    parseFloat(r.lat),
            lng:    parseFloat(r.lon),
            ciudad: r.address?.city || r.address?.town || r.address?.village || ciudadTexto,
            pais:   r.address?.country || '',
          });
        } catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.setTimeout(8000, () => { req.destroy(); resolve(null); });
  });
}

// Resuelve timezone desde lat/lng con la API pública de timezone (timeapi.io)
function resolverTimezone(lat, lng) {
  return new Promise((resolve) => {
    const url = `https://timeapi.io/api/timezone/coordinate?latitude=${lat}&longitude=${lng}`;
    const req = https.get(url, { headers: { 'User-Agent': 'IMConsulting/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const r = JSON.parse(data);
          resolve(r.timeZone || 'America/Mexico_City');
        } catch { resolve('America/Mexico_City'); }
      });
    });
    req.on('error', () => resolve('America/Mexico_City'));
    req.setTimeout(5000, () => { req.destroy(); resolve('America/Mexico_City'); });
  });
}

// Llama a la función Python compute_dataset via HTTP interno
async function buildDataset(cliente) {
  const [day, month, year] = (cliente.fechaNacimiento || '').split('-').map(Number);
  const [hour, minute]     = (cliente.horaNacimiento  || '00:00').split(':').map(Number);

  // Geocodificar ciudad
  const geo    = await geocodificar(cliente.ciudad || '');
  const lat    = geo?.lat    ?? 29.07;
  const lng    = geo?.lng    ?? -110.96;
  const tz     = await resolverTimezone(lat, lng);
  const ciudad = geo?.ciudad || cliente.ciudad || '';
  const pais   = geo?.pais   || '';

  const siteUrl = process.env.URL || process.env.SITE_URL || 'https://imconsulting.netlify.app';
  const res = await fetch(`${siteUrl}/.netlify/functions/compute_dataset`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nombre: cliente.nombre || '',
      day:    day    || 1,
      month:  month  || 1,
      year:   year   || 2000,
      hour:   hour   || 0,
      minute: minute || 0,
      lat, lng, tz, ciudad, pais,
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`compute_dataset: ${txt.slice(0, 200)}`);
  }
  return res.json();
}

exports.handler = async (event, context) => {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (e) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid JSON' })
      };
    }

    const { paymentMethodId, plan, cliente } = body;

    if (!paymentMethodId || !plan || !cliente) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Datos incompletos' })
      };
    }

    // Prices defined server-side — never trust amount from client
    const PLAN_PRICES = { esencial: 5500, completo: 11100 };
    if (!PLAN_PRICES[plan]) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Plan inválido' })
      };
    }
    const amount = PLAN_PRICES[plan];

    // Basic email validation
    if (!cliente.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cliente.email)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Email inválido' })
      };
    }

    const id_pedido = crypto.randomUUID();
    console.log(`[${id_pedido}] Iniciando procesamiento...`);

    console.log(`[${id_pedido}] Confirmando pago de $${amount / 100}...`);

    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method: paymentMethodId,
        confirm: true,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never'
        },
        return_url: process.env.SITE_URL || 'https://imconsulting.netlify.app/checkout'
      });
    } catch (stripeError) {
      console.error(`[${id_pedido}] Error Stripe:`, stripeError.message);
      return {
        statusCode: 402,
        body: JSON.stringify({
          success: false,
          error: stripeError.message
        })
      };
    }

    if (paymentIntent.status !== 'succeeded') {
      console.log(`[${id_pedido}] Pago no completado. Status: ${paymentIntent.status}`);
      return {
        statusCode: 402,
        body: JSON.stringify({
          success: false,
          error: `Pago no completado. Status: ${paymentIntent.status}`
        })
      };
    }

    console.log(`[${id_pedido}] ✅ Pago confirmado`);

    // ── Generación canónica en Railway (async, sin timeout, con auditoría) ────
    // Railway hace: dataset + 14/20 bloques + auditoría + email. Responde 202 al instante.
    const RAILWAY_URL  = process.env.RAILWAY_URL || 'https://imconsulting-production.up.railway.app';
    const ADMIN_SECRET = process.env.ADMIN_SECRET;
    try {
      console.log(`[${id_pedido}] 📤 Handoff a Railway para generación...`);
      const railwayRes = await fetch(`${RAILWAY_URL}/admin-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Secret': ADMIN_SECRET || '',
        },
        body: JSON.stringify({
          nombre: cliente.nombre,
          email:  cliente.email,
          fecha:  cliente.fechaNacimiento,
          hora:   cliente.horaNacimiento || '12:00',
          ciudad: cliente.ciudad,
          plan,
        }),
      });
      if (!railwayRes.ok) {
        const txt = await railwayRes.text();
        throw new Error(`Railway respondió ${railwayRes.status}: ${txt.slice(0, 200)}`);
      }
      console.log(`[${id_pedido}] ✅ Railway aceptó la generación (procesando en background)`);
    } catch (railwayErr) {
      console.error(`[${id_pedido}] ❌ Handoff a Railway falló:`, railwayErr.message);
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          error: `Pago confirmado pero la generación falló. Guarda tu ID y contacta soporte: ${id_pedido}`,
        }),
      };
    }

    try {
      fs.writeFileSync(`/tmp/${id_pedido}_status.json`, JSON.stringify({
        id_pedido, status: 'processing', plan, email: cliente.email,
        created_at: new Date().toISOString(),
      }));
    } catch { /* /tmp opcional */ }

    console.log(`[${id_pedido}] ✅ PAGO CONFIRMADO — reporte en proceso`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        id_pedido,
        plan,
        email: cliente.email,
        message: 'Pago confirmado. Tu reporte llegará a tu correo en unos minutos.',
      }),
    };

  } catch (error) {
    console.error('Error en webhook:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function generarHtmlDeBloques(bloques, nombreCliente, plan) {
  const nombreSafe = esc(nombreCliente);
  let html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte IM Consulting - ${nombreSafe}</title>
  <style>
    body { font-family: Georgia, serif; margin: 40px; color: #1A1A1A; }
    h1 { color: #C8B89A; letter-spacing: 3px; text-align: center; }
    h2 { color: #C8B89A; margin-top: 40px; border-bottom: 2px solid #C8B89A; padding-bottom: 10px; }
    .bloque { margin: 30px 0; padding: 20px; background: #f9f9f9; }
    .bloque-titulo { font-weight: bold; color: #C8B89A; }
    .bloque-contenido { line-height: 1.6; }
    .pregunta { font-style: italic; color: #666; margin-top: 15px; }
    .footer { text-align: center; margin-top: 50px; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <h1>R E P O R T E  D E  A U T O C O N O C I M I E N T O</h1>
  <p style="text-align: center; color: #C8B89A; font-size: 18px;">✦</p>
  <h2>Reporte para ${nombreSafe}</h2>
  <p style="text-align: center; color: #999;">Plan: ${plan === '$55' ? 'Esencial' : 'Completo'}</p>
`;

  bloques.forEach((bloque, idx) => {
    html += `
  <div class="bloque">
    <div class="bloque-titulo">${idx + 1}. ${esc(bloque.nombre || bloque.bloque)}</div>
    <div class="bloque-contenido">${bloque.contenido || '[Contenido no disponible]'}</div>
    <div class="pregunta">✦ Pregunta de poder: Reflexiona sobre este aspecto en tu vida.</div>
  </div>
`;
  });

  html += `
  <div class="footer">
    <p>IM Consulting © 2026 | Reporte confidencial | Uso personal exclusivo</p>
  </div>
</body>
</html>
`;

  return html;
}