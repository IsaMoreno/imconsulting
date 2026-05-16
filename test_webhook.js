/**
 * Test del webhook completo
 * Simula un pago y genera reporte
 */

const http = require('http');

const testPayload = {
  paymentMethodId: 'pm_card_visa',
  plan: 'esencial',
  amount: 5500,
  cliente: {
    nombre: 'Isaac Moreno',
    email: 'isaac@imconsulting.me',
    edad: 30,
    signo_solar: 'Acuario',
    ascendente: 'Escorpio',
    mc: 'Leo'
  }
};

const options = {
  hostname: 'localhost',
  port: 8888,
  path: '/.netlify/functions/webhook',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(JSON.stringify(testPayload))
  }
};

const req = http.request(options, (res) => {
  console.log(`\n📊 STATUS: ${res.statusCode}\n`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('✅ RESPUESTA WEBHOOK:\n', JSON.stringify(response, null, 2));
    } catch (e) {
      console.log('📝 RESPUESTA RAW:\n', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ ERROR: ${e.message}`);
});

console.log('📤 Enviando pago de prueba...\n');
req.write(JSON.stringify(testPayload));
req.end();
