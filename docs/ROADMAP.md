# ROADMAP — IM Consulting

> Fases con checkboxes. Prioridad = qué desbloquea producción. Al completar un item, marca el
> checkbox y registra el avance en `docs/PROGRESS.md`. Decisiones de arquitectura → `docs/DECISIONS.md`.

**Estado general:** el flujo técnico funciona end-to-end. El cobro se **migró a Hotmart** (D-010,
2026-06-26), superando el bloqueo de Stripe. Falta la verificación e2e real de un pago Hotmart.
El resto (dominio, email, limpieza) está listo.

## Fase 0 — ✅ COBRO MIGRADO A HOTMART (D-010) — falta verificación e2e

> Stripe cerró la cuenta (videntes/astrología). En vez del carril cripto/NOWPayments que se
> recomendaba aquí, se eligió **Hotmart**. Ver `docs/DECISIONS.md` D-009 (Stripe) y D-010 (Hotmart).

- [x] Integrar el procesador en `api/webhook.js` + `public/checkout.html` — 2026-06-26 (Hotmart, commit f5c2c9a)
- [x] Persistencia de pedidos en Supabase (`api/guardar-pedido.js`, tabla `pedidos`) — 2026-06-26
- [ ] Setear env vars en Netlify: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `HOTMART_HOTTOK`
- [ ] Configurar el producto/checkout en el dashboard de Hotmart + el webhook `PURCHASE_APPROVED`
- [ ] **Prueba e2e real:** compra Hotmart (sandbox) → fila en `pedidos` → reporte llega por correo
- [ ] Verificar si **elohim-calculator** (mismo Stripe) sigue caído y si migra también a Hotmart

**Investigación de procesadores previa (2026-06-18) — superada por D-010, se conserva como historia:**
- Tarjetas (US y MX) **todas prohíben la categoría**: Stripe, PayPal, Square, Gumroad, Lemon Squeezy,
  **Conekta ("esoterismo")**. Mercado Pago/Openpay muy probable igual. Card rails = cerrado.
- Excepciones (adquirente regional laxo / cuenta high-risk) **requieren entidad registrada** → bloqueadas
  hasta tener RFC.
- **Cripto = único carril abierto sin entidad.** Recomendado: **NOWPayments** (0.5-1%, sin KYC crypto-only,
  IPN webhook + REST, encaja en webhook.js). Coinbase Commerce DESCARTADO (cerró México mar-2026).
  BTCPay = gratis pero self-hosted.
- Flujo: cliente paga USDT → NOWPayments IPN → Netlify → Railway → off-ramp a pesos vía **Bitso**.
- Caveat: cripto encoge el mercado (audiencia en español, pocos pagan cripto). Plan híbrido:
  cripto ya + tarjeta vía entidad+high-risk después.
- Competencia destiny-matrix.online usa adquirente regional (MonoBank, ucraniano) → no replicable desde MX.

> ⚠️ Las fases 1-2 de Stripe abajo quedan EN PAUSA hasta resolver Fase 0.

---

## Fase 1 — Confirmar que producción está viva (DESBLOQUEANTE)

- [x] Verificar deploy de Netlify (sitio 200 + función `webhook` 405 a GET) en `imconsulting.netlify.app` — 2026-06-18
- [x] Verificar deploy de Railway (`/health` → 200 `{"status":"ok"}`) y que el código apunta a `imconsulting-production.up.railway.app` — 2026-06-18
- [ ] Confirmar variables de entorno en ambas plataformas:
      Netlify: `STRIPE_SECRET_KEY`, `ADMIN_SECRET`, `RAILWAY_URL` ·
      Railway: `ANTHROPIC_API_KEY`, `ADMIN_SECRET`, `GMAIL_USER`, `GMAIL_PASS`, `RESEND_API_KEY`, `ISAAC_EMAIL`
- [ ] Confirmar Stripe en modo **live** (no test keys)
- [ ] Prueba end-to-end real: un pago de prueba → reporte llega por correo con PDF

## Fase 2 — Dominio (im-consulting.me)

> Dominio comprado: **`im-consulting.me`** (con guion; `imconsulting.me` estaba ocupado).
> Ojo: varias referencias en código/docs dicen `imconsulting.me` sin guion → hay que corregirlas.

- [x] Apuntar `im-consulting.me` a Netlify (Netlify DNS, primario + www) — 2026-06-18; SSL emitiéndose
- [x] `public/checkout.html` — `WEBHOOK_URL` ahora relativo — 2026-06-18
- [x] `public/confirmation.html` — `WEBHOOK_URL` relativo + soporte `support@im-consulting.me` — 2026-06-18
- [x] `api/webhook.js` — `return_url` ya usa `SITE_URL` (basta con setear la env var)
- [x] `DEPLOYMENT.md` — reescrito al flujo real con dominio correcto — 2026-06-18
- [ ] **tú:** setear `SITE_URL=https://im-consulting.me` como env var en Netlify
- [ ] **tú:** configurar buzón/reenvío de `support@im-consulting.me` (si no, los correos de soporte se pierden)
- [ ] Opcional: `REPORT_EMAIL_FROM` (Railway) con dominio propio si quieres `from` con marca (hoy sale por Gmail)

## Fase 3 — Limpieza de código muerto (evita que la doc se vuelva a desincronizar)

- [x] Borrar flujo Netlify viejo en `api/` + dir anidado `api/api/` — 2026-06-18 (commit 37d8c72)
- [x] Limpiar imports y funciones muertas dentro de `api/webhook.js` — 2026-06-18
- [x] Mover scripts sueltos de raíz a `scripts/` (gitignored) — 2026-06-18
- [ ] **PENDIENTE verificar tras deploy:** este cambio toca `webhook.js`+`netlify.toml` → necesita
      redeploy de Netlify + smoke test (función webhook responde 405 a GET) + 1 pago de prueba
- [ ] `netlify.toml` aún tiene `pip install -r requirements.txt` en build, ya vestigial (no quedan funciones Python)
- [ ] Decidir destino de `generate-elizabeth.js` (herramienta admin manual, hoy untracked en raíz)

## Fase 4 — Recuperar optimizaciones perdidas en la migración a Railway

- [ ] Re-integrar tracking de tokens en `railway/app.js` (visibilidad de costo por reporte)
- [ ] Evaluar si vale re-integrar caché de bloques (solo si hay volumen de clientes con mismo signo+edad)
- [ ] `compress_dataset` no aplica: Railway arma el dataset inline y es pequeño → descartar

## Fase 5 — Vestíbulo web / descarga (persistencia parcial ya hecha; entrega depende del email hoy)

> Actualizado 2026-06-27: la migración Hotmart ya metió Supabase (tabla `pedidos`) para la mitad
> delantera del flujo. El plan `2026-06-12-persistencia-sync-vestibulo.md` quedó OBSOLETO (asumía
> Stripe/SDK/`reports`); si se retoma, reescribir adaptado a Hotmart/REST/`pedidos`.

> **Resuelto 2026-06-27 (D-011, llm-council):** el vestíbulo web completo se DESCARTA por YAGNI
> (el email ya entrega). Se hizo solo el keystone + persistencia. Rama `feat/persistencia-pedido-id`.

- [x] **Gap del `pedido.id` cerrado (los dos lados):** `webhook.js` manda `id`; `railway/app.js`
      lo usa en vez de generar el suyo (que ignoraba el entrante) — 2026-06-27
- [x] **`/tmp` efímero mitigado:** Railway sube el PDF al bucket `reportes/{id}.pdf` — 2026-06-27
- [x] **Railway marca `status` en `pedidos`** (`completed`/`failed`; antes quedaba en `processing`) — 2026-06-27
- [ ] **tú (dashboards) para cerrar e2e:** Railway env `SUPABASE_URL`+`SUPABASE_SECRET_KEY`; Supabase
      bucket privado `reportes`; luego deploy + 1 pago sandbox → verificar fila `completed` + objeto en bucket
- [ ] ~~`check-status.js`/`download-report.js` + `reporte.html` + columna `pdf_path`~~ **DESCARTADO (D-011)**
      — retomar solo si ≈10% de clientes piden portal o el email se vuelve problema de soporte

## Fase 6 — Tests mínimos del camino del dinero

- [ ] Validación de plan/precio server-side en `webhook.js` (rechaza plan inválido, no confía en monto del cliente)
- [ ] Handoff a Railway: maneja fallo de Railway sin perder el cobro (ya devuelve id_pedido — testearlo)
- [ ] Railway genera N bloques correctos por plan (14 esencial / 20 completo)
- [ ] Auditoría con reintentos no entra en loop infinito (tope de 4 — testearlo)
