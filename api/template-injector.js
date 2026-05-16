/**
 * template-injector.js
 * IM Consulting — Template Variable Injector
 * 
 * Inyecta variables en template HTML
 */

const fs = require('fs');
const path = require('path');

class TemplateInjector {
  constructor(templatePath = null, templateHTML = null) {
    if (templateHTML) {
      // Si se proporciona HTML directo, usarlo
      this.template = templateHTML;
      console.log('✅ Template incrustado cargado');
    } else if (templatePath) {
      // Si se proporciona ruta, leer archivo
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

    // 1. REEMPLAZAR VARIABLES SIMPLES
    console.log('   • Inyectando cliente...');
    html = this._replaceVariables(html, 'cliente', dataset.cliente);

    console.log('   • Inyectando astrología...');
    html = this._replaceVariables(html, 'astro', dataset.astro);

    console.log('   • Inyectando numerología...');
    html = this._replaceVariables(html, 'numerologia', dataset.numerologia);

    console.log('   • Inyectando matriz...');
    html = this._replaceVariables(html, 'matriz', dataset.matriz);

    // 2. REEMPLAZAR CONDICIONALES
    console.log('   • Procesando condicionales...');
    const mostrar_parte_ii = plan === 'completo';
    html = html.replace(/\{\{#if mostrar_parte_ii\}\}([\s\S]*?)\{\{\/if\}\}/g, 
      mostrar_parte_ii ? '$1' : '');
    html = html.replace(/\{\{mostrar_parte_ii\}\}/g, mostrar_parte_ii ? 'true' : 'false');

    // 3. REEMPLAZAR BLOQUES (simulado — en producción vendrían de Claude)
    console.log('   • Inyectando bloques...');
    const bloques_parte_i = this._generarBloquesMock(plan === 'completo' ? 14 : 14);
    const bloques_parte_ii = plan === 'completo' ? this._generarBloquesMock(6) : '';
    
    html = html.replace(/\{\{\{bloques_parte_i\}\}\}/g, bloques_parte_i);
    html = html.replace(/\{\{\{bloques_parte_ii\}\}\}/g, bloques_parte_ii);

    // 4. LIMPIAR VARIABLES SIN REEMPLAZAR
    html = html.replace(/\{\{[^}]+\}\}/g, '');

    console.log(`✅ [TEMPLATE INJECTOR] Inyección exitosa para ${dataset.cliente.nombre} (${plan})`);
    return html;
  }

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
      'Perfil Esencial',
      'Tu Propósito',
      'Fortalezas Centrales',
      'Retos de Crecimiento',
      'Relaciones',
      'Creatividad',
      'Amor',
      'Dinero',
      'Salud',
      'Espiritualidad',
      'Talentos Ocultos',
      'Tu Legado',
      'Ciclos de Vida',
      'Próximo Paso'
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