# DECISIONS — IM Consulting

> Registro de decisiones de arquitectura (ADR ligero). Una entrada por decisión: contexto en
> una línea, decisión, y por qué. Lo más reciente arriba. No borrar entradas; si una decisión
> se revierte, agrega una nueva que lo diga.

---

### D-008 · Resend es el remitente primario desde `reportes@im-consulting.me` (revierte el orden de D-003)
**Por qué:** Dominio `im-consulting.me` verificado en Resend (2026-06-18) → envío con marca propia
y buena entregabilidad. Gmail desde `@gmail.com` no puede usar `from` del dominio sin Google
Workspace de pago, y la App Password obligaba a 2FA. Ahora `sendEmail()` usa Resend por defecto;
Gmail queda como fallback **opcional** solo si se configuran `GMAIL_USER`/`GMAIL_PASS` (hoy vacías).
Esto invierte el orden de D-003 (que ponía Gmail primario).

### D-007 · Railway es el generador canónico, Netlify solo cobra y sirve el sitio
**Por qué:** Las Netlify Functions tienen timeout corto (10-26s), insuficiente para 14-20
llamadas a Claude con auditoría y reintentos (2-10 min). Railway corre Express en Docker sin
límite de tiempo. Netlify se queda con lo que sí cabe en su timeout: servir el checkout
estático y cobrar Stripe de forma síncrona. (commit b7ee250)

### D-006 · El cobro es síncrono en `webhook.js`, NO hay listener de webhook de Stripe
**Por qué:** El checkout crea un PaymentMethod y `api/webhook.js` confirma un PaymentIntent
server-side en la misma request, con precios fijos server-side ($55=5500, $111=11100). El
nombre "webhook" es heredado y engañoso: no escucha eventos de Stripe. Por eso "configurar
Stripe webhook" NO es un pendiente.

### D-005 · Dataset inline en JS, se abandonó `compute_dataset.py`
**Por qué:** `railway/app.js > buildDataset()` calcula signo solar y numerología en JS puro.
El flujo Python (`engine/`, `compute_dataset`) quedó fuera del camino de producción. El dataset
es pequeño, no justifica un servicio Python aparte ni compresión.

### D-004 · PDF con Puppeteer + Chromium del sistema (Dockerfile), no html2pdf ni @sparticuz
**Por qué:** Railway corre en Docker; el Dockerfile instala Chromium en `/usr/bin/chromium` y
Puppeteer-core lo usa directo. Más estable que `@sparticuz/chromium` (pensado para serverless)
o `html2pdf.js` (cliente). (commit bc9df1b)

### D-003 · Email: Gmail (Nodemailer) primario con fallback a Resend
**Por qué:** Se probó Resend, luego Nodemailer+Gmail, y se aterrizó en Gmail primario +
Resend como respaldo si Gmail falla. Da redundancia en la entrega, que es el último paso
crítico del flujo. (commits 26b3420, 79c0f21, 1175981)

### D-002 · Auditoría de bloques con reintentos integrada en la generación
**Por qué:** Cada bloque se valida contra 8 criterios de skill-voz-im (`api/audit-bloque.js`);
si falla, se reintenta con la sugerencia de corrección (hasta 4 veces). Es el único componente
de las optimizaciones de mayo que sobrevivió a la migración a Railway.

### D-001 · Modelo Claude Sonnet-4-6 en lugar de Opus
**Por qué:** ~80% de ahorro en costo de API con calidad suficiente para los bloques narrativos,
respaldada por la auditoría automática. (Sesión 2, 2026-05-15)
