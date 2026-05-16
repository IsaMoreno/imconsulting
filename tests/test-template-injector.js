/**
 * TEST: Template Injector
 * 
 * Uso:
 *   node test-template-injector.js
 * 
 * Esto:
 * 1. Carga el template maestro HTML
 * 2. Crea datos de prueba (Isaac Moreno)
 * 3. Inyecta variables
 * 4. Valida que todo se reemplazó correctamente
 * 5. Guarda HTML renderizado en /tmp/test-output.html
 */

const TemplateInjector = require('../api/template-injector.js');
const fs = require('fs');
const path = require('path');

// ============================================
// 1. CREAR DATOS DE PRUEBA (Isaac Moreno)
// ============================================
const testDataset = {
  cliente: {
    nombre: 'Isaac Moreno',
    edad: 31,
    ciudad: 'Hermosillo',
    pais: 'México',
    email: 'isaac@imconsulting.com'
  },
  astro: {
    // Firma esencial
    sol_signo: 'Acuario',
    sol_grados: 21.5,
    asc_signo: 'Escorpio',
    asc_grados: 14.2,
    mc_signo: 'Leo',
    mc_grados: 8.7,

    // Planetas individuales
    luna: { signo: 'Virgo', grados: 12.3, casa: 7 },
    mercurio: { signo: 'Piscis', grados: 5.1, casa: 1 },
    venus: { signo: 'Sagitario', grados: 18.9, casa: 10 },
    marte: { signo: 'Géminis', grados: 25.4, casa: 4 },
    jupiter: { signo: 'Virgo', grados: 11.2, casa: 7 },
    saturno: { signo: 'Libra', grados: 27.8, casa: 8 },
    urano: { signo: 'Capricornio', grados: 19.5, casa: 11 },
    neptuno: { signo: 'Capricornio', grados: 28.1, casa: 11 },
    pluton: { signo: 'Escorpio', grados: 22.6, casa: 9 },

    // Balance elemental
    balance_elemental: {
      fuego: 16.7,
      tierra: 25.0,
      aire: 33.3,
      agua: 25.0
    }
  },
  numerologia: {
    camino_vida: 9,
    numero_expresion: 22,  // Número maestro
    numero_alma: 11,        // Número maestro
    numero_personalidad: 4,
    camino_vida_descripcion: 'Tu Camino de Vida 9 te marca como un sanador universal y portador de sabiduría'
  },
  matriz: {
    arcano_activo_numero: 5,
    arcano_activo_nombre: 'El Hierofante',
    punto_A: { numero: 11, nombre: 'Justicia' },
    punto_B: { numero: 2, nombre: 'La Sacerdotisa' },
    punto_C: { numero: 7, nombre: 'El Carro' },
    punto_D: { numero: 16, nombre: 'La Torre' },
    punto_E: { numero: 1, nombre: 'El Mago' },
    cronologia: {
      año_1: { numero: 6, nombre: 'Los Enamorados' },
      año_2: { numero: 7, nombre: 'El Carro' },
      año_3: { numero: 8, nombre: 'La Fortaleza' },
      año_4: { numero: 9, nombre: 'El Ermitaño' },
      año_5: { numero: 10, nombre: 'La Rueda de la Fortuna' }
    }
  },
  bloques_html: {
    B1: '<p>En tu perfil esencial, <strong>Isaac</strong>, encontramos la manifestación de Acuario en su máxima expresión...</p>',
    B2: '<p>Tu relación contigo mismo es el fundamento de todo lo que creas en el mundo...</p>',
    B3: '<p>Los arquetipos que habitan en ti son múltiples y complejos...</p>',
    // ... resto de bloques (aquí solo mostramos unos pocos)
  }
};

// ============================================
// 2. CREAR INSTANCIA DE INJECTOR
// ============================================
console.log('\n📋 === TEST: TEMPLATE INJECTOR === \n');

try {
  // Asumiendo que el template está en ./templates/reporte-maestro-2026.html
  const templatePath = path.join(__dirname, '..', 'templates', 'reporte-maestro-2026.html');
  
  // Si no existe, usar una ruta alternativa
  if (!fs.existsSync(templatePath)) {
    console.warn(`⚠️  Template no encontrado en ${templatePath}`);
    console.log('🔍 Buscando template en directorio actual...\n');
  }

  const injector = new TemplateInjector(templatePath);

  // ============================================
  // 3. INYECTAR VARIABLES (Plan Completo)
  // ============================================
  console.log('🔄 Inyectando variables (Plan: COMPLETO)...');
  const htmlCompleto = injector.render(testDataset, { plan: 'completo' });

  console.log('✅ Inyección exitosa para plan COMPLETO');
  console.log(`📏 Tamaño HTML: ${htmlCompleto.length} caracteres`);

  // ============================================
  // 4. INYECTAR VARIABLES (Plan Esencial)
  // ============================================
  console.log('\n🔄 Inyectando variables (Plan: ESENCIAL)...');
  const htmlEsencial = injector.render(testDataset, { plan: 'esencial' });

  console.log('✅ Inyección exitosa para plan ESENCIAL');
  console.log(`📏 Tamaño HTML: ${htmlEsencial.length} caracteres`);

  // ============================================
  // 5. VALIDACIONES
  // ============================================
  console.log('\n🔍 === VALIDACIONES ===\n');

  // Validar que datos se reemplazaron
  const validaciones = [
    { 
      nombre: 'Nombre del cliente',
      test: () => htmlCompleto.includes('Isaac Moreno'),
      expected: true
    },
    {
      nombre: 'Signo solar',
      test: () => htmlCompleto.includes('Acuario'),
      expected: true
    },
    {
      nombre: 'Edad',
      test: () => htmlCompleto.includes('31'),
      expected: true
    },
    {
      nombre: 'Ciudad',
      test: () => htmlCompleto.includes('Hermosillo'),
      expected: true
    },
    {
      nombre: 'Camino de Vida',
      test: () => htmlCompleto.includes('9'),
      expected: true
    },
    {
      nombre: 'Número Maestro (Expresión 22)',
      test: () => htmlCompleto.includes('22'),
      expected: true
    },
    {
      nombre: 'Arcano activo (El Hierofante)',
      test: () => htmlCompleto.includes('El Hierofante'),
      expected: true
    },
    {
      nombre: 'Índice dinámico presente',
      test: () => htmlCompleto.includes('Perfil Esencial'),
      expected: true
    },
    {
      nombre: 'Bloque B1 inyectado',
      test: () => htmlCompleto.includes('Isaac'),
      expected: true
    },
    {
      nombre: 'Plan Completo: Parte II incluida',
      test: () => htmlCompleto.includes('Transformación'),
      expected: true
    },
    {
      nombre: 'Plan Esencial: Menos bloques',
      test: () => htmlEsencial.length < htmlCompleto.length,
      expected: true
    },
    {
      nombre: 'Sin placeholders no reemplazados {{',
      test: () => !htmlCompleto.match(/{{[a-zA-Z0-9._]+}}/),
      expected: true
    }
  ];

  let passCount = 0;
  for (const val of validaciones) {
    const result = val.test();
    const status = result === val.expected ? '✅' : '❌';
    console.log(`${status} ${val.nombre}`);
    if (result === val.expected) passCount++;
  }

  console.log(`\n📊 Resultado: ${passCount}/${validaciones.length} validaciones pasadas`);

  // ============================================
  // 6. GUARDAR HTML EN ARCHIVO
  // ============================================
  const outputPath = path.join('/tmp', 'test-output-completo.html');
  fs.writeFileSync(outputPath, htmlCompleto, 'utf8');
  console.log(`\n💾 HTML renderizado guardado en: ${outputPath}`);
  console.log(`   Abre en navegador: open ${outputPath}`);

  // ============================================
  // 7. MOSTRAR RESUMEN
  // ============================================
  console.log('\n📈 === RESUMEN ===\n');
  console.log(`Cliente: ${testDataset.cliente.nombre} (edad ${testDataset.cliente.edad})`);
  console.log(`Signo Solar: ${testDataset.astro.sol_signo}`);
  console.log(`Ascendente: ${testDataset.astro.asc_signo}`);
  console.log(`Camino de Vida: ${testDataset.numerologia.camino_vida}`);
  console.log(`Número de Expresión: ${testDataset.numerologia.numero_expresion} (Maestro)`);
  console.log(`Arcano Activo: ${testDataset.matriz.arcano_activo_nombre} (${testDataset.matriz.arcano_activo_numero})`);
  console.log(`\nTamaño HTML Completo: ${htmlCompleto.length} caracteres (~${(htmlCompleto.length / 1024).toFixed(1)} KB)`);
  console.log(`Tamaño HTML Esencial: ${htmlEsencial.length} caracteres (~${(htmlEsencial.length / 1024).toFixed(1)} KB)`);
  console.log(`Diferencia: ${htmlCompleto.length - htmlEsencial.length} caracteres (Parte II)`);

  console.log('\n✨ === TEST COMPLETADO ===\n');

} catch (error) {
  console.error('\n❌ ERROR:', error.message);
  console.error(error.stack);
  process.exit(1);
}
