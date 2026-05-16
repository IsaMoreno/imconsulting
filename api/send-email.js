/**
 * Send Email: send-email.js
 * 
 * Envía emails con Resend API
 * Usado en webhook.js después de generar el reporte
 */

const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Envía email con el reporte PDF
 * @param {string} to - Email del destinatario
 * @param {string} nombreCliente - Nombre del cliente
 * @param {string} id_pedido - ID único del pedido
 * @param {string} plan - Plan: 'esencial' o 'completo'
 * @returns {object} - { success, messageId, error }
 */
async function sendEmailReporte(to, nombreCliente, id_pedido, plan) {
  try {
    // Validar email
    if (!to || !to.includes('@')) {
      throw new Error('Email inválido');
    }

    // Validar Resend API key
    if (!process.env.RESEND_API_KEY) {
      console.warn('[EMAIL] RESEND_API_KEY no configurada. Usando simulación.');
      return simulateEmail(to, nombreCliente);
    }

    console.log(`[EMAIL] Enviando a ${to}...`);

    // Preparar contenido del email
    const planNombre = plan === 'esencial' ? 'Esencial' : 'Completo';
    const urlDescarga = `${process.env.SITE_URL || 'https://imconsulting.me'}/download?id=${id_pedido}`;

    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu Reporte IM Consulting</title>
  <style>
    body { font-family: Georgia, serif; line-height: 1.6; color: #1A1A1A; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; border-bottom: 2px solid #C8B89A; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { color: #C8B89A; letter-spacing: 2px; margin: 0; }
    .header p { color: #999; font-size: 14px; margin: 5px 0 0 0; }
    .content { margin: 30px 0; }
    .content h2 { color: #C8B89A; }
    .content p { margin: 15px 0; }
    .cta-button { 
      display: inline-block; 
      background-color: #C8B89A; 
      color: white; 
      padding: 12px 30px; 
      text-decoration: none; 
      border-radius: 4px; 
      font-weight: bold; 
      margin: 20px 0;
    }
    .cta-button:hover { background-color: #b8a878; }
    .info-box { 
      background: #f9f9f9; 
      border-left: 4px solid #C8B89A; 
      padding: 15px; 
      margin: 20px 0; 
    }
    .footer { 
      text-align: center; 
      border-top: 1px solid #ddd; 
      padding-top: 20px; 
      margin-top: 40px; 
      color: #999; 
      font-size: 12px; 
    }
    .symbol { color: #C8B89A; font-size: 18px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✦ IM Consulting ✦</h1>
      <p>Tu Reporte de Autoconocimiento está listo</p>
    </div>

    <div class="content">
      <h2>Hola ${nombreCliente},</h2>
      
      <p>¡Tu reporte de <strong>${planNombre}</strong> ha sido generado exitosamente!</p>
      
      <p>Tu análisis integral de autoconocimiento está completo y listo para descargar. Este reporte incluye:</p>
      
      <div class="info-box">
        <p><strong>📊 Perfil Astrológico:</strong> Posiciones planetarias y aspectos</p>
        <p><strong>🔢 Análisis Numerológico:</strong> Números clave de tu vida</p>
        <p><strong>🎴 Matriz del Destino:</strong> Arquetipos y ciclos vitales</p>
        <p><strong>🎯 Diagnóstico Personal:</strong> 14 áreas de tu vida${plan === 'completo' ? ' + transformación' : ''}</p>
      </div>

      <p>Presiona el botón de abajo para descargar tu reporte:</p>
      
      <div style="text-align: center;">
        <a href="${urlDescarga}" class="cta-button">📥 Descargar Mi Reporte</a>
      </div>

      <p style="color: #999; font-size: 13px;">
        <em>El enlace expira en 7 días. Si tienes problemas descargando, contacta a support@imconsulting.me</em>
      </p>

      <div class="info-box" style="background: #fffbf0; border-left-color: #C8B89A;">
        <h3 style="color: #C8B89A; margin-top: 0;">💡 Cómo usar tu reporte:</h3>
        <ol>
          <li><strong>Lee con atención</strong> cada sección</li>
          <li><strong>Reflexiona</strong> sobre las preguntas de poder</li>
          <li><strong>Toma notas</strong> de lo que resuena contigo</li>
          <li><strong>Implementa</strong> los planes de acción sugeridos</li>
        </ol>
      </div>

      <p>Si adquiriste el plan Completo, tu próximo paso es agendar una sesión 1:1 con Isaac para profundizar en tu transformación.</p>

      <p>Con luz,<br><strong>Isaac Moreno</strong><br>Fundador, IM Consulting</p>
    </div>

    <div class="footer">
      <p>✦ IM Consulting © 2026 | Reporte confidencial | Uso personal exclusivo ✦</p>
      <p>Hermosillo, Sonora, México</p>
      <p style="margin-top: 15px;">
        <a href="https://imconsulting.me" style="color: #C8B89A; text-decoration: none;">Visita nuestro sitio</a> | 
        <a href="mailto:support@imconsulting.me" style="color: #C8B89A; text-decoration: none;">Contacto</a>
      </p>
    </div>
  </div>
</body>
</html>
    `;

    const textContent = `
Tu Reporte de Autoconocimiento está listo

Hola ${nombreCliente},

¡Tu reporte de ${planNombre} ha sido generado exitosamente!

Descárgalo aquí: ${urlDescarga}

El enlace expira en 7 días.

Con luz,
Isaac Moreno
IM Consulting
    `.trim();

    // Enviar con Resend
    const response = await resend.emails.send({
      from: 'noreply@imconsulting.me', // Cambiar según tu dominio en Resend
      to: to,
      subject: `Tu Reporte IM Consulting (${planNombre}) está listo para descargar`,
      html: htmlContent,
      text: textContent,
      reply_to: 'support@imconsulting.me'
    });

    console.log(`[EMAIL] ✅ Enviado a ${to} | MessageID: ${response.id}`);

    return {
      success: true,
      messageId: response.id,
      email: to,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error(`[EMAIL] ❌ Error enviando email:`, error.message);
    
    // Fallback: registrar el error pero no fallar el flujo completo
    return {
      success: false,
      error: error.message,
      email: to,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Simulación de email (cuando RESEND_API_KEY no está configurada)
 */
function simulateEmail(to, nombreCliente) {
  console.log(`[EMAIL] 📧 SIMULADO: Email a ${to}`);
  console.log(`[EMAIL] Asunto: Tu Reporte IM Consulting está listo para descargar`);
  console.log(`[EMAIL] Destinatario: ${nombreCliente}`);
  
  return {
    success: true,
    messageId: `sim_${Date.now()}`,
    email: to,
    simulated: true,
    timestamp: new Date().toISOString()
  };
}

module.exports = { sendEmailReporte, simulateEmail };