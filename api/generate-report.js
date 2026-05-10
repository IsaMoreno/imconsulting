'use strict';

const fs         = require('fs');
const path       = require('path');
const Anthropic  = require('@anthropic-ai/sdk');

// ── Paths ─────────────────────────────────────────────────────────────────────
const PROMPTS_DIR = path.join(__dirname, '..', 'prompts');

// ── Block catalogue ───────────────────────────────────────────────────────────
const BLOQUES_META = {
  B1:    'Perfil Esencial',
  B2:    'Propósito y Misión',
  B3:    'Mente y Emociones',
  B4:    'Subconsciente',
  B5:    'Patrones Limitantes',
  B6:    'Familia y Linaje',
  B7:    'Amor y Vínculos',
  B8:    'Ámbito Profesional',
  B9:    'Dinero',
  B10:   'Salud y Cuerpo',
  B11:   'Fortalezas',
  B12:   'Ciclos',
  B13:   'FODA Personal',
  B14:   'Resumen',
  'B2.1':'Integración Energética',
  'B2.2':'Ruptura de Patrones',
  'B2.3':'Reprogramación',
  'B2.4':'Trascender Patrones',
  'B2.5':'Estrategia de Vida',
  'B2.6':'Plan de Acción',
};

const SECUENCIA_55 = [
  'B1','B2','B3','B4','B5','B6',
  'B8','B10','B11','B12','B13','B14',
  'B2.1','B2.3',
];

const SECUENCIA_111 = [
  'B1','B2','B3','B4','B5','B6','B7',
  'B8','B9','B10','B11','B12','B13','B14',
  'B2.1','B2.2','B2.3','B2.4','B2.5','B2.6',
];

// Blocks that receive eventos_cruzados when present
const BLOQUES_CON_EVENTOS = new Set(['B12', 'B2.5', 'B2.6']);

// ── Prompt loaders ────────────────────────────────────────────────────────────
function loadCapaA() {
  const raw = fs.readFileSync(path.join(PROMPTS_DIR, '00_CORE.md'), 'utf8');
  const cut = raw.indexOf('## CAPA B');
  return (cut !== -1 ? raw.slice(0, cut) : raw).trim();
}

// Returns { B1: "Regel Ha'Tzura — Lo interno se refleja...", ... }
function buildZoharIndex() {
  const raw = fs.readFileSync(path.join(PROMPTS_DIR, '01_ZOHAR.md'), 'utf8');
  const index = {};
  for (const line of raw.split('\n')) {
    if (!line.startsWith('| B')) continue;
    const cells = line.split('|').map(c => c.trim()).filter(Boolean);
    if (cells.length < 3) continue;
    const m = cells[0].match(/^(B[\d.]+)/);
    if (m) index[m[1]] = `${cells[1]} — ${cells[2]}`;
  }
  return index;
}

// Returns { aries: "impulso que sirve...", acuario: "disciplina que brilla...", ... }
function buildKabbalahIndex() {
  const raw = fs.readFileSync(path.join(PROMPTS_DIR, '02_KABBALAH.md'), 'utf8');
  const index = {};
  for (const line of raw.split('\n')) {
    if (!line.startsWith('|')) continue;
    const cells = line.split('|').map(c => c.trim()).filter(Boolean);
    if (cells.length < 6 || cells[0].startsWith('-') || cells[0] === 'Signo') continue;
    index[cells[0].toLowerCase()] = cells[5]; // Traducción operativa
  }
  return index;
}

// ── Module-level initialisation (reused across warm starts) ──────────────────
const CAPA_A  = loadCapaA();
const ZOHAR   = buildZoharIndex();
const KABBALAH = buildKabbalahIndex();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: { 'anthropic-beta': 'prompt-caching-2024-07-31' },
});

// ── Utilities ─────────────────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

function buildUserMessage(codigo, cliente, dataset) {
  const signoSolar = dataset.resumen?.signo_solar ?? '';
  const zoharRow   = ZOHAR[codigo] ?? '';
  const kabbRow    = KABBALAH[signoSolar.toLowerCase()] ?? '';

  let msg =
    `Cliente: ${cliente.nombre}${cliente.edad ? `, ${cliente.edad} años` : ''}.` +
    `\nContexto declarado: ${cliente.contexto ?? ''}` +
    `\n\nDataset:\n${JSON.stringify(dataset, null, 2)}` +
    `\n\nPrincipio activo (Zohar): ${zoharRow}` +
    `\nTraducción kabbalística (signo solar — ${signoSolar}): ${kabbRow}`;

  if (BLOQUES_CON_EVENTOS.has(codigo) && cliente.eventos_cruzados?.length) {
    msg += `\n\nEventos cruzados:\n${JSON.stringify(cliente.eventos_cruzados, null, 2)}`;
  }

  msg += `\n\nDesarrolla ${codigo}: ${BLOQUES_META[codigo]}`;
  return msg;
}

// ── Single block call — up to 3 attempts, 3s between retries ─────────────────
async function callBloque(codigo, cliente, dataset) {
  const userContent = buildUserMessage(codigo, cliente, dataset);
  let lastError;

  for (let attempt = 1; attempt <= 3; attempt++) {
    if (attempt > 1) await sleep(3000);
    try {
      const res = await anthropic.messages.create({
        model:      'claude-opus-4-5',
        max_tokens: 1500,
        temperature: 0,
        system: [{
          type: 'text',
          text: CAPA_A,
          cache_control: { type: 'ephemeral' },
        }],
        messages: [{ role: 'user', content: userContent }],
      });
      return {
        bloque:   codigo,
        nombre:   BLOQUES_META[codigo],
        contenido: res.content[0]?.text ?? '',
        error:    false,
      };
    } catch (err) {
      lastError = err;
    }
  }

  return {
    bloque:   codigo,
    nombre:   BLOQUES_META[codigo],
    contenido: '[ERROR]',
    error:    true,
    _err:     lastError?.message,
  };
}

// ── Netlify Function handler ──────────────────────────────────────────────────
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { id_pedido, plan, cliente, dataset } = body;
  if (!id_pedido || !plan || !cliente || !dataset) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Required fields: id_pedido, plan, cliente, dataset' }),
    };
  }

  const secuencia = plan === '$111' ? SECUENCIA_111 : SECUENCIA_55;
  const resultados = [];
  const fallidos   = [];

  for (const codigo of secuencia) {
    const resultado = await callBloque(codigo, cliente, dataset);
    resultados.push(resultado);
    if (resultado.error) fallidos.push(codigo);
  }

  fs.writeFileSync(
    `/tmp/${id_pedido}_bloques.json`,
    JSON.stringify(resultados, null, 2),
    'utf8',
  );

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id_pedido,
      bloques:  resultados,
      fallidos,
      total:    resultados.length,
      errores:  fallidos.length,
    }),
  };
};
