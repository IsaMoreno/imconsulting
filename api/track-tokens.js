const fs = require("fs");
const path = require("path");

const registrarConsumo = (reporteId, plan, tokensUsados, costo, modelo) => {
  const registro = {
    id: reporteId,
    plan,
    tokens: tokensUsados,
    costo: parseFloat(costo.toFixed(4)),
    modelo,
    timestamp: new Date().toISOString(),
  };

  const archivoConsumo = path.join("/tmp", "consumo_tokens.jsonl");
  fs.appendFileSync(archivoConsumo, JSON.stringify(registro) + "\n");

  console.log(
    `💰 [${reporteId}] ${tokensUsados} tokens | $${registro.costo} | ${modelo.toUpperCase()}`
  );

  return registro;
};

const analizarConsumo = () => {
  const archivoConsumo = path.join("/tmp", "consumo_tokens.jsonl");

  if (!fs.existsSync(archivoConsumo)) {
    console.log("No hay registros de consumo aún");
    return null;
  }

  const lineas = fs
    .readFileSync(archivoConsumo, "utf-8")
    .split("\n")
    .filter((l) => l.trim());

  const registros = lineas.map((l) => JSON.parse(l));
  const totalTokens = registros.reduce((sum, r) => sum + r.tokens, 0);
  const totalCosto = registros.reduce((sum, r) => sum + r.costo, 0);

  console.log(`Reportes: ${registros.length}, Tokens: ${totalTokens}, Costo: $${totalCosto.toFixed(2)}`);

  return { registros: registros.length, totalTokens, totalCosto };
};

module.exports = { registrarConsumo, analizarConsumo };
