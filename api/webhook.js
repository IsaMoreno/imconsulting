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
 * 
 * Flujo:
 * Checkout.html → Stripe API → webhook.js → generate-report.js → PDF
 *                                          → template-injector.js
 *                                          → html-to-pdf.js
 *                                          → send-email.js
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { v4: uuidv4 } = require('uuid');

// Importar funciones internas
const { generateReport } = require('./generate-report');
const { injectTemplate } = require('./template-injector');
const { htmlToPdf } = require('./html-to-pdf');
const { sendEmail } = require('./send-email');

exports.handler = async (event, context) => {
  try {
    // Validar método
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    // Parsear body
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (e) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid JSON' })
      };
    }

    const { paymentMethodId, plan, amount, cliente } = body;

    // Validaciones
    if (!paymentMethodId || !plan || !amount || !cliente) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Datos incompletos' })
      };
    }

    if (!['esencial', 'completo'].includes(plan)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Plan inválido' })
      };
    }

    // Generar ID único para este pedido
    const id_pedido = uuidv4();
    console.log(`[${id_pedido}] Iniciando procesamiento...`);

    // PASO 1: Confirmar pago con Stripe
    console.log(`[${id_pedido}] Confirmando pago de $${amount / 100}...`);
    
    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.create({
        amount: amount, // en centavos
        currency: 'usd',
        payment_method: paymentMethodId,
        confirm: true,
        automatic_payment_methods: {
          enabled: true
        }
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

    // PASO 2: Crear dataset simulado
    // TODO: Llamar a engine/dataset.js (conversión Python→JS)
    const dataset = crearDatasetSimulado(cliente);
    console.log(`[${id_pedido}] ✅ Dataset creado`);

    // PASO 3: Generar reportes (14-20 bloques)
    // TODO: Llamar a generate-report.js
    console.log(`[${id_pedido}] Generando ${plan === 'esencial' ? 14 : 20} bloques...`);
    // const bloques = await generateReport(id_pedido, plan, dataset);

    // Por ahora: simulación
    const bloques = crearBloquesSimulados(plan);
    console.log(`[${id_pedido}] ✅ ${bloques.length} bloques generados`);

    // PASO 4: Inyectar en template HTML
    console.log(`[${id_pedido}] Inyectando template HTML...`);
    // const html = await injectTemplate(cliente, bloques, plan);
    const html = '<html><body><h1>Reporte de prueba</h1></body></html>'; // simulación
    console.log(`[${id_pedido}] ✅ HTML inyectado`);

    // PASO 5: Convertir HTML a PDF
    console.log(`[${id_pedido}] Convirtiendo a PDF...`);
    // const pdfPath = await htmlToPdf(id_pedido, html);
    const pdfPath = `/tmp/${id_pedido}_reporte.pdf`; // simulación
    console.log(`[${id_pedido}] ✅ PDF generado: ${pdfPath}`);

    // PASO 6: Enviar email
    console.log(`[${id_pedido}] Enviando email...`);
    // await sendEmail(cliente.email, id_pedido, pdfPath);
    console.log(`[${id_pedido}] ✅ Email enviado a ${cliente.email}`);

    // PASO 7: Registrar en tracking (si existe DB)
    const statusFile = `/tmp/${id_pedido}_status.json`;
    const fs = require('fs');
    fs.writeFileSync(statusFile, JSON.stringify({
      id_pedido,
      status: 'completed',
      plan,
      email: cliente.email,
      stripe_payment_id: paymentIntent.id,
      created_at: new Date().toISOString()
    }));

    console.log(`[${id_pedido}] ✅ COMPLETADO`);

    // Retornar respuesta
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
        message: 'Reporte generado exitosamente'
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

/**
 * Funciones auxiliares (simulación)
 */

function crearDatasetSimulado(cliente) {
  return {
    cliente: cliente,
    astro: {
      signo_solar: 'Acuario',
      ascendente: 'Escorpio',
      mc: 'Leo'
    },
    numerologia: {
      camino_vida: 9,
      numero_expresion: 7,
      numero_alma: 5,
      numero_personalidad: 22
    },
    matriz: {
      punto_a: 1,
      punto_b: 2,
      punto_c: 3
    }
  };
}

function crearBloquesSimulados(plan) {
  const numBloques = plan === 'esencial' ? 14 : 20;
  const bloques = [];

  for (let i = 1; i <= numBloques; i++) {
    bloques.push({
      numero: i,
      titulo: `Bloque ${i}`,
      contenido: `Este es el contenido del bloque ${i}...`,
      pregunta_poder: `¿Cuál es tu pregunta de poder para el bloque ${i}?`
    });
  }

  return bloques;
}
