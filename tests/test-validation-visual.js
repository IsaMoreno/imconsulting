/**
 * TEST: Validación Visual
 */

const TemplateInjector = require('../api/template-injector.js');
const HTMLtoPDF = require('../api/html-to-pdf.js');
const fs = require('fs');
const path = require('path');

console.log('\n📋 === VALIDACIÓN VISUAL: PDF GENERADO ===\n');

const isaacDataset = {
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
    balance_elemental: {
      fuego: 16.7,
      tierra: 25.0,
      aire: 33.3,
      agua: 25.0
    }
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
  },
  bloques_html: {
    B1: '<p>En tu perfil esencial, Isaac, encontramos la manifestación...</p>'
  }
};

async function validateVisual() {
  try {
    console.log('1️⃣  Inyectando template...');
    const templatePath = path.join(__dirname, '..', 'templates', 'reporte-maestro-2026.html');
    const injector = new TemplateInjector(templatePath);
    const htmlRendered = injector.render(isaacDataset, { plan: 'completo' });
    console.log(`   ✅ HTML inyectado\n`);

    console.log('2️⃣  Convirtiendo HTML a PDF...');
    const converter = new HTMLtoPDF();
    const pdfBuffer = await converter.convertToPDF(htmlRendered);
    console.log(`   ✅ PDF generado\n`);

    console.log('3️⃣  Guardando PDF...');
    const pdfPath = path.join('/tmp', 'validation-isaac-completo.pdf');
    fs.writeFileSync(pdfPath, pdfBuffer);
    console.log(`   ✅ Guardado\n`);

    console.log('4️⃣  Validaciones:\n');

    const validaciones = [
      { nombre: 'Nombre cliente', test: () => htmlRendered.includes('Isaac Moreno'), expected: true },
      { nombre: 'Signo solar', test: () => htmlRendered.includes('Acuario'), expected: true },
      { nombre: 'Edad', test: () => htmlRendered.includes('31'), expected: true },
      { nombre: 'Camino vida', test: () => htmlRendered.includes('9'), expected: true },
      { nombre: 'Número maestro', test: () => htmlRendered.includes('22'), expected: true },
      { nombre: 'Arcano activo', test: () => htmlRendered.includes('El Hierofante'), expected: true },
      { nombre: 'PDF generado', test: () => pdfBuffer && pdfBuffer.length > 50000, expected: true }
    ];

    let passCount = 0;
    for (const val of validaciones) {
      const result = val.test();
      const status = result === val.expected ? '✅' : '❌';
      console.log(`${status} ${val.nombre}`);
      if (result === val.expected) passCount++;
    }

    console.log(`\n✨ Resultado: ${passCount}/${validaciones.length} validaciones pasadas\n`);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  }
}

validateVisual();