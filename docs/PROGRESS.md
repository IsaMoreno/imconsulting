# PROGRESS — IM Consulting

> Log de estado multi-sesión. Lo más reciente arriba. Al cerrar sesión: agrega una entrada
> con fecha, qué se hizo, qué quedó pendiente y decisiones tomadas. El único estado confiable
> es lo que está aquí escrito. Si no está documentado, no pasó.

---

## 2026-06-27 — Realidad: migración a Hotmart + Supabase ya hecha (no estaba documentada)

**Contexto:** se entró a "ejecutar" el plan de persistencia `docs/superpowers/plans/2026-06-12-persistencia-sync-vestibulo.md` y, al verificar el código (regla de oro de este proyecto), se descubrió que **el código ya avanzó mucho más allá de lo que decían ROADMAP/PROGRESS**. La doc volvió a desincronizarse.

**Lo que el código ya hace (commits `f5c2c9a` 06-26, `753badf` 06-27 — solo código, sin doc):**
- **Stripe está fuera. El cobro es Hotmart.** `public/checkout.html` ya no usa Stripe.
- **Supabase ya integrado vía REST** (no el SDK), tabla `pedidos`, env vars `SUPABASE_URL` + `SUPABASE_SECRET_KEY` (ojo: NO `SERVICE_ROLE_KEY`).
- Flujo real nuevo:
  ```
  form → api/guardar-pedido.js → inserta pedido (status='pending') en Supabase → redirige a Hotmart
  Hotmart PURCHASE_APPROVED → api/webhook.js → busca pedido por email+pending
     → llama Railway /admin-report → marca status='processing' + guarda hotmart_transaction
  ```
- Tabla `pedidos` (creada por Isaac en dashboard): `id uuid`, datos de nacimiento, `plan`/`status` con checks, `hotmart_transaction`. Coincide con el código vivo.

**El plan 2026-06-12 quedó OBSOLETO.** Asumía Stripe, SDK `@supabase/supabase-js`, `SERVICE_ROLE_KEY`, tabla `reports`, id generado en Netlify. Nada de eso aplica. No ejecutar tal cual; si se retoma el vestíbulo, reescribir adaptado a Hotmart/REST/`pedidos`.

**Gap técnico que SIGUE vivo:** `webhook.js` (líneas 73-80) llama a Railway con los datos de nacimiento pero **NO le pasa `pedido.id`** → Railway no sabe qué fila actualizar. Es el mismo desync de la Fase 5, ahora en versión Hotmart. Bloquea cualquier descarga web futura.

**Pendiente para el vestíbulo (descarga web, NO empezado):** bucket `reportes`; columnas `progreso`/`pdf_path` (paid es redundante con status); pasar `pedido.id` a Railway; Railway sube PDF + marca `completed`; reescribir `check-status.js`/`download-report.js` a REST; `reporte.html`. **No urgente** — hoy el cliente recibe el PDF por email.

**⚠️ NO borrar la tabla `pedidos`:** está en uso en producción (`guardar-pedido.js` inserta en cada visita). Cambios de schema solo con `ALTER`.

**Decisión registrada:** D-010 (Hotmart como procesador, revierte la recomendación cripto/NOWPayments del ROADMAP Fase 0).

---

## 2026-06-18 — Auditoría de realidad y capa de proceso

**Qué se hizo:**
- Se trazó el flujo real del sistema leyendo el código (no la doc, que estaba desincronizada).
- Se reescribió `CLAUDE.md` para reflejar el flujo Netlify→Railway real.
- Se crearon `docs/ROADMAP.md`, `docs/PROGRESS.md`, `docs/DECISIONS.md` (estándar portado de shem72-studio).
- Se absorbió `IM_CONSULTING_AVANCE_SESION_OPTIMIZATION.md` en este log y se eliminó.

**Hallazgos clave (la doc mentía):**
- El motor canónico es `railway/app.js`, no las Netlify Functions. Netlify solo sirve el sitio
  estático y cobra Stripe (`api/webhook.js`); Railway genera (sin timeout).
- El flujo pago→reporte **ya está cableado end-to-end** (checkout → webhook → handoff Railway).
- No existe listener de webhook de Stripe: el cobro es síncrono dentro de `webhook.js`.
- Mucho de `api/` es código muerto del flujo Netlify viejo (ver ROADMAP, limpieza).
- **Regresión:** las optimizaciones de mayo (caché de bloques, tracking de tokens, compresión
  de dataset) viven en `api/generate-report.js` + `engine/`, que ya no se usan. Solo la
  auditoría (`api/audit-bloque.js`) sobrevivió a Railway. Railway no cachea ni trackea tokens.

**Verificación Fase 1 (parcial):** Railway `/health`→200, Netlify sitio→200, función webhook→405 a GET.
Falta (solo Isaac, dashboards): `ADMIN_SECRET` igual en ambas plataformas, Stripe en modo live, pago e2e real.

**Limpieza Fase 3 (commit 37d8c72):** borrado el flujo Netlify muerto (`generate-report`,
`admin-report*`, `send-email`, `template-injector`, `html-to-pdf`, `compute_dataset/`, `api/api/`);
`webhook.js` reducido a solo el handler vivo; `netlify.toml` sin la función Python; scripts one-off
movidos a `scripts/`. Smoke test local: `webhook.js` carga OK, los 6 api/ vivos pasan `node --check`.
⚠️ Este cambio toca el camino de pago → **no deployar hasta hacer redeploy + smoke test + pago de prueba.**

**Dominio + email (sesión tarde):** DNS y SSL de `im-consulting.me` activos (DNS autoritativo en
**Cloudflare**, no Netlify pese al panel). Dominio verificado en **Resend** → `sendEmail()` cambiado
a **Resend primario** desde `reportes@im-consulting.me` (Gmail ya no se necesita; queda como fallback
opcional). Ver D-008. `.env.railway` listo con valores reales (sin Gmail). URLs del checkout pasadas
a rutas relativas. Pendiente: setear vars en dashboards (ADMIN_SECRET igual en ambos) + push + test e2e.

**🚫 BLOQUEO CRÍTICO (fin de sesión):** Stripe **cerró la cuenta** por categoría prohibida
(videntes/astrología). Todo el cobro está caído. No reintentar Stripe/PayPal/Square. Se registró
en D-009 y se creó ROADMAP Fase 0 (desbloquear cobro). Investigación de procesadores high-risk en
curso (QuadraPay, Corepay, PayDiverse, etc.; alternativas: Gumroad/Payhip/cripto). Riesgo de
portafolio: elohim-calculator (mismo Stripe) y shem72 si monetiza. Cobro interino: ninguno por ahora.

**Pendiente:** ver `docs/ROADMAP.md` (Fase 0 es la máxima prioridad).

---

## 2026-05-15 (Sesión 2) — Optimización de tokens [flujo Netlify, hoy mayormente superseded]

> Nota 2026-06-18: este trabajo se hizo sobre `api/generate-report.js` + `engine/`, que dejaron
> de ser el flujo de producción tras la migración a Railway. Se conserva como historia.

- Cambio Opus → Sonnet-4-6: ~80% de ahorro en costo de API.
- Auditoría automática de bloques contra 8 criterios skill-voz-im (`api/audit-bloque.js`).
  → **único componente que sobrevivió a Railway.**
- Caché de bloques por bloque+signo+edad en `/tmp/` (`api/cache-bloques.js`). → no está en Railway.
- Tracking de tokens en `/tmp/consumo_tokens.jsonl` (`api/track-tokens.js`). → no está en Railway.
- Compresión automática de datasets (`engine/compress_dataset.py`). → no está en Railway.
- Resultado reportado entonces: 73% reducción de tokens (45,000 → 12,000), margen 96% → 99.6%.
- Commits: e2e84e1, db04413, d0b533b.
