/**
 * guardar-pedido.js (Netlify Function)
 * Guarda datos de nacimiento en Supabase antes de redirigir a Hotmart.
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY;
const HOTMART_URL  = 'https://pay.hotmart.com/N106511881A';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'JSON inválido' }) };
  }

  const { nombre, email, fechaNacimiento, horaNacimiento, ciudad } = body;

  if (!nombre || !email || !fechaNacimiento || !horaNacimiento || !ciudad) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Datos incompletos' }) };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Email inválido' }) };
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/pedidos`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({ nombre, email, fecha_nacimiento: fechaNacimiento, hora_nacimiento: horaNacimiento, ciudad, plan: 'completo' }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Supabase error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Error guardando datos' }) };
  }

  const hotmart_checkout = `${HOTMART_URL}?name=${encodeURIComponent(nombre)}&email=${encodeURIComponent(email)}`;

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hotmart_url: hotmart_checkout }),
  };
};
