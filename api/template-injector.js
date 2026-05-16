/**
 * TemplateInjector.js
 * IM Consulting — Template Variable Injection Engine
 * 
 * Responsabilidades:
 * 1. Leer /templates/reporte-maestro-2026.html
 * 2. Reemplazar todos los {{placeholders}} con datos reales
 * 3. Manejar condicionales por plan (Esencial vs Completo)
 * 4. Retornar HTML completo listo para conversión a PDF
 * 
 * Uso:
 *   const TI = require('./api/template-injector.js');
 *   const injector = new TI('./templates/reporte-maestro-2026.html');
 *   const html = injector.render(dataset, { plan: 'completo' });
 */

const fs = require('fs');
const path = require('path');

class TemplateInjector {
  constructor(templatePath) {
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template no encontrado: ${templatePath}`);
    }
    this.templatePath = templatePath;
    this.template = fs.readFileSync(templatePath, 'utf8');
  }

  /**
   * Render — Inyecta datos en template
   * @param {Object} dataset - Datos completos del cliente (astrología, numerología, etc)
   * @param {Object} options - { plan: 'esencial' | 'completo', includePartII: true/false }
   * @returns {string} HTML completo con variables reemplazadas
   */
  render(dataset, options = {}) {
    const plan = options.plan || 'esencial';
    const includePartII = options.includePartII === undefined ? (plan === 'completo') : options.includePartII;

    let html = this.template;

    // Validar que dataset tiene estructura mínima
    this._validateDataset(dataset);

    // BLOQUE 1: CLIENTE
    html = this._injectClient(html, dataset.cliente);

    // BLOQUE 2: ASTROLOGÍA
    html = this._injectAstrology(html, dataset.astro);

    // BLOQUE 3: NUMEROLOGÍA
    html = this._injectNumerology(html, dataset.numerologia);

    // BLOQUE 4: MATRIZ DEL DESTINO
    html = this._injectMatriz(html, dataset.matriz);

    // BLOQUE 5: ÍNDICE DINÁMICO (diferente por plan)
    html = this._injectIndice(html, plan);

    // BLOQUE 6: CONDICIONALES (Parte II, sesión 1:1, etc)
    html = this._injectConditionals(html, plan, includePartII);

    // BLOQUE 7: BLOQUES DE CONTENIDO (si existen)
    if (dataset.bloques_html) {
      html = this._injectBloques(html, dataset.bloques_html, plan);
    }

    // Log de inyección exitosa
    console.log(`✅ [TEMPLATE INJECTOR] Inyección exitosa para ${dataset.cliente.nombre} (${plan})`);

    return html;
  }

  /**
   * _validateDataset — Valida que dataset tenga estructura mínima
   */
  _validateDataset(dataset) {
    const required = ['cliente', 'astro', 'numerologia', 'matriz'];
    for (const field of required) {
      if (!dataset[field]) {
        throw new Error(`Dataset falta campo requerido: ${field}`);
      }
    }
  }

  /**
   * _injectClient — Inyecta datos de cliente
   * Variables: {{cliente.nombre}}, {{cliente.edad}}, {{cliente.ciudad}}, {{cliente.pais}}, {{cliente.email}}
   */
  _injectClient(html, cliente) {
    html = html.replace(/{{cliente\.nombre}}/g, this._escape(cliente.nombre || 'Cliente'));
    html = html.replace(/{{cliente\.edad}}/g, cliente.edad || '');
    html = html.replace(/{{cliente\.ciudad}}/g, this._escape(cliente.ciudad || ''));
    html = html.replace(/{{cliente\.pais}}/g, this._escape(cliente.pais || ''));
    html = html.replace(/{{cliente\.email}}/g, this._escape(cliente.email || ''));
    return html;
  }

  /**
   * _injectAstrology — Inyecta datos astrológicos
   * Variables: {{astro.sol_signo}}, {{astro.sol_grados}}, {{astro.asc_signo}}, etc
   */
  _injectAstrology(html, astro) {
    // Firma astrológica esencial
    html = html.replace(/{{astro\.sol_signo}}/g, this._escape(astro.sol_signo || ''));
    html = html.replace(/{{astro\.sol_grados}}/g, this._formatGrados(astro.sol_grados));
    html = html.replace(/{{astro\.asc_signo}}/g, this._escape(astro.asc_signo || ''));
    html = html.replace(/{{astro\.asc_grados}}/g, this._formatGrados(astro.asc_grados));
    html = html.replace(/{{astro\.mc_signo}}/g, this._escape(astro.mc_signo || ''));
    html = html.replace(/{{astro\.mc_grados}}/g, this._formatGrados(astro.mc_grados));

    // Planetas individuales (Luna, Mercurio, Venus, Marte, Júpiter, Saturno, Urano, Neptuno, Plutón)
    const planetas = ['luna', 'mercurio', 'venus', 'marte', 'jupiter', 'saturno', 'urano', 'neptuno', 'pluton'];
    for (const planeta of planetas) {
      if (astro[planeta]) {
        html = html.replace(new RegExp(`{{astro\\.${planeta}_signo}}`, 'g'), this._escape(astro[planeta].signo || ''));
        html = html.replace(new RegExp(`{{astro\\.${planeta}_grados}}`, 'g'), this._formatGrados(astro[planeta].grados));
        html = html.replace(new RegExp(`{{astro\\.${planeta}_casa}}`, 'g'), astro[planeta].casa || '');
      }
    }

    // Balance elemental y modalidades
    if (astro.balance_elemental) {
      html = html.replace(/{{astro\.balance_elemental}}/g, this._formatBalance(astro.balance_elemental));
    }

    return html;
  }

  /**
   * _injectNumerology — Inyecta datos numerológicos
   * Variables: {{numerologia.camino_vida}}, {{numerologia.numero_expresion}}, etc
   */
  _injectNumerology(html, numerologia) {
    html = html.replace(/{{numerologia\.camino_vida}}/g, numerologia.camino_vida || '');
    html = html.replace(/{{numerologia\.numero_expresion}}/g, numerologia.numero_expresion || '');
    html = html.replace(/{{numerologia\.numero_alma}}/g, numerologia.numero_alma || '');
    html = html.replace(/{{numerologia\.numero_personalidad}}/g, numerologia.numero_personalidad || '');

    // Interpretaciones (si existen)
    if (numerologia.camino_vida_descripcion) {
      html = html.replace(/{{numerologia\.camino_vida_descripcion}}/g, this._escape(numerologia.camino_vida_descripcion));
    }

    return html;
  }

  /**
   * _injectMatriz — Inyecta datos de Matriz del Destino
   * Variables: {{matriz.arcano_activo_numero}}, {{matriz.arcano_activo_nombre}}, etc
   */
  _injectMatriz(html, matriz) {
    // Arcano activo actual
    html = html.replace(/{{matriz\.arcano_activo_numero}}/g, matriz.arcano_activo_numero || '');
    html = html.replace(/{{matriz\.arcano_activo_nombre}}/g, this._escape(matriz.arcano_activo_nombre || ''));

    // Próximos arcanos (cronología)
    if (matriz.cronologia) {
      for (let i = 1; i <= 5; i++) {
        if (matriz.cronologia[`año_${i}`]) {
          html = html.replace(
            new RegExp(`{{matriz\\.arcano_año_${i}_numero}}`, 'g'),
            matriz.cronologia[`año_${i}`].numero || ''
          );
          html = html.replace(
            new RegExp(`{{matriz\\.arcano_año_${i}_nombre}}`, 'g'),
            this._escape(matriz.cronologia[`año_${i}`].nombre || '')
          );
        }
      }
    }

    // Puntos A, B, C, D, E
    ['A', 'B', 'C', 'D', 'E'].forEach(punto => {
      if (matriz[`punto_${punto}`]) {
        html = html.replace(
          new RegExp(`{{matriz\\.punto_${punto}_numero}}`, 'g'),
          matriz[`punto_${punto}`].numero || ''
        );
        html = html.replace(
          new RegExp(`{{matriz\\.punto_${punto}_nombre}}`, 'g'),
          this._escape(matriz[`punto_${punto}`].nombre || '')
        );
      }
    });

    return html;
  }

  /**
   * _injectIndice — Inyecta índice dinámico (diferente por plan)
   * Plan Esencial (14 bloques): B1, B2, B3, B4, B5, B6, B8, B10, B11, B12, B13, B14, B2.1, B2.3
   * Plan Completo (20 bloques): B1-B14 + B2.1-B2.6
   */
  _injectIndice(html, plan) {
    let bloques = [];

    const BLOQUE_TITLES = {
      'B1': 'Perfil Esencial',
      'B2': 'Tu Ser en Contexto',
      'B3': 'Arquetipos y Patrones',
      'B4': 'Desafíos y Oportunidades',
      'B5': 'Tu Misión',
      'B6': 'Ciclos y Ritmos',
      'B7': 'Amor y Relaciones',
      'B8': 'Comunicación y Creatividad',
      'B9': 'Abundancia y Recursos',
      'B10': 'Salud y Vitalidad',
      'B11': 'Legado y Trascendencia',
      'B12': 'Transformación desde Eventos',
      'B13': 'Próximos Pasos',
      'B14': 'Tu Pregunta de Poder',
      'B2.1': 'Transformación: Esencia',
      'B2.2': 'Transformación: Ser',
      'B2.3': 'Transformación: Hacer',
      'B2.4': 'Transformación: Ciclos',
      'B2.5': 'Transformación: Eventos',
      'B2.6': 'Transformación: Integración'
    };

    if (plan === 'esencial') {
      bloques = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B8', 'B10', 'B11', 'B12', 'B13', 'B14', 'B2.1', 'B2.3'];
    } else {
      bloques = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10', 'B11', 'B12', 'B13', 'B14', 'B2.1', 'B2.2', 'B2.3', 'B2.4', 'B2.5', 'B2.6'];
    }

    const indiceHTML = bloques
      .map((b, idx) => `<li><a href="#bloque-${b}">${idx + 1}. ${BLOQUE_TITLES[b] || b}</a></li>`)
      .join('\n');

    html = html.replace(/{{indice}}/g, indiceHTML);

    return html;
  }

  /**
   * _injectConditionals — Inyecta contenido condicional por plan
   * Maneja: {{#if plan === 'completo'}} ... {{/if}}
   * Y: {{mostrar_parte_ii}}, {{sesion_1_1}}, etc
   */
  _injectConditionals(html, plan, includePartII) {
    // Mostrar Parte II (solo para plan completo)
    if (includePartII) {
      html = html.replace(/{{mostrar_parte_ii}}/g, 'true');
      html = html.replace(/<section id="parte-ii" style="display: none;">/g, '<section id="parte-ii" style="display: block;">');
    } else {
      html = html.replace(/{{mostrar_parte_ii}}/g, 'false');
      html = html.replace(/<section id="parte-ii" style="display: block;">/g, '<section id="parte-ii" style="display: none;">');
    }

    // Sesión 1:1 (solo para plan completo)
    if (plan === 'completo') {
      const sesion1a1HTML = `
        <div class="sesion-1-1" style="margin-top: 30px; padding: 20px; background: #F5F5F5; border-left: 3px solid #C8B89A;">
          <h3>Tu Sesión de Activación</h3>
          <p>Como parte de tu plan completo, tienes derecho a una sesión privada de 1 hora para profundizar en los temas de este reporte.</p>
          <p><strong>Agendar aquí:</strong> <a href="https://calendly.com/isaac/sesion">Calendly — Isaac Moreno</a></p>
        </div>
      `;
      html = html.replace(/{{sesion_1_1}}/g, sesion1a1HTML);
    } else {
      html = html.replace(/{{sesion_1_1}}/g, '');
    }

    return html;
  }

  /**
   * _injectBloques — Inyecta bloques de contenido generados (B1-B14, B2.1-B2.6)
   * Formato esperado en dataset.bloques_html:
   *   { B1: "contenido HTML del bloque 1", B2: "...", ... }
   */
  _injectBloques(html, bloquesHTML, plan) {
    let bloquesFiltrados = {};

    if (plan === 'esencial') {
      const bsESENCIAL = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B8', 'B10', 'B11', 'B12', 'B13', 'B14', 'B2.1', 'B2.3'];
      for (const b of bsESENCIAL) {
        if (bloquesHTML[b]) bloquesFiltrados[b] = bloquesHTML[b];
      }
    } else {
      bloquesFiltrados = bloquesHTML;
    }

    // Inyectar cada bloque en su placeholder
    for (const [bloqueKey, bloqueContent] of Object.entries(bloquesFiltrados)) {
      html = html.replace(
        new RegExp(`{{bloque_${bloqueKey}}}`, 'g'),
        this._escape(bloqueContent)
      );
    }

    // Remover placeholders vacíos
    html = html.replace(/{{bloque_\w+\.\d+}}/g, '');
    html = html.replace(/{{bloque_[A-Z0-9.]+}}/g, '');

    return html;
  }

  /**
   * Utilidades privadas
   */

  _escape(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  _formatGrados(grados) {
    if (!grados && grados !== 0) return '';
    return `${Number(grados).toFixed(1)}°`;
  }

  _formatBalance(balance) {
    if (!balance) return '';
    return Object.entries(balance)
      .map(([element, percent]) => `${element}: ${Number(percent).toFixed(1)}%`)
      .join(' | ');
  }

  /**
   * Método auxiliar: obtener valor por ruta (ej: "cliente.nombre")
   * Útil para inyecciones más dinámicas
   */
  getValueByPath(obj, path) {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  }
}

module.exports = TemplateInjector;
