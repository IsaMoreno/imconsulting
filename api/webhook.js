/**
 * webhook.js
 * IM Consulting — Stripe Webhook Handler
 * 
 * Recibe evento de Stripe y genera reporte
 */

const TemplateInjector = require('./template-injector.js');
const HTMLtoPDF = require('./html-to-pdf.js');
const fs = require('fs');
const path = require('path');

// Stripe SDK (si lo tienes instalado)
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  console.log('\n📬 === WEBHOOK RECIBIDO === \n');

  try {
    // 1. PARSEAR EVENTO
    const body = event.body;
    
    console.log('📖 Parseando evento...');
    console.log('Body:', body.substring(0, 100) + '...');

    let eventData;
    try {
      eventData = JSON.parse(body);
    } catch (e) {
      console.error('❌ Error parseando JSON:', e.message);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid JSON' })
      };
    }

    console.log('✅ Evento parseado');
    console.log('Event type:', eventData.type);

    // 2. VALIDAR TIPO DE EVENTO
    if (eventData.type !== 'payment_intent.succeeded') {
      console.log('⚠️  Evento ignorado (no es payment_intent.succeeded)');
      return {
        statusCode: 200,
        body: JSON.stringify({ received: true })
      };
    }

    const paymentIntent = eventData.data.object;
    console.log('✅ Payment Intent ID:', paymentIntent.id);

    // 3. EXTRAER DATOS (simulado — en producción vendrían de Stripe)
    const id_pedido = paymentIntent.id;
    const amount = paymentIntent.amount / 100; // Convertir cents a dólares
    const plan = amount >= 111 ? 'completo' : 'esencial';
    const clientEmail = paymentIntent.receipt_email || 'test@test.com';

    console.log(`✅ Plan: ${plan} ($${amount})`);
    console.log(`✅ Email: ${clientEmail}`);

    // 4. CREAR DATASET SIMULADO
    // En producción, esto vendría del pago
    const dataset = {
      cliente: {
        nombre: 'Test Cliente',
        edad: 31,
        ciudad: 'Test City',
        pais: 'Test Country',
        email: clientEmail
      },
      astro: {
        sol_signo: 'Acuario',
        sol_grados: 21.5,
        asc_signo: 'Escorpio',
        asc_grados: 14.2,
        mc_signo: 'Leo',
        mc_grados: 8.7,
        luna: { signo: 'Virgo', grados: 12.3, casa: 7 },
        mercurio: { signo: 'Piscis', grados: 5.1, casa: 1 },
        venus: { signo: 'Sagitario', grados: 18.9, casa: 10 },
        marte: { signo: 'Géminis', grados: 25.4, casa: 4 },
        jupiter: { signo: 'Virgo', grados: 11.2, casa: 7 },
        saturno: { signo: 'Libra', grados: 27.8, casa: 8 },
        urano: { signo: 'Capricornio', grados: 19.5, casa: 11 },
        neptuno: { signo: 'Capricornio', grados: 28.1, casa: 11 },
        pluton: { signo: 'Escorpio', grados: 22.6, casa: 9 },
        balance_elemental: {
          fuego: 16.7,
          tierra: 25.0,
          aire: 33.3,
          agua: 25.0
        }
      },
      numerologia: {
        camino_vida: 9,
        numero_expresion: 22,
        numero_alma: 11,
        numero_personalidad: 4
      },
      matriz: {
        arcano_activo_numero: 5,
        arcano_activo_nombre: 'El Hierofante',
        punto_A: { numero: 11, nombre: 'Justicia' },
        punto_B: { numero: 2, nombre: 'La Sacerdotisa' },
        punto_C: { numero: 7, nombre: 'El Carro' },
        punto_D: { numero: 16, nombre: 'La Torre' },
        punto_E: { numero: 1, nombre: 'El Mago' },
        cronologia: {
          año_1: { numero: 6, nombre: 'Los Enamorados' },
          año_2: { numero: 7, nombre: 'El Carro' },
          año_3: { numero: 8, nombre: 'La Fortaleza' },
          año_4: { numero: 9, nombre: 'El Ermitaño' },
          año_5: { numero: 10, nombre: 'La Rueda de la Fortuna' }
        }
      }
    };

    // 5. INYECTAR TEMPLATE
    console.log('\n💉 Inyectando variables en template...');
    const templatePath = path.join(__dirname, '..', 'templates', 'reporte-maestro-2026.html');
    const injector = new TemplateInjector(templatePath);
    const htmlRendered = injector.render(dataset, { plan });
    console.log(`✅ Template inyectado`);

    // 6. CONVERTIR A PDF
    console.log('\n📑 Convirtiendo HTML a PDF...');
    const converter = new HTMLtoPDF();
    const pdfBuffer = await converter.convertToPDF(htmlRendered);
    console.log(`✅ PDF generado (${(pdfBuffer.length / 1024).toFixed(1)} KB)`);

    // 7. SIMULAR EMAIL (sin Resend por ahora)
    console.log('\n📧 Email sería enviado a:', clientEmail);
    console.log(`   Asunto: Tu Reporte de Autoconocimiento`);
    console.log(`   PDF: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);

    console.log('\n✨ === WEBHOOK COMPLETADO ===\n');

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        id_pedido,
        plan,
        email_sent: true
      })
    };

  } catch (error) {
    console.error('\n❌ ERROR EN WEBHOOK:', error.message);
    console.error(error.stack);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};