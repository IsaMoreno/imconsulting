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
async function sendEmailReporte(to, nombreCliente, id_pedido, plan, pdfBuffer = null, bloquesHtml = null) {
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

    const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu Reporte IM Consulting</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;">
  <table border="0" width="100%" cellspacing="0" cellpadding="0">
    <tbody>
      <tr>
        <td style="padding:40px 16px 56px;" align="center">
          <table style="max-width:600px;width:100%;" border="0" width="600" cellspacing="0" cellpadding="0">
            <tbody>

              <!-- HEADER: logo + tagline -->
              <tr>
                <td style="padding-bottom:32px;border-bottom:1px solid #e8e0d5;" align="center">
                  <table border="0" width="100%" cellspacing="0" cellpadding="0">
                    <tbody>
                      <tr>
                        <td align="left" valign="middle">
                          <img style="display:block;border:0;outline:none;width:80px;height:auto;" src="https://res.cloudinary.com/dmmiebjew/image/upload/v1780617921/Logo_IM_Consulting_transparente_soyfcj.png" alt="I.M. Consulting" width="80">
                        </td>
                        <td align="right" valign="middle">
                          <p style="margin:0;font-family:Georgia,serif;font-size:9px;color:#c8b89a;letter-spacing:2px;text-transform:uppercase;font-style:italic;">Consultoría de Autoconocimiento</p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>

              <!-- LÍNEA DORADA -->
              <tr>
                <td style="padding:0;line-height:0;">
                  <table border="0" width="100%" cellspacing="0" cellpadding="0">
                    <tbody>
                      <tr>
                        <td style="background-color:#c8b89a;height:2px;font-size:0;line-height:0;">&nbsp;</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>

              <!-- ESPACIO -->
              <tr><td height="48">&nbsp;</td></tr>

              <!-- PARA -->
              <tr>
                <td style="padding-bottom:6px;">
                  <p style="margin:0;font-family:Georgia,serif;font-size:10px;color:#c8b89a;letter-spacing:3px;text-transform:uppercase;">Para</p>
                </td>
              </tr>
              <tr>
                <td style="padding-bottom:32px;border-bottom:1px solid #e8e0d5;">
                  <p style="margin:0;font-family:Georgia,serif;font-size:24px;color:#1a1a1a;letter-spacing:0.5px;">${nombreCliente}</p>
                </td>
              </tr>

              <!-- ESPACIO -->
              <tr><td height="32">&nbsp;</td></tr>

              <!-- CUERPO -->
              <tr>
                <td style="padding-bottom:40px;">
                  <p style="margin:0 0 18px;font-family:Arial,sans-serif;font-size:14px;color:#3d3d3d;line-height:1.9;letter-spacing:0.1px;">¡Tu reporte está listo! Elegir conocerte con esta profundidad requiere algo que no abunda: honestidad contigo mismo y disposición real a ver lo que hay, no solo lo que quisieras encontrar.</p>
                  <p style="margin:0 0 18px;font-family:Arial,sans-serif;font-size:14px;color:#3d3d3d;line-height:1.9;letter-spacing:0.1px;">Eso merece reconocimiento. Así comenzaste este camino de autoconocimiento y transformación.</p>
                  <p style="margin:0 0 18px;font-family:Arial,sans-serif;font-size:14px;color:#3d3d3d;line-height:1.9;letter-spacing:0.1px;">Tu reporte está adjunto a este correo. Es el resultado de integrar múltiples lecturas de ti en una sola voz — no es información genérica, cada observación parte de tus datos únicos, una síntesis ultra personalizada. Léelo con calma, en momentos donde puedas estar contigo sin prisa.</p>
                  <p style="margin:0 0 18px;font-family:Arial,sans-serif;font-size:14px;color:#3d3d3d;line-height:1.9;letter-spacing:0.1px;">Las preguntas al final de cada sección son las que más trabajo hacen. No las saltes — son el punto donde el reporte deja de ser lectura y se convierte en algo tuyo.</p>
                  <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:#3d3d3d;line-height:1.9;letter-spacing:0.1px;">Si algo resuena fuerte, anótalo. Si algo incomoda, mejor todavía.</p>
                </td>
              </tr>

              <!-- BLOQUES DEL REPORTE (solo en modo admin, sin PDF) -->
              ${bloquesHtml ? `
              <tr>
                <td style="padding-bottom:40px;border-top:1px solid #e8e0d5;padding-top:32px;">
                  <p style="margin:0 0 24px;font-family:Georgia,serif;font-size:11px;color:#c8b89a;letter-spacing:3px;text-transform:uppercase;">Tu Reporte</p>
                  <div style="font-family:Arial,sans-serif;font-size:14px;color:#3d3d3d;line-height:1.8;">${bloquesHtml}</div>
                </td>
              </tr>
              ` : `
              <!-- BOTÓN DESCARGAR -->
              <tr>
                <td style="padding-bottom:16px;" align="center">
                  <a href="${urlDescarga}" style="display:inline-block;background-color:#1a1a1a;color:#ffffff;font-family:Arial,sans-serif;font-size:10px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;text-decoration:none;padding:14px 40px;">Descargar Reporte</a>
                </td>
              </tr>
              `}

              <!-- BOTÓN NUESTRA WEB -->
              <tr>
                <td style="padding-bottom:48px;" align="center">
                  <a href="https://imconsulting.netlify.app/" style="display:inline-block;background-color:transparent;color:#c8b89a;font-family:Arial,sans-serif;font-size:10px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;text-decoration:none;padding:14px 40px;border:1px solid #ddd0bf;">Nuestra Web</a>
                </td>
              </tr>

              <!-- FIRMA -->
              <tr>
                <td style="border-top:1px solid #e8e0d5;padding-top:32px;">
                  <table border="0" width="100%" cellspacing="0" cellpadding="0">
                    <tbody>
                      <tr>
                        <td style="padding-bottom:4px;">
                          <p style="margin:0;font-family:Georgia,serif;font-size:15px;color:#1a1a1a;letter-spacing:0.3px;">Isaac Moreno</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom:16px;">
                          <p style="margin:0;font-family:Arial,sans-serif;font-size:9px;color:#c8b89a;letter-spacing:2.5px;text-transform:uppercase;">I.M.Consulting</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom:8px;">
                          <p style="margin:0;font-family:Georgia,serif;font-size:13px;color:#3d3d3d;font-style:italic;">Bendiciones,</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom:16px;">
                          <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:#888888;line-height:2;">
                            <a href="mailto:imconsulting.me@gmail.com" style="color:#888888;text-decoration:none;">imconsulting.me@gmail.com</a><br>
                            <a href="https://wa.me/526627003532" style="color:#888888;text-decoration:none;">+52 662 700 3532</a><br>
                            <a href="https://imconsulting.netlify.app/" style="color:#c8b89a;text-decoration:none;letter-spacing:0.5px;">imconsulting.netlify.app</a>
                          </p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>

              <!-- ESPACIO -->
              <tr><td height="24">&nbsp;</td></tr>

              <!-- FOOTER -->
              <tr>
                <td style="border-top:1px solid #e8e0d5;padding-top:20px;">
                  <table border="0" width="100%" cellspacing="0" cellpadding="0">
                    <tbody>
                      <tr>
                        <td align="left">
                          <p style="margin:0;font-family:Arial,sans-serif;font-size:8px;color:#ddd0bf;letter-spacing:3px;text-transform:uppercase;">I.M.Consulting</p>
                        </td>
                        <td align="right">
                          <p style="margin:0;font-family:Georgia,serif;font-size:8px;color:#ddd0bf;letter-spacing:2px;text-transform:uppercase;font-style:italic;">Consultoría de Autoconocimiento</p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>

            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
</body>
</html>`;

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
    const emailPayload = {
      from: process.env.REPORT_EMAIL_FROM || 'onboarding@resend.dev',
      to: to,
      bcc: process.env.ISAAC_EMAIL || process.env.OWNER_EMAIL || 'its.isaacmoreno@gmail.com',
      subject: `${nombreCliente}, tu Reporte IM Consulting (${planNombre}) ya está listo`,
      html: htmlContent,
      text: textContent,
      reply_to: 'imconsulting.me@gmail.com',
    };

    if (pdfBuffer) {
      emailPayload.attachments = [{
        filename: `reporte-im-consulting-${id_pedido.slice(0, 8)}.pdf`,
        content: pdfBuffer.toString('base64'),
      }];
    }

    const response = await resend.emails.send(emailPayload);

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
function simulateEmail(to, nombreCliente, pdfBuffer = null) {
  console.log(`[EMAIL] 📧 SIMULADO: Email a ${to}`);
  console.log(`[EMAIL] Asunto: Tu Reporte IM Consulting está listo`);
  console.log(`[EMAIL] Destinatario: ${nombreCliente}`);
  console.log(`[EMAIL] PDF adjunto: ${pdfBuffer ? `${(pdfBuffer.length / 1024).toFixed(0)} KB` : 'no'}`);
  
  return {
    success: true,
    messageId: `sim_${Date.now()}`,
    email: to,
    simulated: true,
    timestamp: new Date().toISOString()
  };
}

module.exports = { sendEmailReporte, simulateEmail };