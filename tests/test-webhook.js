/**
 * TEST: Webhook Integration
 * 
 * Uso:
 *   node tests/test-webhook.js
 * 
 * Simula un evento Stripe y valida el flujo completo
 */

const webhook = require('../api/webhook.js');
const fs = require('fs');

console.log('\n📋 === TEST: WEBHOOK INTEGRATION === \n');

// Datos de prueba (Isaac Moreno)
const testEvent = {
  body: JSON.stringify({
    id_pedido: 'test_webhook_001',
    plan: 'completo',
    cliente: {
      nombre: 'Isaac Moreno',
      email: 'isaac@imconsulting.com',
      edad: 31,
      ciudad: 'Hermosillo',
      pais: 'México'
    },
    dataset: {
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
        B1: '<p>En tu perfil esencial, Isaac, encontramos la manifestación de Acuario...</p>',
        B2: '<p>Tu relación contigo mismo es el fundamento...</p>'
      }
    }
  })
};

async function runTest() {
  try {
    console.log('🔄 Ejecutando webhook con datos de prueba...\n');
    const response = await webhook.handler(testEvent);

    console.log('\n📊 === RESPUESTA DEL WEBHOOK ===\n');
    const responseBody = JSON.parse(response.body);
    
    console.log(`Status Code: ${response.statusCode}`);
    console.log(`Success: ${responseBody.success}`);
    console.log(`ID Pedido: ${responseBody.id_pedido}`);
    console.log(`Cliente: ${responseBody.cliente_nombre}`);
    console.log(`PDF Size: ${responseBody.pdf_size_kb} KB`);
    console.log(`Email Sent: ${responseBody.email_sent}`);

    // Validaciones
    console.log('\n🔍 === VALIDACIONES ===\n');

    const validaciones = [
      {
        nombre: 'Status 200',
        test: () => response.statusCode === 200,
        expected: true
      },
      {
        nombre: 'Success true',
        test: () => responseBody.success === true,
        expected: true
      },
      {
        nombre: 'ID Pedido correcto',
        test: () => responseBody.id_pedido === 'test_webhook_001',
        expected: true
      },
      {
        nombre: 'PDF generado',
        test: () => responseBody.pdf_size_kb > 0,
        expected: true
      },
      {
        nombre: 'Email enviado',
        test: () => responseBody.email_sent === true,
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

    if (passCount === validaciones.length) {
      console.log('✨ === WEBHOOK TEST COMPLETADO ===\n');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runTest();