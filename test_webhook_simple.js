const http = require('http');

const testPayload = {
  paymentMethodId: 'pm_card_visa',
  plan: 'esencial',
  amount: 5500,
  cliente: {
    nombre: 'Test User',
    email: 'test@example.com',
    edad: 30
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
  console.log(`\nSTATUS: ${res.statusCode}\n`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('RESPUESTA:\n', JSON.stringify(response, null, 2));
    } catch (e) {
      console.log('ERROR:', data);
    }
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error(`ERROR: ${e.message}`);
  process.exit(1);
});

req.setTimeout(60000);
console.log('Enviando test...');
req.write(JSON.stringify(testPayload));
req.end();
