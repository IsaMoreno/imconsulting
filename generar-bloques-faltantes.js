'use strict';
require('dotenv').config();
const fs        = require('fs');
const path      = require('path');
const Anthropic = require('@anthropic-ai/sdk');

const anthropic    = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const PROMPTS_DIR  = path.join(__dirname, 'prompts');
const BLOQUES_JSON = path.join(__dirname, 'tmp', 'priscilla_bloques.json');
const DATASET_JSON = path.join(__dirname, 'tmp', 'priscilla_dataset.json');

const BLOQUES_FALTANTES = ['B7', 'B9', 'B2.2', 'B2.4', 'B2.5', 'B2.6'];

const BLOQUES_META = {
  B7:    'Amor y Vínculos',
  B9:    'Dinero',
  'B2.2':'Ruptura de Patrones',
  'B2.4':'Trascender Patrones',
  'B2.5':'Estrategia de Vida',
  'B2.6':'Plan de Acción',
};

const BLOQUES_CON_EVENTOS = new Set(['B2.5', 'B2.6']);

function loadPrompt(filename) {
  try { return fs.readFileSync(path.join(PROMPTS_DIR, filename), 'utf8'); }
  catch { return ''; }
}

function loadCapaA() {
  const core = loadPrompt('00_CORE.md');
  return core.split('## CAPA B')[0];
}

const CAPA_A     = loadCapaA();
const ZOHAR_DATA = loadPrompt('01_ZOHAR.md');
const KABB_DATA  = loadPrompt('02_KABBALAH.md');

// Rows look like: | B7 · Amor y Vínculos | Principio | Función |
function extractZoharRow(bloque) {
  const lines = ZOHAR_DATA.split('\n');
  for (const line of lines) {
    if (!line.startsWith('|')) continue;
    const cells = line.split('|').map(c => c.trim()).filter(c => c.length > 0);
    if (cells[0] && (
      cells[0] === bloque ||
      cells[0].startsWith(bloque + ' ') ||
      cells[0].startsWith(bloque + String.fromCharCode(194, 183))  // ·
    )) {
      return cells[1] || '(sin principio)';
    }
  }
  return '(Zohar: no encontrado para ' + bloque + ')';
}

function extractKabbRow(signo) {
  const lines = KABB_DATA.split('\n');
  for (const line of lines) {
    if (!line.startsWith('|')) continue;
    const cells = line.split('|').map(c => c.trim()).filter(c => c.length > 0);
    if (cells[0] && cells[0].toLowerCase() === signo.toLowerCase()) {
      return cells[1] || '(sin traducción)';
    }
  }
  return '(Kabbalah: no encontrado para ' + signo + ')';
}

function buildUserMessage(codigo, cliente, dataset) {
  const signoSolar = dataset.signo_solar ||
    (dataset.astro && dataset.astro.planets && dataset.astro.planets.sun
      ? dataset.astro.planets.sun.sign : 'Escorpio');
  const zoharRow = extractZoharRow(codigo);
  const kabbRow  = extractKabbRow(signoSolar);

  let msg =
    'Cliente: ' + cliente.nombre + '\n' +
    '\n\nDataset:\n' + JSON.stringify(dataset, null, 2) +
    '\n\nPrincipio activo (Zohar): ' + zoharRow +
    '\n\nTraducción kabbalística (signo solar — ' + signoSolar + '): ' + kabbRow;

  if (BLOQUES_CON_EVENTOS.has(codigo) && cliente.eventos_cruzados && cliente.eventos_cruzados.length) {
    msg += '\n\nEventos cruzados:\n' + JSON.stringify(cliente.eventos_cruzados, null, 2);
  }

  msg += '\n\nDesarrolla ' + codigo + ': ' + BLOQUES_META[codigo];
  return msg;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function generarBloque(codigo, cliente, dataset) {
  console.log('\n⏳ Generando ' + codigo + ': ' + BLOQUES_META[codigo] + '...');
  const userContent = buildUserMessage(codigo, cliente, dataset);

  for (let attempt = 1; attempt <= 3; attempt++) {
    if (attempt > 1) await sleep(3000);
    try {
      const res = await anthropic.messages.create({
        model:       'claude-sonnet-4-6',
        max_tokens:  1000,
        temperature: 0,
        system: [{ type: 'text', text: CAPA_A, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: userContent }],
      });
      const contenido = res.content[0] && res.content[0].text ? res.content[0].text : '';
      const tokens    = res.usage.input_tokens + res.usage.output_tokens;
      console.log('✅ ' + codigo + ' generado (' + tokens + ' tokens)');
      return { bloque: codigo, nombre: BLOQUES_META[codigo], contenido, error: false, tokens };
    } catch (err) {
      console.log('❌ Intento ' + attempt + '/3 falló: ' + err.message);
      if (attempt === 3) return { bloque: codigo, nombre: BLOQUES_META[codigo], contenido: '[ERROR]', error: true };
    }
  }
}

async function main() {
  const dataset = JSON.parse(fs.readFileSync(DATASET_JSON, 'utf8'));
  const cliente = dataset.cliente;

  const existing  = JSON.parse(fs.readFileSync(BLOQUES_JSON, 'utf8'));
  const yaExisten = new Set(existing.bloques.map(b => b.bloque));

  const pendientes = BLOQUES_FALTANTES.filter(b => !yaExisten.has(b));
  console.log('\n🚀 Bloques a generar: ' + pendientes.join(', '));

  if (pendientes.length === 0) {
    console.log('✅ Todos los bloques ya existen.');
    return;
  }

  // Smoke test extracción
  console.log('Test Zohar B7:', extractZoharRow('B7'));
  console.log('Test Zohar B2.2:', extractZoharRow('B2.2'));
  console.log('Test Kabb Escorpio:', extractKabbRow('Escorpio'));

  for (const codigo of pendientes) {
    const resultado = await generarBloque(codigo, cliente, dataset);
    existing.bloques.push(resultado);
    if (resultado.error) existing.fallidos.push(codigo);
    existing.total   = existing.bloques.length;
    existing.errores = existing.fallidos.length;
    fs.writeFileSync(BLOQUES_JSON, JSON.stringify(existing, null, 2), 'utf8');
    console.log('💾 Guardado (' + existing.total + ' bloques totales)');
    await sleep(1000);
  }

  console.log('\n🎉 Completado. Bloques totales: ' + existing.total);
  console.log('Bloques: ' + existing.bloques.map(b => b.bloque).join(', '));
}

main().catch(err => { console.error(err); process.exit(1); });
