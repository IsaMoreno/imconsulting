const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const CACHE_DIR = path.join("/tmp", "cache_bloques");
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

const generarKeyCaché = (numeroBloque, signoSolar, rangEdad) => {
  const clave = `B${numeroBloque}_${signoSolar}_${Math.floor(rangEdad / 5) * 5}`;
  return clave;
};

const hashCaché = (clave) => {
  return crypto.createHash("sha256").update(clave).digest("hex");
};

const obtenerDelCaché = (numeroBloque, signoSolar, edad) => {
  const clave = generarKeyCaché(numeroBloque, signoSolar, edad);
  const hash = hashCaché(clave);
  const rutaCaché = path.join(CACHE_DIR, `${hash}.json`);

  if (fs.existsSync(rutaCaché)) {
    try {
      const contenido = JSON.parse(fs.readFileSync(rutaCaché, "utf-8"));
      console.log(`✅ CACHE HIT: B${numeroBloque}`);
      return contenido;
    } catch (err) {
      return null;
    }
  }
  return null;
};

const guardarEnCaché = (numeroBloque, signoSolar, edad, contenido) => {
  const clave = generarKeyCaché(numeroBloque, signoSolar, edad);
  const hash = hashCaché(clave);
  const rutaCaché = path.join(CACHE_DIR, `${hash}.json`);
  const registro = { clave, contenido, timestamp: new Date().toISOString() };
  fs.writeFileSync(rutaCaché, JSON.stringify(registro, null, 2), "utf-8");
};

module.exports = { obtenerDelCaché, guardarEnCaché };
