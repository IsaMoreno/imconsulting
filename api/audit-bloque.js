/**
 * audit-bloque.js
 * Valida cada bloque contra criterios de skill-voz-im (criterios 1-8)
 * y contra patrones de 04_REDIRECCION.md (criterio 9).
 * Criterio 9 devuelve campo `sugerencia` con el reemplazo accionable.
 */

// ── Criterio 9 — patrones con reemplazo ──────────────────────────────────────
// Cada entrada: { regex, patron, sugerencia }
const PATRONES_REDIRECCION = [
  // Familia A — Tells de LLM
  {
    regex: /no\s+sol[oa]\s+.{1,60},?\s+sino\s+/i,
    patron: '"No solo X, sino Y"',
    sugerencia: 'Afirma Y directamente, sin mencionar X. Elimina la construcción "no solo… sino".',
  },
  {
    regex: /más\s+que\s+.{1,40},?\s+es\s+/i,
    patron: '"Más que X, es Y"',
    sugerencia: 'Escribe Y directo, sin introducir X para negarlo.',
  },
  {
    regex: /puede\s+(leerse|verse|parecer|sonar)\s+como\s+.{1,50},?\s+(pero|aunque|sin\s+embargo)\b/i,
    patron: 'Contraste invalidador ("puede leerse como X, pero Y")',
    sugerencia: 'Afirma Y directamente desde la perspectiva del cliente. Elimina la lectura externa que introduces para corregirla.',
  },
  {
    regex: /desde\s+afuera\s+.{1,40},?\s+(pero|mas|pero\s+desde\s+adentro)\b|desde\s+adentro\s+es\b/i,
    patron: 'Contraste afuera/adentro',
    sugerencia: 'Nombra lo que es desde adentro directamente, sin contrastar con la mirada externa.',
  },
  {
    regex: /\b(claridad|fuerza|propósito|poder|paz|abundancia|plenitud|equilibrio)(,\s*(claridad|fuerza|propósito|poder|paz|abundancia|plenitud|equilibrio)){2,}/i,
    patron: 'Tricolon decorativo de sustantivos abstractos',
    sugerencia: 'Elige una sola idea concreta y específica para este cliente. Elimina las otras dos.',
  },
  {
    regex: /y\s+eso\s+lo\s+cambia\s+todo|ahí\s+empieza\s+tu\s+poder|ese\s+es\s+el\s+punto\s+de\s+partida|eso\s+lo\s+transforma\s+todo/i,
    patron: 'Cierre motivacional genérico',
    sugerencia: 'Cierra en seco con la última observación concreta del patrón del cliente. Sin remate.',
  },
  {
    regex: /^en\s+un\s+mundo\s+donde|^desde\s+siempre\s+|^a\s+lo\s+largo\s+de\s+la\s+historia/im,
    patron: 'Apertura de ensayo',
    sugerencia: 'Entra directo al patrón del cliente en la primera frase, sin preámbulo histórico o universal.',
  },
  {
    regex: /es\s+importante\s+recordar\s+que|vale\s+la\s+pena\s+notar\s+que|cabe\s+destacar\s+que|es\s+fundamental\s+tener\s+en\s+cuenta/i,
    patron: '"Es importante recordar que" / metacomentario',
    sugerencia: 'Elimina el anuncio. Escribe la observación directamente.',
  },
  {
    regex: /\b(quizás|quizá|podría\s+ser\s+que|en\s+cierto\s+modo|de\s+alguna\s+manera|tal\s+vez|a\s+veces\s+parece)\b/i,
    patron: 'Hedging / lenguaje evasivo',
    sugerencia: 'Afirma con precisión: "esto opera así en tu caso" o "este patrón se activa cuando…". Sin cobertura.',
  },
  {
    regex: /\b(esto\s+es\s+un\s+viaje|es\s+un\s+camino|es\s+un\s+proceso\s+de\s+transformación|en\s+este\s+camino)\b/i,
    patron: 'Metáfora genérica (viaje/camino/proceso)',
    sugerencia: 'Nombra el patrón específico del cliente sin metáfora. Describe qué ocurre, no cómo se llama.',
  },
  {
    regex: /¿estás\s+list[oa]\s+para|¿te\s+imaginas\s+si|¿y\s+si\s+te\s+digo\s+que/i,
    patron: 'Pregunta retórica de coach al final',
    sugerencia: 'Termina en afirmación o cierre descriptivo. Sin pregunta retórica.',
  },
  {
    regex: /(\b\w+a?\b)\s+(y|e)\s+(transformador[a]?|profund[oa]?|poderoso[a]?|increíble|extraordinari[oa]?)/i,
    patron: 'Adjetivos apilados',
    sugerencia: 'Usa un solo adjetivo exacto que describa lo específico de este cliente.',
  },
  // Familia B — Términos kabbalísticos internos
  {
    regex: /\bklipot\b|\bklipa\b/i,
    patron: 'Término kabbalístico: Klipot/Klipa',
    sugerencia: 'Reemplaza por "lo que te frena sin que lo veas".',
  },
  {
    regex: /\bmalkut\b/i,
    patron: 'Término kabbalístico: Malkut',
    sugerencia: 'Reemplaza por "lo que ves en tu vida".',
  },
  {
    regex: /\byesod\b/i,
    patron: 'Término kabbalístico: Yesod',
    sugerencia: 'Reemplaza por "lo que filtra lo que te llega".',
  },
  {
    regex: /\btik[uú]n\b/i,
    patron: 'Término kabbalístico: Tikún',
    sugerencia: 'Reemplaza por "el cambio real".',
  },
  {
    regex: /\bein\s+sof\b/i,
    patron: 'Término kabbalístico: Ein Sof',
    sugerencia: 'Reemplaza por "la fuente de donde viene todo".',
  },
  {
    regex: /\bnefesh\b/i,
    patron: 'Término kabbalístico: Nefesh',
    sugerencia: 'Reemplaza por "la capa más instintiva".',
  },
  {
    regex: /\bneshama\b|\bneshamá\b/i,
    patron: 'Término kabbalístico: Neshamá',
    sugerencia: 'Reemplaza por "lo que te mueve sin que lo pienses".',
  },
  {
    regex: /\bruaj\b/i,
    patron: 'Término kabbalístico: Ruaj',
    sugerencia: 'Reemplaza por "el puente entre lo que sientes y lo que decides".',
  },
  {
    regex: /\bsephirot\b|\bsefiroth?\b/i,
    patron: 'Término kabbalístico: Sephirot',
    sugerencia: 'Reemplaza por "los centros de energía que mapean tu vida".',
  },
  {
    regex: /\bchesed\b/i,
    patron: 'Término kabbalístico: Chesed',
    sugerencia: 'Reemplaza por "lo que das sin condición".',
  },
  {
    regex: /\bgevur[aá]\b|\bguevur[aá]\b/i,
    patron: 'Término kabbalístico: Gevurá',
    sugerencia: 'Reemplaza por "la fuerza que pone límites".',
  },
  {
    regex: /\btiferet\b/i,
    patron: 'Término kabbalístico: Tiferet',
    sugerencia: 'Reemplaza por "el centro que equilibra todo lo demás".',
  },
  {
    regex: /\bnetzaj\b|\bnetzach\b/i,
    patron: 'Término kabbalístico: Netzaj',
    sugerencia: 'Reemplaza por "lo que te impulsa a crear y a desear".',
  },
  {
    regex: /\bhod\b/i,
    patron: 'Término kabbalístico: Hod',
    sugerencia: 'Reemplaza por "cómo organizas y comunicas lo que eres".',
  },
  {
    regex: /\bbin[aá]\b/i,
    patron: 'Término kabbalístico: Biná',
    sugerencia: 'Reemplaza por "la comprensión que transforma lo que recibes".',
  },
  {
    regex: /\bjoj[mм][aá]\b|\bjochm[aá]\b/i,
    patron: 'Término kabbalístico: Jojmá',
    sugerencia: 'Reemplaza por "el destello inicial antes de que se forme la idea".',
  },
  {
    regex: /\bketer\b/i,
    patron: 'Término kabbalístico: Keter',
    sugerencia: 'Reemplaza por "el origen, lo que está antes de ti".',
  },
  {
    regex: /\bárbol\s+de\s+la\s+vida\b/i,
    patron: 'Sistema expuesto: "Árbol de la Vida"',
    sugerencia: 'Reemplaza por "el mapa que usamos para leer tu energía" o elimina la referencia.',
  },
  {
    regex: /\bzohar\b/i,
    patron: 'Referencia interna: "Zohar"',
    sugerencia: 'Omite la cita. Integra la observación directamente sin nombrar la fuente.',
  },
  {
    regex: /\bpartzuf\b|\bpartzufim\b/i,
    patron: 'Término kabbalístico: Partzuf',
    sugerencia: 'Reemplaza por "la forma en que ese centro se expresa en ti".',
  },
  {
    regex: /\btikkun\s+olam\b/i,
    patron: 'Término con carga religiosa: "Tikkun olam"',
    sugerencia: 'Reemplaza por "reparar lo que viene de antes".',
  },
  {
    regex: /\bgilgul\b/i,
    patron: 'Término kabbalístico: Gilgul',
    sugerencia: 'Reemplaza por "lo que cargás de vidas anteriores" o evita si no aplica al bloque.',
  },
];

// ── auditarBloque — criterios 1-8 + criterio 9 ───────────────────────────────
const auditarBloque = (contenido, numeroBloque) => {
  const failures = [];

  // Criterio 1 — Apertura genérica (00_CORE: "No abrir con frases genéricas")
  if (contenido.match(/^(En este bloque|A continuación|Como veremos)/i)) {
    failures.push({ criterio: 1, descripcion: 'Apertura genérica' });
  }

  // Criterio 2 — Negación antes de afirmación (00_CORE: FILTRO DE VOZ)
  // Cubre: "No es X, es Y" · "No es X — es Y" · "no la X, sino la Y" · "no porque X sino Y"
  if (contenido.match(/(^|\s)[Nn]o (es |se trata |significa |la |el |porque |por )[^.?!]{1,80}[—,]\s*(es|sino|sí|si)\b/m) ||
      contenido.match(/(^|\s)[Nn]o (es |se trata |significa )/im)) {
    failures.push({ criterio: 2, descripcion: 'Negación antes de afirmación' });
  }

  // Criterio 3 — Extensión fuera de rango (00_CORE: "400–600 palabras")
  const palabras = contenido.split(/\s+/).length;
  if (palabras < 350 || palabras > 750) {
    failures.push({ criterio: 3, descripcion: `Extensión fuera de rango: ${palabras} palabras` });
  }

  // Criterio 4 — Tercera persona (00_CORE: VOZ — DIRECCIÓN AL CLIENTE)
  if (contenido.match(/\b(la persona con este perfil|este patrón indica que el cliente|el cliente tiende|el nativo|el individuo|quien tiene este)\b/i)) {
    failures.push({ criterio: 4, descripcion: 'Tercera persona — reescribir en segunda persona singular (tú)' });
  }

  // Criterio 5 — Lenguaje predictivo (00_CORE: PROHIBICIONES ABSOLUTAS)
  if (contenido.match(/tendr[aá]s|te pasar[aá]|tu destino es|este año traer[aá]|lo que viene para ti|vas a lograr|te espera[^n]|llegar[aá]s a/i)) {
    failures.push({ criterio: 5, descripcion: 'Lenguaje predictivo — reescribir en presente descriptivo' });
  }

  // Criterio 6 — Nombrar disciplinas o sistemas (00_CORE: PROHIBICIONES ABSOLUTAS)
  if (contenido.match(/\b(la astrología (indica|señala|muestra|dice)|la numerología (señala|indica|muestra)|en kabbalah|la matriz (muestra|indica|revela)|el coaching|la psicología jungiana|la decodificación biológica)\b/i)) {
    failures.push({ criterio: 6, descripcion: 'Disciplina nombrada explícitamente — integrar sin citar la fuente' });
  }

  // Criterio 7 — Datos técnicos expuestos (00_CORE: PROHIBICIONES ABSOLUTAS)
  if (contenido.match(/\b(tu sol en|tu luna en|tu ascendente en|el arcano \d|tu camino de vida es|camino de vida \d|tu número es|signo solar|signo lunar)\b/i)) {
    failures.push({ criterio: 7, descripcion: 'Dato técnico expuesto — los datos informan internamente, no aparecen en el texto' });
  }

  // Criterio 8 — Viñetas o encabezados dentro del bloque (00_CORE: FORMATO)
  if (contenido.match(/^(\s*[-•*]\s|\s*\d+\.\s|\s*#{1,3}\s)/m)) {
    failures.push({ criterio: 8, descripcion: 'Viñetas o encabezados detectados — usar prosa continua' });
  }

  // Criterio 9 — Redirección: detecta primer patrón y devuelve sugerencia
  let sugerencia9 = null;
  for (const p of PATRONES_REDIRECCION) {
    if (p.regex.test(contenido)) {
      failures.push({ criterio: 9, descripcion: `Patrón prohibido: ${p.patron}` });
      sugerencia9 = p.sugerencia;
      break; // un fallo por ciclo; el reintento corrige uno a la vez
    }
  }

  const resultado = {
    passed: failures.length === 0,
    numeroBloque,
    palabras,
    failures: failures.map(f => f.descripcion),
  };

  if (sugerencia9) {
    resultado.sugerencia = sugerencia9;
  }

  return resultado;
};

module.exports = { auditarBloque };
