/**
 * admin-report.js — Endpoint privado para generación de reportes sin pago
 *
 * Uso: Isaac lo dispara desde Make (voz → iPhone Shortcuts → Make → POST aquí)
 * Autenticación: header X-Admin-Secret o campo "secret" en el body
 *
 * Body esperado (desde Make):
 * {
 *   "secret":   "...",           // ADMIN_SECRET env var
 *   "nombre":   "María López",
 *   "email":    "maria@email.com",
 *   "fecha":    "1990-03-15",    // YYYY-MM-DD
 *   "hora":     "14:30",         // HH:MM (opcional, default 12:00)
 *   "ciudad":   "Guadalajara, México",
 *   "plan":     "esencial"       // "esencial" | "completo"
 * }
 */

const crypto = require('crypto');
const https  = require('https');
const { sendEmailReporte } = require('./send-email');

const SITE_URL = process.env.URL || process.env.SITE_URL || 'https://imconsulting.netlify.app';

// Llama a generate-report.js como función Netlify interna
async function callGenerateReport(id_pedido, plan, clienteData, dataset) {
  // generate-report espera plan como '$55' o '$111'
  const planCode = plan === 'completo' ? '$111' : '$55';
  const res = await fetch(`${SITE_URL}/.netlify/functions/generate-report`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_pedido, plan: planCode, cliente: clienteData, dataset }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`generate-report: ${txt.slice(0, 300)}`);
  }
  const data = await res.json();
  return data.bloques || [];
}

// ─── Geocodificación (misma lógica que webhook.js) ───────────────────────────

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

// ─── Dataset inline (signo solar + datos básicos sin Python) ─────────────────

function calcularSignoSolar(day, month) {
  const signos = [
    { nombre: 'Capricornio', fin: [1, 19] },
    { nombre: 'Acuario',     fin: [2, 18] },
    { nombre: 'Piscis',      fin: [3, 20] },
    { nombre: 'Aries',       fin: [4, 19] },
    { nombre: 'Tauro',       fin: [5, 20] },
    { nombre: 'Géminis',     fin: [6, 20] },
    { nombre: 'Cáncer',      fin: [7, 22] },
    { nombre: 'Leo',         fin: [8, 22] },
    { nombre: 'Virgo',       fin: [9, 22] },
    { nombre: 'Libra',       fin: [10, 22] },
    { nombre: 'Escorpio',    fin: [11, 21] },
    { nombre: 'Sagitario',   fin: [12, 21] },
    { nombre: 'Capricornio', fin: [12, 31] },
  ];
  for (const s of signos) {
    if (month < s.fin[0] || (month === s.fin[0] && day <= s.fin[1])) return s.nombre;
  }
  return 'Capricornio';
}

function calcularNumerologia(nombre, day, month, year) {
  const reducir = (n) => {
    while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
      n = String(n).split('').reduce((a, d) => a + parseInt(d), 0);
    }
    return n;
  };
  const camino = reducir(day + month + year);
  const letras = nombre.toUpperCase().replace(/[^A-ZÁÉÍÓÚÜÑ]/g, '');
  const mapa   = { A:1,B:2,C:3,D:4,E:5,F:8,G:3,H:5,I:1,J:1,K:2,L:3,M:4,N:5,O:7,P:8,Q:1,R:2,S:3,T:4,U:6,V:6,W:6,X:5,Y:1,Z:7,Á:1,É:5,Í:1,Ó:7,Ú:6,Ü:6,Ñ:5 };
  const expresion = reducir([...letras].reduce((a, l) => a + (mapa[l] || 0), 0));
  return { camino_de_vida: camino, numero_expresion: expresion };
}

function buildDatasetInline(cliente) {
  const [year, month, day] = (cliente.fecha || '2000-01-01').split('-').map(Number);
  const signo = calcularSignoSolar(day, month);
  const edad  = new Date().getFullYear() - year;
  const num   = calcularNumerologia(cliente.nombre || '', day, month, year);

  return {
    cliente: {
      nombre:          cliente.nombre || '',
      email:           cliente.email  || '',
      fechaNacimiento: cliente.fecha  || '',
      horaNacimiento:  cliente.hora   || '12:00',
      ciudad:          cliente.ciudad || '',
    },
    resumen: {
      signo_solar:    signo,
      edad:           edad,
      camino_de_vida: num.camino_de_vida,
    },
    astro: {
      sol: { sign: signo, degrees: day, house: 'I' },
    },
    numerologia: {
      camino_de_vida: num.camino_de_vida,
      numero_expresion: num.numero_expresion,
    },
    matriz: {},
  };
}

// ─── Handler principal ────────────────────────────────────────────────────────

async function procesarReporte(nombre, email, fecha, hora, ciudad, plan, id_pedido) {
  try {
    const cliente = { nombre, email, fecha, hora, ciudad };
    const dataset = buildDatasetInline(cliente);
    console.log(`[${id_pedido}] ✅ Dataset — signo: ${dataset.resumen.signo_solar}`);

    const clienteData = { nombre, email, plan, fechaNacimiento: fecha, horaNacimiento: hora, ciudad };
    const bloques = await callGenerateReport(id_pedido, plan, clienteData, dataset.resumen);
    console.log(`[${id_pedido}] ✅ ${bloques.length} bloques generados`);

    const bloquesHtml = bloques.map((b, i) => `
      <section style="margin-bottom:2rem">
        <h2 style="font-size:1.1rem;color:#1a1a1a;border-bottom:1px solid #e0e0e0;padding-bottom:0.5rem">
          ${b.titulo || `Bloque ${i + 1}`}
        </h2>
        <div style="line-height:1.8;color:#333">${b.contenido || b.texto || ''}</div>
      </section>
    `).join('');

    await sendEmailReporte(email, nombre, id_pedido, plan, null, bloquesHtml);
    console.log(`[${id_pedido}] ✅ Email enviado al cliente`);

    const isaacEmail = process.env.ISAAC_EMAIL || 'its.isaacmoreno@gmail.com';
    const bloquesHtmlIsaac = `
      <div style="background:#f5f5f5;border-left:3px solid #c8b89a;padding:12px 16px;margin-bottom:24px;font-family:Arial,sans-serif;font-size:12px;color:#888;">
        Reporte generado para <strong>${nombre}</strong> — ${email} — Plan ${plan} — ID ${id_pedido}
      </div>
      ${bloquesHtml}
    `;
    await sendEmailReporte(isaacEmail, 'Isaac', id_pedido, plan, null, bloquesHtmlIsaac);
    console.log(`[${id_pedido}] ✅ Copia enviada a Isaac`);
  } catch (err) {
    console.error(`[${id_pedido}] ❌ Error en procesarReporte:`, err.message);
  }
}

exports.handler = async (event) => {
  // Solo POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'JSON inválido' }) };
  }

  // ── Autenticación ──────────────────────────────────────────────────────────
  const adminSecret  = process.env.ADMIN_SECRET;
  const secretEnviado = event.headers['x-admin-secret'] || body.secret;

  if (!adminSecret || secretEnviado !== adminSecret) {
    console.warn('[admin-report] ❌ Intento de acceso no autorizado');
    return { statusCode: 401, body: JSON.stringify({ error: 'No autorizado' }) };
  }

  // ── Validación básica ──────────────────────────────────────────────────────
  const { nombre, email, fecha, hora = '12:00', ciudad, plan = 'esencial' } = body;

  if (!nombre || !email || !fecha || !ciudad) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Faltan campos: nombre, email, fecha, ciudad' }),
    };
  }

  if (!['esencial', 'completo'].includes(plan)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Plan inválido. Usa: esencial | completo' }) };
  }

  const id_pedido = `admin-${crypto.randomUUID().slice(0, 8)}`;
  console.log(`[${id_pedido}] 🎙️ Admin report: ${nombre} | ${plan} | ${ciudad}`);

  // ── Responder inmediato — procesar en background sin bloquear ─────────────
  procesarReporte(nombre, email, fecha, hora, ciudad, plan, id_pedido);

  return {
    statusCode: 202,
    body: JSON.stringify({
      success:   true,
      id_pedido,
      mensaje:   `Procesando reporte para ${nombre}. Llegará al correo en 2-3 minutos.`,
    }),
  };
};
