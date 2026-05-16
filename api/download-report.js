/**
 * API Endpoint: download-report.js
 * 
 * Netlify Function para descargar reportes PDF.
 * 
 * GET /.netlify/functions/download-report?id=uuid
 * 
 * Valida:
 * - Que el reporte existe
 * - Que ya está completado
 * - Retorna el PDF como descarga
 */

const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  try {
    const { id } = event.queryStringParameters || {};

    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'ID de reporte requerido' })
      };
    }

    // Validar formato del ID (evitar path traversal)
    if (!/^[a-f0-9-]+$/.test(id)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'ID de reporte inválido' })
      };
    }

    // Construir ruta del PDF
    const pdfPath = `/tmp/${id}_reporte.pdf`;

    // Verificar que existe
    if (!fs.existsSync(pdfPath)) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Reporte no encontrado' })
      };
    }

    // Leer el archivo
    const pdfBuffer = fs.readFileSync(pdfPath);

    // Retornar como descarga
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="reporte-${id.slice(0, 8)}.pdf"`,
        'Content-Length': pdfBuffer.length,
        'Cache-Control': 'public, max-age=3600', // 1 hora
      },
      body: pdfBuffer.toString('base64'),
      isBase64Encoded: true
    };

  } catch (error) {
    console.error('Error downloading report:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Error descargando reporte'
      })
    };
  }
};
