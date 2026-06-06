/**
 * template-injector.js
 * IM Consulting — Template Variable Injector
 *
 * Inyecta variables en template HTML
 */

const fs = require('fs');
const path = require('path');

const HOUSE_TO_ROMAN = {
  'First':    'I',   'Second':  'II',  'Third':   'III',
  'Fourth':   'IV',  'Fifth':   'V',   'Sixth':   'VI',
  'Seventh':  'VII', 'Eighth':  'VIII','Ninth':   'IX',
  'Tenth':    'X',   'Eleventh':'XI',  'Twelfth': 'XII'
};

function houseToRoman(house) {
  if (!house) return '';
  const key = house.replace(/_House$/i, '').trim();
  return HOUSE_TO_ROMAN[key] || key;
}

class TemplateInjector {
  constructor(templatePath = null, templateHTML = null) {
    if (templateHTML) {
      this.template = templateHTML;
      console.log('✅ Template incrustado cargado');
    } else if (templatePath) {
      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template no encontrado: ${templatePath}`);
      }
      this.template = fs.readFileSync(templatePath, 'utf8');
      console.log('✅ Template archivo cargado');
    } else {
      throw new Error('Debe proporcionar templatePath o templateHTML');
    }
  }

  render(dataset, options = {}) {
    console.log(`\n🔄 Renderizando template para ${dataset.cliente.nombre}...`);

    let html = this.template;
    const plan = options.plan || 'esencial';

    console.log('   • Inyectando cliente...');
    html = this._replaceVariables(html, 'cliente', dataset.cliente);

    console.log('   • Inyectando astrología...');
    html = this._injectAstrology(html, dataset.astro);

    console.log('   • Inyectando numerología...');
    html = this._replaceVariables(html, 'numerologia', dataset.numerologia);

    console.log('   • Inyectando matriz...');
    html = this._injectMatriz(html, dataset.matriz);

    console.log('   • Procesando condicionales...');
    const mostrar_parte_ii = plan === 'completo';
    html = html.replace(/\{\{#if mostrar_parte_ii\}\}([\s\S]*?)\{\{\/if\}\}/g,
      mostrar_parte_ii ? '$1' : '');
    html = html.replace(/\{\{mostrar_parte_ii\}\}/g, mostrar_parte_ii ? 'true' : 'false');

    console.log('   • Inyectando bloques...');
    const bloques_parte_i  = this._generarBloquesMock(14);
    const bloques_parte_ii = plan === 'completo' ? this._generarBloquesMock(6) : '';
    html = html.replace(/\{\{\{bloques_parte_i\}\}\}/g,  bloques_parte_i);
    html = html.replace(/\{\{\{bloques_parte_ii\}\}\}/g, bloques_parte_ii);

    html = html.replace(/\{\{[^}]+\}\}/g, '');

    console.log(`✅ [TEMPLATE INJECTOR] Inyección exitosa para ${dataset.cliente.nombre} (${plan})`);
    return html;
  }

  // ── Astrología ─────────────────────────────────────────────────────────────
  _injectAstrology(html, astro) {
    if (!astro) return html;

    const planets = astro.planets || {};
    const asc     = astro.ascendant || {};
    const mc      = astro.midheaven || {};

    // Mapeo inglés → español para planetas
    const planetMap = {
      sol:      planets.sun,
      luna:     planets.moon,
      mercurio: planets.mercury,
      venus:    planets.venus,
      marte:    planets.mars,
      jupiter:  planets.jupiter,
      saturno:  planets.saturn,
      urano:    planets.uranus,
      neptuno:  planets.neptune,
      pluton:   planets.pluto,
    };

    for (const [slug, data] of Object.entries(planetMap)) {
      if (!data) continue;
      const signo  = data.sign    || data.signo  || '';
      const grados = data.degrees ?? data.grados ?? '';
      const casa   = houseToRoman(data.house || data.casa || '');
      html = html.replace(new RegExp(`\\{\\{astro\\.${slug}_signo\\}\\}`,  'g'), signo);
      html = html.replace(new RegExp(`\\{\\{astro\\.${slug}_grados\\}\\}`, 'g'), String(grados));
      html = html.replace(new RegExp(`\\{\\{astro\\.${slug}_casa\\}\\}`,   'g'), casa);
    }

    // Ascendente y Medio Cielo
    html = html.replace(/\{\{astro\.asc_signo\}\}/g,  asc.sign    || '');
    html = html.replace(/\{\{astro\.asc_grados\}\}/g, String(asc.degrees ?? ''));
    html = html.replace(/\{\{astro\.mc_signo\}\}/g,   mc.sign     || '');
    html = html.replace(/\{\{astro\.mc_grados\}\}/g,  String(mc.degrees ?? ''));

    // Balance elemental: computar desde signos de planetas
    const FIRE  = ['Aries','Leo','Sagitario','Sagittarius'];
    const EARTH = ['Tauro','Virgo','Capricornio','Taurus','Capricorn'];
    const AIR   = ['Géminis','Libra','Acuario','Gemini','Aquarius'];
    const WATER = ['Cáncer','Escorpio','Piscis','Cancer','Scorpio','Pisces'];

    const bal = { fuego: 0, tierra: 0, aire: 0, agua: 0 };
    for (const data of Object.values(planetMap)) {
      const s = data?.sign || data?.signo || '';
      if (FIRE.includes(s))  bal.fuego++;
      else if (EARTH.includes(s)) bal.tierra++;
      else if (AIR.includes(s))   bal.aire++;
      else if (WATER.includes(s)) bal.agua++;
    }

    html = html.replace(/\{\{astro\.balance_fuego\}\}/g,  String(bal.fuego));
    html = html.replace(/\{\{astro\.balance_tierra\}\}/g, String(bal.tierra));
    html = html.replace(/\{\{astro\.balance_aire\}\}/g,   String(bal.aire));
    html = html.replace(/\{\{astro\.balance_agua\}\}/g,   String(bal.agua));

    return html;
  }

  // ── Matriz del Destino ─────────────────────────────────────────────────────
  _injectMatriz(html, matriz) {
    if (!matriz) return html;

    // Variables planas del objeto matriz
    html = this._replaceVariables(html, 'matriz', matriz);

    const core     = matriz.core     || {};
    const timeline = matriz.timeline || {};

    // Puntos A–E desde matriz.core.A, .B, .C, .D, .E (mayúsculas en dataset)
    for (const letra of ['A','B','C','D','E']) {
      const punto = core[letra] || {};
      const slug  = letra.toLowerCase();
      html = html.replace(
        new RegExp(`\\{\\{matriz\\.punto_${slug}\\}\\}`, 'g'),
        String(punto.n ?? '')
      );
      html = html.replace(
        new RegExp(`\\{\\{matriz\\.punto_${slug}_nombre\\}\\}`, 'g'),
        String(punto.nombre ?? '')
      );
    }

    // Arcano activo
    const act = matriz.arcano_activo || {};
    html = html.replace(/\{\{matriz\.arcano_activo_numero\}\}/g, String(act.arcano ?? ''));
    html = html.replace(/\{\{matriz\.arcano_activo_nombre\}\}/g,  String(act.nombre ?? ''));

    // Cronología: timeline keyed by year string
    const cronoMap = {
      'matriz.arcano_2027_nombre': timeline['2027'],
      'matriz.arcano_2028_nombre': timeline['2028'],
      'matriz.arcano_2029_nombre': timeline['2029'],
      'matriz.arcano_2030_nombre': timeline['2030'],
      'matriz.arcano_2031_nombre': timeline['2031'],
    };
    for (const [key, entry] of Object.entries(cronoMap)) {
      html = html.replace(
        new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
        String(entry?.nombre ?? '')
      );
    }

    return html;
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  _replaceVariables(html, prefix, obj) {
    if (!obj) return html;
    const flatObj = this._flattenObject(obj, prefix);
    for (const [key, value] of Object.entries(flatObj)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      html = html.replace(regex, value || '');
    }
    return html;
  }

  _flattenObject(obj, prefix = '') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (value === null || value === undefined) {
        result[fullKey] = '';
      } else if (typeof value === 'object') {
        Object.assign(result, this._flattenObject(value, fullKey));
      } else {
        result[fullKey] = String(value);
      }
    }
    return result;
  }

  _generarBloquesMock(count) {
    let bloques = '';
    const titulos = [
      'Perfil Esencial','Tu Propósito','Fortalezas Centrales',
      'Retos de Crecimiento','Relaciones','Creatividad','Amor',
      'Dinero','Salud','Espiritualidad','Talentos Ocultos',
      'Tu Legado','Ciclos de Vida','Próximo Paso'
    ];
    for (let i = 0; i < count && i < titulos.length; i++) {
      bloques += `
        <div class="bloque">
          <div class="bl-num">${String(i + 1).padStart(2, '0')}</div>
          <div class="bl-tit">${titulos[i]}</div>
          <div class="bl-body">
            Este es un bloque de contenido generado automáticamente.
            En producción, aquí iría el análisis completo generado por Claude API.
          </div>
          <div class="pregunta">¿Cómo puedo aplicar esto a mi vida hoy?</div>
        </div>
      `;
    }
    return bloques;
  }
}

module.exports = TemplateInjector;
