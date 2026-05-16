/**
 * TEST: HTML-to-PDF Converter
 * 
 * Uso:
 *   node tests/test-html-to-pdf.js
 * 
 * Esto:
 * 1. Genera HTML de prueba simple
 * 2. Convierte a PDF usando Puppeteer
 * 3. Guarda el PDF en /tmp/test-output.pdf
 * 4. Valida que se creó correctamente
 */

const HTMLtoPDF = require('../api/html-to-pdf.js');
const fs = require('fs');
const path = require('path');

console.log('\n📋 === TEST: HTML-TO-PDF CONVERTER === \n');

// HTML de prueba simple
const testHTML = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Test PDF</title>
  <style>
    body {
      font-family: Georgia, serif;
      color: #1A1A1A;
      padding: 40px;
      line-height: 1.6;
    }
    h1 {
      color: #C8B89A;
      font-size: 28px;
      letter-spacing: 3px;
    }
    p {
      font-size: 12px;
      margin-bottom: 15px;
    }
    .section {
      margin-bottom: 30px;
      border-bottom: 1px solid #C8B89A;
      padding-bottom: 20px;
    }
  </style>
</head>
<body>
  <h1>Test de Conversión HTML → PDF</h1>
  
  <div class="section">
    <h2>Información de Prueba</h2>
    <p><strong>Cliente:</strong> Isaac Moreno</p>
    <p><strong>Signo Solar:</strong> Acuario</p>
    <p><strong>Edad:</strong> 31 años</p>
    <p><strong>Ciudad:</strong> Hermosillo, México</p>
  </div>

  <div class="section">
    <h2>Datos Astrológicos</h2>
    <p><strong>Sol:</strong> Acuario 21.5°</p>
    <p><strong>Ascendente:</strong> Escorpio 14.2°</p>
    <p><strong>Medio Cielo:</strong> Leo 8.7°</p>
  </div>

  <div class="section">
    <h2>Numerología</h2>
    <p><strong>Camino de Vida:</strong> 9</p>
    <p><strong>Número de Expresión:</strong> 22 (Número Maestro)</p>
    <p><strong>Número del Alma:</strong> 11 (Número Maestro)</p>
  </div>

  <div class="section">
    <h2>Validación</h2>
    <p>Este PDF fue generado exitosamente desde HTML usando Puppeteer en Node.js.</p>
    <p style="text-align: center; margin-top: 40px; color: #C8B89A;">✦</p>
  </div>
</body>
</html>
`;

async function runTest() {
  try {
    console.log('🔧 Inicializando HTMLtoPDF...');
    const converter = new HTMLtoPDF();

    console.log('🔄 Convirtiendo HTML a PDF...\n');
    const pdfBuffer = await converter.convertToPDF(testHTML);

    const outputPath = path.join('/tmp', 'test-output.pdf');
    fs.writeFileSync(outputPath, pdfBuffer);

    console.log('\n🔍 === VALIDACIONES ===\n');

    const validaciones = [
      {
        nombre: 'PDF generado',
        test: () => pdfBuffer && pdfBuffer.length > 0,
        expected: true
      },
      {
        nombre: 'Tamaño PDF > 50KB',
        test: () => pdfBuffer.length > 50000,
        expected: true
      },
      {
        nombre: 'Archivo guardado',
        test: () => fs.existsSync(outputPath),
        expected: true
      },
      {
        nombre: 'Contenido es PDF (magic bytes)',
        test: () => pdfBuffer.toString('utf8', 0, 4) === '%PDF',
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

    console.log(`\n📊 Resultado: ${passCount}/${validaciones.length} validaciones pasadas\n`);

    console.log('📈 === RESUMEN ===\n');
    console.log(`Tamaño PDF: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
    console.log(`Guardado en: ${outputPath}`);

    console.log('\n✨ === TEST COMPLETADO ===\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runTest();