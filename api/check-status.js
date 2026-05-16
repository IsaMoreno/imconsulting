/**
 * API Endpoint: check-status.js
 * 
 * Netlify Function para revisar el estado de un reporte en progreso.
 * 
 * POST /api/check-status
 * Body: { id_pedido: "uuid" }
 * 
 * Response:
 * {
 *   success: true,
 *   status: "pending" | "processing" | "completed" | "error",
 *   email: "user@example.com",
 *   plan: "esencial" | "completo",
 *   pdf_url: "https://...",
 *   error: "mensagem de error (si aplica)"
 * }
 */

exports.handler = async (event, context) => {
  // Solo POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { id_pedido } = JSON.parse(event.body || '{}');

    if (!id_pedido) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'id_pedido requerido' })
      };
    }

    /**
     * TODO: Integración con base de datos
     * 
     * Aquí deberías:
     * 1. Buscar en DB el pedido con id_pedido
     * 2. Revisar su estado (pending, processing, completed, error)
     * 3. Si completed, buscar el PDF en /tmp/ o storage remoto
     * 4. Retornar los datos
     * 
     * Por ahora usamos un archivo JSON simulado en /tmp/
     */

    // Simulación: leer del archivo de bloques generados
    const fs = require('fs');
    const path = require('path');

    const blocksFilePath = `/tmp/${id_pedido}_bloques.json`;
    const reportFilePath = `/tmp/${id_pedido}_reporte.pdf`;
    const statusFilePath = `/tmp/${id_pedido}_status.json`;

    // Revisar si existe el archivo de estado
    let status = 'pending';
    let email = null;
    let plan = null;

    // Intenta leer archivo de estado si existe
    try {
      if (fs.existsSync(statusFilePath)) {
        const statusData = JSON.parse(fs.readFileSync(statusFilePath, 'utf-8'));
        status = statusData.status || 'pending';
        email = statusData.email;
        plan = statusData.plan;
      }
    } catch (e) {
      console.log('No status file yet');
    }

    // Si los bloques están generados, cambiar a 'completed'
    if (fs.existsSync(blocksFilePath) && fs.existsSync(reportFilePath)) {
      status = 'completed';

      // Leer email y plan del archivo de bloques
      try {
        const blocksData = JSON.parse(fs.readFileSync(blocksFilePath, 'utf-8'));
        email = blocksData.email || email;
        plan = blocksData.plan || plan;
      } catch (e) {
        console.log('Could not parse blocks file');
      }
    }

    // Respuesta
    const response = {
      success: true,
      status: status,
      email: email,
      plan: plan,
      id_pedido: id_pedido
    };

    // Si completado, generar link de descarga (temporal, válido 1 hora)
    if (status === 'completed') {
      // En desarrollo: link directo a archivo /tmp/
      // En producción: usar URL firmada de Supabase o similar
      response.pdf_url = `/.netlify/functions/download-report?id=${id_pedido}`;
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('Error checking status:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: 'Error checking report status'
      })
    };
  }
};
