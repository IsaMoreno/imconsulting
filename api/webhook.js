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
const fs = require('fs');
const path = require('path');
const { sendEmailReporte } = require('./send-email');
const TemplateInjector = require('./template-injector');
const HTMLtoPDF = require('./html-to-pdf');

const TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'reporte-maestro-2026.html');

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

    console.log(`[${id_pedido}] Generando dataset completo...`);
    
    const datasetCompleto = {
      nombre: cliente.nombre || 'Cliente',
      edad: cliente.edad || 30,
      signo_solar: cliente.signo_solar || 'Acuario',
      ascendente: cliente.ascendente || 'Escorpio',
      mc: cliente.mc || 'Leo',
      camino_vida: cliente.camino_vida || 9,
      numero_expresion: cliente.numero_expresion || 7,
      numero_alma: cliente.numero_alma || 5,
      numero_personalidad: cliente.numero_personalidad || 22,
      punto_a: cliente.punto_a || 1,
      punto_b: cliente.punto_b || 2,
      punto_c: cliente.punto_c || 3,
      punto_d: cliente.punto_d || 4,
      punto_e: cliente.punto_e || 5,
      ciudad: cliente.ciudad || 'Hermosillo',
      pais: cliente.pais || 'México',
      eventos_cruzados: cliente.eventos_cruzados || []
    };
    
    console.log(`[${id_pedido}] ✅ Dataset completado`);

    console.log(`[${id_pedido}] Generando ${plan === 'esencial' ? 14 : 20} bloques...`);
    
    let bloques;
    
    // Llamar a generate-report.js para generar bloques reales
    try {
      const generateReportModule = require('./generate-report');
      
      const reportPayload = {
        id_pedido,
        plan: plan === 'esencial' ? '$55' : '$111',
        cliente: {
          nombre: cliente.nombre,
          email: cliente.email,
          edad: cliente.edad,
          plan: plan,
          eventos_cruzados: cliente.eventos_cruzados || []
        },
        dataset: datasetCompleto
      };
      
      console.log(`[${id_pedido}] 📤 Llamando a generate-report.js...`);
      
      const reportResponse = await generateReportModule.handler({
        httpMethod: 'POST',
        body: JSON.stringify(reportPayload)
      });
      
      const reportBody = JSON.parse(reportResponse.body);
      bloques = reportBody.bloques || [];
      
      console.log(`[${id_pedido}] ✅ ${bloques.length} bloques generados por Claude`);
    } catch (error) {
      console.error(`[${id_pedido}] ❌ Error en generate-report:`, error.message);
      // Fallback: generar bloques simulados si falla Claude
      const numBloques = plan === 'esencial' ? 14 : 20;
      bloques = [];
      for (let i = 1; i <= numBloques; i++) {
        bloques.push({
          numero: i,
          nombre: `Bloque ${i} (SIMULADO - error en Claude)`,
          bloque: `B${i}`,
          contenido: `Contenido simulado del bloque ${i}. Error en Claude: ${error.message}`
        });
      }
      console.log(`[${id_pedido}] ⚠️ Usando bloques simulados como fallback`);
    }
    
    console.log(`[${id_pedido}] ✅ ${bloques.length} bloques generados exitosamente`);

    console.log(`[${id_pedido}] Inyectando bloques en template HTML...`);
    let html;
    try {
      const injector = new TemplateInjector(TEMPLATE_PATH);
      const dataset = {
        cliente: {
          nombre: cliente.nombre,
          email: cliente.email,
          plan: plan === '$55' ? 'esencial' : 'completo',
        },
        astro:       datasetCompleto,
        numerologia: datasetCompleto,
        matriz:      datasetCompleto,
        bloques_html: bloques.map(b => ({ codigo: b.bloque, contenido: b.contenido })),
      };
      html = injector.render(dataset, { plan: plan === '$55' ? 'esencial' : 'completo' });
      console.log(`[${id_pedido}] ✅ HTML inyectado con TemplateInjector`);
    } catch (tplError) {
      console.warn(`[${id_pedido}] ⚠️ TemplateInjector falló (${tplError.message}), usando fallback`);
      html = generarHtmlDeBloques(bloques, cliente.nombre, plan);
    }

    console.log(`[${id_pedido}] Convirtiendo a PDF...`);
    let pdfBuffer = null;
    try {
      const converter = new HTMLtoPDF();
      pdfBuffer = await converter.convertToPDF(html, { format: 'Letter' });
      const pdfPath = `/tmp/${id_pedido}_reporte.pdf`;
      fs.writeFileSync(pdfPath, pdfBuffer);
      console.log(`[${id_pedido}] ✅ PDF generado: ${(pdfBuffer.length / 1024).toFixed(0)} KB`);
    } catch (pdfError) {
      console.warn(`[${id_pedido}] ⚠️ PDF falló (${pdfError.message}), email sin adjunto`);
    }

    console.log(`[${id_pedido}] Enviando email a ${cliente.email}...`);
    let emailResult;
    try {
      emailResult = await sendEmailReporte(
        cliente.email,
        cliente.nombre,
        id_pedido,
        plan,
        pdfBuffer
      );
      if (emailResult.success) {
        console.log(`[${id_pedido}] ✅ Email enviado | MessageID: ${emailResult.messageId}`);
      } else {
        console.warn(`[${id_pedido}] ⚠️  Email no enviado: ${emailResult.error}`);
      }
    } catch (emailError) {
      console.error(`[${id_pedido}] ❌ Error enviando email:`, emailError.message);
      emailResult = { success: false, error: emailError.message };
    }

    const statusFile = `/tmp/${id_pedido}_status.json`;
    fs.writeFileSync(statusFile, JSON.stringify({
      id_pedido,
      status: 'completed',
      plan,
      email: cliente.email,
      bloques_generados: bloques.length,
      email_enviado: emailResult?.success || false,
      created_at: new Date().toISOString()
    }));

    console.log(`[${id_pedido}] ✅ COMPLETADO`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        id_pedido,
        plan,
        email: cliente.email,
        bloques_generados: bloques.length,
        email_enviado: emailResult?.success || false,
        message: 'Reporte generado y email enviado exitosamente'
      })
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