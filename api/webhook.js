/**
 * webhook.js (Netlify Function)
 *
 * NO es un listener de webhook de Stripe — el nombre es heredado.
 * Cobra de forma síncrona y hace handoff de la generación a Railway:
 *   1. Valida plan + email (precios fijos server-side)
 *   2. Confirma el PaymentIntent en Stripe
 *   3. POST {RAILWAY_URL}/admin-report (X-Admin-Secret) → Railway genera en background
 *   4. Responde 200 con id_pedido
 *
 * El motor de generación (dataset, bloques, PDF, email) vive en railway/app.js.
 * Ver docs/DECISIONS.md D-006.
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const crypto = require('crypto');
const fs     = require('fs');

exports.handler = async (event, context) => {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    // ponytail: log temporal para capturar payload de Hotmart — remover tras integración
    console.log('[HOTMART_PAYLOAD] headers:', JSON.stringify(event.headers));
    console.log('[HOTMART_PAYLOAD] body:', event.body);

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
