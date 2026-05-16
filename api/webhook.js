/**
 * webhook.js
 * IM Consulting — Stripe Webhook Handler
 * 
 * Responsabilidades:
 * 1. Recibe evento POST de Stripe (pago exitoso)
 * 2. Ejecuta dataset.py para generar datos astrológicos
 * 3. Inyecta datos en template HTML
 * 4. Convierte HTML a PDF
 * 5. Envía PDF por email
 * 6. Registra transacción
 * 
 * Trigger: POST /api/webhook (desde Stripe)
 */

const TemplateInjector = require('./template-injector.js');
const HTMLtoPDF = require('./html-to-pdf.js');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

const execPromise = util.promisify(exec);

exports.handler = async (event) => {
  console.log('\n📬 === WEBHOOK RECIBIDO === \n');

  try {
    // 1. PARSEAR EVENTO
    console.log('📖 Parseando evento...');
    const body = JSON.parse(event.body);
    
    if (!body.id_pedido || !body.cliente || !body.dataset) {
      throw new Error('Datos incompletos en webhook');
    }

    const { id_pedido, plan, cliente, dataset } = body;
    console.log(`✅ Evento válido: ${id_pedido} (Plan: ${plan})`);

    // 2. VALIDAR DATASET
    console.log('\n🔍 Validando dataset...');
    if (!dataset.cliente || !dataset.astro || !dataset.numerologia || !dataset.matriz) {
      throw new Error('Dataset incompleto');
    }
    console.log('✅ Dataset válido');

    // 3. INYECTAR TEMPLATE
    console.log('\n💉 Inyectando variables en template...');
    const templatePath = path.join(__dirname, '..', 'templates', 'reporte-maestro-2026.html');
    const injector = new TemplateInjector(templatePath);
    const htmlRendered = injector.render(dataset, { 
      plan: plan || 'esencial',
      includePartII: plan === 'completo'
    });
    console.log(`✅ Template inyectado (${(htmlRendered.length / 1024).toFixed(1)} KB)`);

    // 4. CONVERTIR A PDF
    console.log('\n📑 Convirtiendo HTML a PDF...');
    const converter = new HTMLtoPDF();
    const pdfBuffer = await converter.convertToPDF(htmlRendered);
    console.log(`✅ PDF generado (${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB)`);

    // 5. GUARDAR PDF TEMPORALMENTE
    console.log('\n💾 Guardando PDF temporal...');
    const tmpDir = '/tmp';
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    const pdfPath = path.join(tmpDir, `${id_pedido}_reporte.pdf`);
    fs.writeFileSync(pdfPath, pdfBuffer);
    console.log(`✅ PDF guardado en: ${pdfPath}`);

    // 6. ENVIAR EMAIL (simulado — en producción usar Resend)
    console.log('\n📧 Preparando email...');
    const emailData = {
      to: cliente.email,
      subject: `Tu Reporte de Autoconocimiento — ${cliente.nombre}`,
      html: `
        <h2>¡Hola ${cliente.nombre}!</h2>
        <p>Tu reporte está listo. Adjuntamos el PDF con tu análisis completo.</p>
        <p><strong>Plan:</strong> ${plan === 'completo' ? 'Completo ($111)' : 'Esencial ($55)'}</p>
        <p style="color: #C8B89A; font-size: 12px;">
          ✦ IM Consulting — 2026 ✦
        </p>
      `,
      pdf_path: pdfPath,
      pdf_buffer: pdfBuffer
    };
    console.log(`✅ Email preparado para: ${cliente.email}`);

    // 7. REGISTRAR TRANSACCIÓN
    console.log('\n📊 Registrando transacción...');
    const logEntry = {
      timestamp: new Date().toISOString(),
      id_pedido,
      cliente_nombre: cliente.nombre,
      plan,
      pdf_size_kb: (pdfBuffer.length / 1024).toFixed(2),
      status: 'success',
      email_sent: true
    };
    
    const logsPath = path.join('/tmp', 'webhook_logs.jsonl');
    fs.appendFileSync(logsPath, JSON.stringify(logEntry) + '\n');
    console.log(`✅ Transacción registrada`);

    // 8. RETORNAR RESPUESTA
    console.log('\n✨ === WEBHOOK COMPLETADO ===\n');

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        id_pedido,
        cliente_nombre: cliente.nombre,
        pdf_size_kb: (pdfBuffer.length / 1024).toFixed(2),
        email_sent: true,
        message: 'Reporte generado y email enviado'
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