/**
 * Test del webhook con generate-report REAL
 */

// Cargar variables de entorno ANTES de cualquier otro require
require('dotenv').config({ path: '.env.local' });

const webhookHandler = require('./api/webhook');

async function testWebhook() {
  console.log('🧪 Iniciando test del webhook con generate-report...\n');

  const mockEvent = {
    httpMethod: 'POST',
    body: JSON.stringify({
      paymentMethodId: 'pm_card_visa',
      plan: 'esencial',
      amount: 5500, // $55.00
      cliente: {
        nombre: 'Isaac Moreno',
        email: 'isaac@imconsulting.me',
        edad: 30,
        signo_solar: 'Acuario',
        ascendente: 'Escorpio',
        mc: 'Leo',
        camino_vida: 9,
        numero_expresion: 7,
        numero_alma: 5,
        numero_personalidad: 22,
        punto_a: 1,
        punto_b: 2,
        punto_c: 3,
        punto_d: 4,
        punto_e: 5,
        ciudad: 'Hermosillo',
        pais: 'México',
        eventos_cruzados: []
      }
    })
  };

  try {
    console.log('📤 Enviando request al webhook...\n');
    const response = await webhookHandler.handler(mockEvent);
    
    console.log('\n📥 Respuesta recibida:\n');
    console.log(JSON.stringify(JSON.parse(response.body), null, 2));
    
    if (response.statusCode === 200) {
      console.log('\n✅ TEST EXITOSO');
    } else {
      console.log(`\n❌ TEST FALLÓ - Status: ${response.statusCode}`);
    }
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
  }
}

testWebhook();