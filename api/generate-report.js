'use strict';
const fs         = require('fs');
const path       = require('path');
const Anthropic  = require('@anthropic-ai/sdk');

// ── Importar módulos de optimización ──────────────────────────────────────────
const { auditarBloque }        = require('./audit-bloque');
const { obtenerDelCaché, guardarEnCaché } = require('./cache-bloques');
const { registrarConsumo }     = require('./track-tokens');

// ── Paths ─────────────────────────────────────────────────────────────────────
const PROMPTS_DIR = path.join(__dirname, '..', 'prompts');

// ── Anthropic client ──────────────────────────────────────────────────────────
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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

const BLOQUES_CON_EVENTOS = new Set(['B12', 'B2.5', 'B2.6']);

// ── Prompt loaders ────────────────────────────────────────────────────────────
function loadCapaA() {
  try {
    return fs.readFileSync(
      path.join(PROMPTS_DIR, '00_CORE.md'),
      'utf8',
    ).split('## CAPA B')[0];
  } catch {
    return 'Default system prompt (Capa A not found)';
  }
}

function loadZohar() {
  try {
    return fs.readFileSync(
      path.join(PROMPTS_DIR, '01_ZOHAR.md'),
      'utf8',
    );
  } catch {
    return '';
  }
}

function loadKabbalah() {
  try {
    return fs.readFileSync(
      path.join(PROMPTS_DIR, '02_KABBALAH.md'),
      'utf8',
    );
  } catch {
    return '';
  }
}

const CAPA_A      = loadCapaA();
const ZOHAR_DATA  = loadZohar();
const KABBAH_DATA = loadKabbalah();

// ── Helpers ───────────────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function extractZoharRow(bloque) {
  const regex = new RegExp(`^\\|\\s*${bloque}\\s*\\|(.+?)\\|`, 'm');
  const match = ZOHAR_DATA.match(regex);
  return match ? match[1].trim() : '(Zohar row not found)';
}

function extractKabbRow(signo) {
  const regex = new RegExp(`^\\|\\s*${signo}\\s*\\|(.+?)\\|`, 'm');
  const match = KABBAH_DATA.match(regex);
  return match ? match[1].trim() : '(Kabbalah row not found)';
}

// ── Build user message for Claude ─────────────────────────────────────────────
function buildUserMessage(codigo, cliente, dataset) {
  const signoSolar = dataset.signo_solar || 'Desconocido';
  const zoharRow   = extractZoharRow(codigo);
  const kabbRow    = extractKabbRow(signoSolar);

  let msg =
    `Cliente: ${cliente.nombre}\n` +
    `\n\nDataset:\n${JSON.stringify(dataset, null, 2)}` +
    `\n\nPrincipio activo (Zohar): ${zoharRow}` +
    `\n\nTraducción kabbalística (signo solar — ${signoSolar}): ${kabbRow}`;

  if (BLOQUES_CON_EVENTOS.has(codigo) && cliente.eventos_cruzados?.length) {
    msg += `\n\nEventos cruzados:\n${JSON.stringify(cliente.eventos_cruzados, null, 2)}`;
  }

  msg += `\n\nDesarrolla ${codigo}: ${BLOQUES_META[codigo]}`;
  return msg;
}

// ── Single block call — con optimización: caché + auditoría + tracking ────────
async function callBloque(codigo, cliente, dataset) {
  // 1. INTENTAR CACHÉ
  const delCaché = obtenerDelCaché(codigo, dataset.signo_solar, dataset.edad);
  if (delCaché) {
    console.log(`✅ CACHE HIT: ${codigo}`);
    return {
      bloque:    codigo,
      nombre:    BLOQUES_META[codigo],
      contenido: delCaché.contenido,
      error:     false,
      fromCache: true,
    };
  }

  // 2. GENERAR CON CLAUDE
  const userContent = buildUserMessage(codigo, cliente, dataset);
  let lastError;
  let respuestaFinal = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    if (attempt > 1) await sleep(3000);

    try {
      const res = await anthropic.messages.create({
        model:       'claude-sonnet-4-6',
        max_tokens:  1000,
        temperature: 0,
        system: [{
          type: 'text',
          text: CAPA_A,
          cache_control: { type: 'ephemeral' },
        }],
        messages: [{ role: 'user', content: userContent }],
      });

      respuestaFinal = res.content[0]?.text ?? '';
      const tokensUsados = res.usage.input_tokens + res.usage.output_tokens;

      // 3. AUDITAR BLOQUE
      const auditoria = auditarBloque(respuestaFinal, codigo);

      if (auditoria.passed) {
        console.log(`✅ ${codigo} pasó auditoría`);
        
        // 4. GUARDAR EN CACHÉ
        guardarEnCaché(codigo, dataset.signo_solar, dataset.edad, respuestaFinal);

        // 5. REGISTRAR CONSUMO DE TOKENS
        const costo = (tokensUsados / 1000000) * 3; // Sonnet: $3 per million tokens
        registrarConsumo(`${cliente.nombre}_${codigo}`, cliente.plan, tokensUsados, costo, 'sonnet');

        return {
          bloque:    codigo,
          nombre:    BLOQUES_META[codigo],
          contenido: respuestaFinal,
          error:     false,
          tokens:    tokensUsados,
          costo:     costo.toFixed(4),
        };
      } else {
        console.log(`⚠️  ${codigo} falló auditoría:`);
        auditoria.failures.forEach(f => console.log(`   ${f}`));
        
        // Si es último intento y falla, igual lo guardamos
        if (attempt === 3) {
          console.log(`   📌 Guardando de todas formas (último intento)`);
          guardarEnCaché(codigo, dataset.signo_solar, dataset.edad, respuestaFinal);
          
          const costo = (tokensUsados / 1000000) * 3;
          registrarConsumo(`${cliente.nombre}_${codigo}`, cliente.plan, tokensUsados, costo, 'sonnet');

          return {
            bloque:    codigo,
            nombre:    BLOQUES_META[codigo],
            contenido: respuestaFinal,
            error:     false,
            tokens:    tokensUsados,
            costo:     costo.toFixed(4),
            auditFailed: true,
          };
        }
      }
    } catch (err) {
      lastError = err;
      console.log(`❌ Intento ${attempt}/3 falló: ${err.message}`);
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

  console.log(`\n🚀 Iniciando generación: ${id_pedido} (Plan: ${plan})`);
  console.log(`📝 Bloques a generar: ${secuencia.length}`);

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

  console.log(`\n✅ Generación completada: ${resultados.length}/${secuencia.length} bloques`);
  if (fallidos.length > 0) {
    console.log(`⚠️  Bloques con error: ${fallidos.join(', ')}`);
  }

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
