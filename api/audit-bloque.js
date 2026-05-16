/**
 * audit-bloque.js
 * Valida cada bloque contra criterios de skill-voz-im
 */

const auditarBloque = (contenido, numeroBloque) => {
  const failures = [];
  if (contenido.match(/^(En este bloque|A continuación|Como veremos)/i)) {
    failures.push("Apertura genérica");
  }
  if (contenido.match(/No es |No se trata |No significa /i)) {
    failures.push("Negación antes de afirmación");
  }
  const palabras = contenido.split(/\s+/).length;
  if (palabras < 350 || palabras > 750) {
    failures.push(`Extensión fuera de rango: ${palabras} palabras`);
  }
  return {
    passed: failures.length === 0,
    numeroBloque,
    palabras,
    failures
  };
};

module.exports = { auditarBloque };
