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

// Stripe SDK
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Template HTML incrustado (simplificado para producción)
const TEMPLATE_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte — {{cliente.nombre}}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Georgia', serif; background: #EDE3CC; color: #1A1A1A; line-height: 1.6; }
        .container { max-width: 900px; margin: 0 auto; background: white; padding: 60px; }
        h1 { text-align: center; font-size: 24px; letter-spacing: 2px; margin: 40px 0; color: #B8960C; }
        h2 { font-size: 16px; letter-spacing: 1px; margin: 30px 0 15px; border-bottom: 2px solid #B8960C; padding-bottom: 10px; color: #333; }
        .bloque { margin: 25px 0; padding: 20px; border-left: 3px solid #B8960C; }
        .bl-tit { font-weight: bold; font-size: 14px; margin-bottom: 10px; }
        .bl-body { font-size: 12px; line-height: 1.7; margin-bottom: 10px; }
        .pregunta { font-style: italic; color: #666; margin: 15px 0; padding-left: 15px; font-size: 12px; }
        table { width: 100%; margin: 20px 0; border-collapse: collapse; font-size: 12px; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #B8960C; }
        th { background: #F5F1E8; font-weight: bold; color: #B8960C; }
        .footer { text-align: center; margin-top: 60px; padding-top: 20px; border-top: 2px solid #B8960C; font-size: 11px; color: #999; }
        .symbol { text-align: center; font-size: 20px; color: #B8960C; margin: 20px 0; }
    </style>
</head>
<body>
<div class="container">
    <div class="symbol">✦</div>
    <h1>REPORTE DE AUTOCONOCIMIENTO</h1>
    <p style="text-align: center; font-style: italic; color: #666; font-size: 13px;">Análisis Integral · Edición Personal</p>
    
    <hr style="border: none; border-top: 1px solid #B8960C; margin: 40px 0;">
    
    <h2>Perfil Astro-Numerológico</h2>
    <table>
        <tr>
            <th>Elemento</th>
            <th>Valor</th>
        </tr>
        <tr>
            <td>Signo Solar</td>
            <td>{{astro.sol_signo}} ({{astro.sol_grados}}°)</td>
        </tr>
        <tr>
            <td>Ascendente</td>
            <td>{{astro.asc_signo}} ({{astro.asc_grados}}°)</td>
        </tr>
        <tr>
            <td>MC</td>
            <td>{{astro.mc_signo}} ({{astro.mc_grados}}°)</td>
        </tr>
        <tr>
            <td>Camino de Vida</td>
            <td>{{numerologia.camino_vida}}</td>
        </tr>
        <tr>
            <td>Número Expresión</td>
            <td>{{numerologia.numero_expresion}}</td>
        </tr>
        <tr>
            <td>Arcano Activo (2026)</td>
            <td>{{matriz.arcano_activo_nombre}} ({{matriz.arcano_activo_numero}})</td>
        </tr>
    </table>
    
    <h2>Parte I — Diagnóstico</h2>
    {{{bloques_parte_i}}}
    
    {{#if mostrar_parte_ii}}
    <h2>Parte II — Transformación</h2>
    {{{bloques_parte_ii}}}
    {{/if}}
    
    <div class="footer">
        <div class="symbol">✦</div>
        <p>IM Consulting · 2026</p>
        <p>Reporte confidencial · Uso personal exclusivo</p>
    </div>
</div>
</body>
</html>`;

exports.handler = async (event) => {
  console.log('\n📬 === WEBHOOK RECIBIDO === \n');

  try {
    // 1. PARSEAR EVENTO
    const body = event.body;
    
    console.log('📖 Parseando evento...');

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

    // 3. EXTRAER DATOS
    const id_pedido = paymentIntent.id;
    const amount = paymentIntent.amount / 100;
    const plan = amount >= 111 ? 'completo' : 'esencial';
    const clientEmail = paymentIntent.receipt_email || 'test@test.com';

    console.log(`✅ Plan: ${plan} ($${amount})`);
    console.log(`✅ Email: ${clientEmail}`);

    // 4. CREAR DATASET (en producción vendría de metadata de Stripe)
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
        balance_elemental: { fuego: 16.7, tierra: 25.0, aire: 33.3, agua: 25.0 }
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

    // 5. INYECTAR TEMPLATE (usar template incrustado)
    console.log('\n💉 Inyectando variables en template...');
    const injector = new TemplateInjector(null, TEMPLATE_HTML);
    const htmlRendered = injector.render(dataset, { plan });
    console.log(`✅ Template inyectado`);

    // 6. CONVERTIR A PDF
    console.log('\n📑 Convirtiendo HTML a PDF...');
    const converter = new HTMLtoPDF();
    const pdfBuffer = await converter.convertToPDF(htmlRendered);
    console.log(`✅ PDF generado (${(pdfBuffer.length / 1024).toFixed(1)} KB)`);

    // 7. EMAIL (simulado por ahora)
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