'use strict';

/**
 * IM Consulting — Railway Service
 * Genera reportes completos sin límite de timeout.
 * Responde 202 inmediato a Make, procesa en background.
 */

const express   = require('express');
const fs        = require('fs');
const path      = require('path');
const crypto    = require('crypto');
const Anthropic = require('@anthropic-ai/sdk');
const { Resend } = require('resend');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ── Clientes API ──────────────────────────────────────────────────────────────
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const resend    = new Resend(process.env.RESEND_API_KEY);

// ── Paths (Railway despliega desde raíz del repo) ─────────────────────────────
const PROMPTS_DIR = path.join(__dirname, '..', 'prompts');

// ── Cargar prompts ────────────────────────────────────────────────────────────
function load(file) {
  try { return fs.readFileSync(path.join(PROMPTS_DIR, file), 'utf8'); } catch { return ''; }
}

const CAPA_A     = load('00_CORE.md').split('## CAPA B')[0];
const ZOHAR_DATA = load('01_ZOHAR.md');
const KABB_DATA  = load('02_KABBALAH.md');
let   ARBOL_DATA = { herramientas: {} };
try { ARBOL_DATA = JSON.parse(load('03_ARBOL.json')); } catch {}

// ── Catálogo de bloques ───────────────────────────────────────────────────────
const BLOQUES_META = {
  B1:'Perfil Esencial', B2:'Propósito y Misión', B3:'Mente y Emociones',
  B4:'Subconsciente', B5:'Patrones Limitantes', B6:'Familia y Linaje',
  B7:'Amor y Vínculos', B8:'Ámbito Profesional', B9:'Dinero',
  B10:'Salud y Cuerpo', B11:'Fortalezas', B12:'Ciclos',
  B13:'FODA Personal', B14:'Resumen',
  'B2.1':'Activación I', 'B2.2':'Activación II', 'B2.3':'Activación III',
  'B2.4':'Activación IV', 'B2.5':'Activación V', 'B2.6':'Activación VI',
};

const SECUENCIA_55  = ['B1','B2','B3','B4','B5','B6','B8','B10','B11','B12','B13','B14','B2.1','B2.3'];
const SECUENCIA_111 = ['B1','B2','B3','B4','B5','B6','B7','B8','B9','B10','B11','B12','B13','B14','B2.1','B2.2','B2.3','B2.4','B2.5','B2.6'];

// ── Helpers ───────────────────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

function extractZoharRow(bloque) {
  const m = ZOHAR_DATA.match(new RegExp(`^\\|\\s*${bloque}\\s*\\|(.+?)\\|`, 'm'));
  return m ? m[1].trim() : '';
}

function extractKabbRow(signo) {
  const m = KABB_DATA.match(new RegExp(`^\\|\\s*${signo}\\s*\\|(.+?)\\|`, 'm'));
  return m ? m[1].trim() : '';
}

function getAncla() {
  const tools = ARBOL_DATA.herramientas || {};
  const dom = Object.values(tools).sort((a, b) => a.prioridad - b.prioridad)[0];
  return dom ? `Ancla: ${dom.ancla_universal}. Escribe en lenguaje cotidiano, sin nombrar sistemas, frases cortas y directas.` : '';
}

function calcularSignoSolar(day, month) {
  const s = [
    {n:'Capricornio',f:[1,19]},{n:'Acuario',f:[2,18]},{n:'Piscis',f:[3,20]},
    {n:'Aries',f:[4,19]},{n:'Tauro',f:[5,20]},{n:'Géminis',f:[6,20]},
    {n:'Cáncer',f:[7,22]},{n:'Leo',f:[8,22]},{n:'Virgo',f:[9,22]},
    {n:'Libra',f:[10,22]},{n:'Escorpio',f:[11,21]},{n:'Sagitario',f:[12,21]},
    {n:'Capricornio',f:[12,31]},
  ];
  for (const x of s) if (month < x.f[0] || (month === x.f[0] && day <= x.f[1])) return x.n;
  return 'Capricornio';
}

function calcularNumerologia(nombre, day, month, year) {
  const reducir = n => { while (n > 9 && n !== 11 && n !== 22 && n !== 33) n = String(n).split('').reduce((a,d)=>a+parseInt(d),0); return n; };
  const mapa = {A:1,B:2,C:3,D:4,E:5,F:8,G:3,H:5,I:1,J:1,K:2,L:3,M:4,N:5,O:7,P:8,Q:1,R:2,S:3,T:4,U:6,V:6,W:6,X:5,Y:1,Z:7,Á:1,É:5,Í:1,Ó:7,Ú:6,Ü:6,Ñ:5};
  const expresion = reducir([...nombre.toUpperCase().replace(/[^A-ZÁÉÍÓÚÜÑ]/g,'')].reduce((a,l)=>a+(mapa[l]||0),0));
  return { camino_de_vida: reducir(day+month+year), numero_expresion: expresion };
}

function buildDataset(nombre, fecha, hora, ciudad) {
  const [year, month, day] = fecha.split('-').map(Number);
  const signo = calcularSignoSolar(day, month);
  const edad  = new Date().getFullYear() - year;
  const num   = calcularNumerologia(nombre, day, month, year);
  return {
    signo_solar: signo, edad,
    camino_de_vida: num.camino_de_vida,
    numero_expresion: num.numero_expresion,
    fecha_nacimiento: fecha,
    hora_nacimiento: hora,
    ciudad_nacimiento: ciudad,
  };
}

// ── Generar un bloque con Claude ──────────────────────────────────────────────
async function callBloque(codigo, cliente, dataset) {
  const signo   = dataset.signo_solar || 'Desconocido';
  const zohar   = extractZoharRow(codigo);
  const kabb    = extractKabbRow(signo);
  const ancla   = getAncla();

  let userMsg =
    `Cliente: ${cliente.nombre}\n\nDataset:\n${JSON.stringify(dataset, null, 2)}` +
    `\n\nPrincipio activo (Zohar): ${zohar}` +
    `\n\nTraducción kabbalística (${signo}): ${kabb}`;

  if (ancla) userMsg += `\n\n${ancla}`;
  userMsg += `\n\nDesarrolla ${codigo}: ${BLOQUES_META[codigo]}`;

  for (let i = 1; i <= 3; i++) {
    if (i > 1) await sleep(3000);
    try {
      const res = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        temperature: 0,
        system: [{ type: 'text', text: CAPA_A, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: userMsg }],
      });
      const texto = res.content[0]?.text || '';
      return { bloque: codigo, titulo: BLOQUES_META[codigo], contenido: texto, error: false };
    } catch (err) {
      console.error(`[${codigo}] intento ${i} fallido:`, err.message);
      if (i === 3) return { bloque: codigo, titulo: BLOQUES_META[codigo], contenido: '', error: true };
    }
  }
}

// ── Enviar email ──────────────────────────────────────────────────────────────
async function sendEmail(to, nombreDestinatario, nombreCliente, plan, id_pedido, bloquesHtml) {
  const planNombre = plan === 'completo' ? 'Completo' : 'Esencial';
  const bannerAdmin = nombreDestinatario === 'Isaac' ? `
    <div style="background:#f5f5f5;border-left:3px solid #c8b89a;padding:12px 16px;margin-bottom:24px;font-family:Arial,sans-serif;font-size:12px;color:#888;">
      Reporte generado para <strong>${nombreCliente}</strong> — Plan ${plan} — ID ${id_pedido}
    </div>` : '';

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#fff;">
  <table border="0" width="100%" cellspacing="0" cellpadding="0">
    <tbody><tr><td style="padding:40px 16px 56px;" align="center">
      <table style="max-width:600px;width:100%;" border="0" cellspacing="0" cellpadding="0">
        <tbody>
          <tr><td style="padding-bottom:32px;border-bottom:1px solid #e8e0d5;" align="center">
            <table border="0" width="100%" cellspacing="0" cellpadding="0"><tbody><tr>
              <td align="left" valign="middle">
                <img style="display:block;border:0;width:80px;height:auto;" src="https://res.cloudinary.com/dmmiebjew/image/upload/v1780617921/Logo_IM_Consulting_transparente_soyfcj.png" alt="I.M. Consulting" width="80">
              </td>
              <td align="right" valign="middle">
                <p style="margin:0;font-family:Georgia,serif;font-size:9px;color:#c8b89a;letter-spacing:2px;text-transform:uppercase;font-style:italic;">Consultoría de Autoconocimiento</p>
              </td>
            </tr></tbody></table>
          </td></tr>
          <tr><td style="padding:0;line-height:0;">
            <table border="0" width="100%" cellspacing="0" cellpadding="0"><tbody>
              <tr><td style="background-color:#c8b89a;height:2px;font-size:0;line-height:0;">&nbsp;</td></tr>
            </tbody></table>
          </td></tr>
          <tr><td height="48">&nbsp;</td></tr>
          <tr><td style="padding-bottom:6px;">
            <p style="margin:0;font-family:Georgia,serif;font-size:10px;color:#c8b89a;letter-spacing:3px;text-transform:uppercase;">Para</p>
          </td></tr>
          <tr><td style="padding-bottom:32px;border-bottom:1px solid #e8e0d5;">
            <p style="margin:0;font-family:Georgia,serif;font-size:24px;color:#1a1a1a;">${nombreDestinatario}</p>
          </td></tr>
          <tr><td height="32">&nbsp;</td></tr>
          <tr><td style="padding-bottom:40px;">
            ${bannerAdmin}
            <div style="font-family:Arial,sans-serif;font-size:14px;color:#3d3d3d;line-height:1.8;">
              ${bloquesHtml}
            </div>
          </td></tr>
          <tr><td style="border-top:1px solid #e8e0d5;padding-top:32px;">
            <p style="margin:0 0 4px;font-family:Georgia,serif;font-size:15px;color:#1a1a1a;">Isaac Moreno</p>
            <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:9px;color:#c8b89a;letter-spacing:2.5px;text-transform:uppercase;">I.M.Consulting</p>
            <p style="margin:0;font-family:Georgia,serif;font-size:13px;color:#3d3d3d;font-style:italic;">Bendiciones,</p>
          </td></tr>
        </tbody>
      </table>
    </td></tr></tbody>
  </table>
</body></html>`;

  await resend.emails.send({
    from:     process.env.REPORT_EMAIL_FROM || 'onboarding@resend.dev',
    to,
    subject:  `${nombreCliente}, tu Reporte IM Consulting (${planNombre}) ya está listo`,
    html,
  });
}

// ── Proceso completo en background ────────────────────────────────────────────
async function procesarReporte(nombre, email, fecha, hora, ciudad, plan, id_pedido) {
  try {
    console.log(`[${id_pedido}] 🚀 Iniciando generación...`);
    const dataset   = buildDataset(nombre, fecha, hora, ciudad);
    const secuencia = plan === 'completo' ? SECUENCIA_111 : SECUENCIA_55;
    const cliente   = { nombre, email, plan };

    const bloques = [];
    for (const codigo of secuencia) {
      const b = await callBloque(codigo, cliente, dataset);
      bloques.push(b);
      console.log(`[${id_pedido}] ✅ ${codigo} — ${b.error ? 'ERROR' : 'ok'}`);
    }

    const bloquesHtml = bloques.map(b => `
      <section style="margin-bottom:2rem">
        <h2 style="font-size:1.1rem;color:#1a1a1a;border-bottom:1px solid #e0e0e0;padding-bottom:0.5rem">${b.titulo}</h2>
        <div style="line-height:1.8;color:#333">${b.contenido}</div>
      </section>
    `).join('');

    await sendEmail(email, nombre, nombre, plan, id_pedido, bloquesHtml);
    console.log(`[${id_pedido}] ✅ Email enviado a ${email}`);

    const isaacEmail = process.env.ISAAC_EMAIL || 'its.isaacmoreno@gmail.com';
    await sendEmail(isaacEmail, 'Isaac', nombre, plan, id_pedido, bloquesHtml);
    console.log(`[${id_pedido}] ✅ Copia enviada a Isaac`);

  } catch (err) {
    console.error(`[${id_pedido}] ❌ Error fatal:`, err.message);
  }
}

// ── Endpoint ──────────────────────────────────────────────────────────────────
app.post('/admin-report', (req, res) => {
  const { secret, nombre, email, fecha, hora = '12:00', ciudad, plan = 'esencial' } = req.body;

  const secretEnviado = req.headers['x-admin-secret'] || secret;
  if (secretEnviado !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  if (!nombre || !email || !fecha || !ciudad) {
    return res.status(400).json({ error: 'Faltan campos: nombre, email, fecha, ciudad' });
  }

  if (!['esencial', 'completo'].includes(plan)) {
    return res.status(400).json({ error: 'Plan inválido' });
  }

  const id_pedido = `admin-${crypto.randomUUID().slice(0, 8)}`;
  console.log(`[${id_pedido}] 🎙️ ${nombre} | ${plan} | ${ciudad}`);

  // Responder inmediato y procesar en background
  res.status(202).json({
    success:  true,
    id_pedido,
    mensaje:  `Procesando reporte para ${nombre}. Llegará al correo en 2-3 minutos.`,
  });

  procesarReporte(nombre, email, fecha, hora, ciudad, plan, id_pedido);
});

app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`✅ IM Consulting Railway service en puerto ${PORT}`));
