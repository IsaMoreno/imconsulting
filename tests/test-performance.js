/**
 * TEST: Performance
 */

const TemplateInjector = require('../api/template-injector.js');
const HTMLtoPDF = require('../api/html-to-pdf.js');
const path = require('path');

console.log('\n⏱️  === PERFORMANCE TEST ===\n');

const testDataset = {
  cliente: {
    nombre: 'Isaac Moreno',
    edad: 31,
    ciudad: 'Hermosillo',
    pais: 'México',
    email: 'isaac@imconsulting.com'
  },
  astro: {
    sol_signo: 'Acuario',
    sol_grados: 21.5,
    asc_signo: 'Escorpio',
    asc_grados: 14.2,
    mc_signo: 'Leo',
    mc_grados: 8.7,
    luna: { signo: 'Virgo', grados: 12.3, casa: 7 },
    mercurio: { signo: 'Piscis', grados: 5.1, casa: 1 },
    venus: { signo: 'Sagitario', grados: 18.9, casa: 10 },
    marte: { signo: 'Géminis', grados: 25.4, casa: 4 },
    jupiter: { signo: 'Virgo', grados: 11.2, casa: 7 },
    saturno: { signo: 'Libra', grados: 27.8, casa: 8 },
    urano: { signo: 'Capricornio', grados: 19.5, casa: 11 },
    neptuno: { signo: 'Capricornio', grados: 28.1, casa: 11 },
    pluton: { signo: 'Escorpio', grados: 22.6, casa: 9 },
    balance_elemental: { fuego: 16.7, tierra: 25.0, aire: 33.3, agua: 25.0 }
  },
  numerologia: {
    camino_vida: 9,
    numero_expresion: 22,
    numero_alma: 11,
    numero_personalidad: 4
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
  }
};

async function testPerformance() {
  try {
    const totalStart = Date.now();

    console.log('📝 Template Injection:');
    const injectionStart = Date.now();
    const templatePath = path.join(__dirname, '..', 'templates', 'reporte-maestro-2026.html');
    const injector = new TemplateInjector(templatePath);
    const htmlRendered = injector.render(testDataset, { plan: 'completo' });
    const injectionTime = ((Date.now() - injectionStart) / 1000).toFixed(2);
    console.log(`   ⏱️  ${injectionTime}s\n`);

    console.log('📑 PDF Conversion:');
    const pdfStart = Date.now();
    const converter = new HTMLtoPDF();
    const pdfBuffer = await converter.convertToPDF(htmlRendered);
    const pdfTime = ((Date.now() - pdfStart) / 1000).toFixed(2);
    console.log(`   ⏱️  ${pdfTime}s\n`);

    const totalTime = ((Date.now() - totalStart) / 1000).toFixed(2);

    console.log('📊 === RESUMEN ===\n');
    console.log(`Template Injection: ${injectionTime}s`);
    console.log(`PDF Conversion:     ${pdfTime}s`);
    console.log(`TOTAL:              ${totalTime}s`);
    console.log(`\n🎯 Target: <30 segundos`);
    
    if (totalTime < 30) {
      console.log(`✅ PERFORMANCE OK (${totalTime}s < 30s)\n`);
    } else {
      console.log(`⚠️  PERFORMANCE LENTO (${totalTime}s > 30s)\n`);
    }

    console.log('✨ === TEST COMPLETADO ===\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  }
}

testPerformance();