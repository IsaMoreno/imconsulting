# PROGRESS — IM Consulting

> Log de estado multi-sesión. Lo más reciente arriba. Al cerrar sesión: agrega una entrada
> con fecha, qué se hizo, qué quedó pendiente y decisiones tomadas. El único estado confiable
> es lo que está aquí escrito. Si no está documentado, no pasó.

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

**Pendiente:** ver `docs/ROADMAP.md`.

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
