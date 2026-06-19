# ROADMAP — IM Consulting

> Fases con checkboxes. Prioridad = qué desbloquea producción. Al completar un item, marca el
> checkbox y registra el avance en `docs/PROGRESS.md`. Decisiones de arquitectura → `docs/DECISIONS.md`.

**Estado general:** el flujo técnico funciona end-to-end, PERO el cobro está **BLOQUEADO**:
Stripe cerró la cuenta por categoría prohibida (ver Fase 0). Hasta resolver el procesador, no hay
go-live de pagos. El resto (dominio, email, limpieza) sí está listo.

## Fase 0 — 🚫 DESBLOQUEAR EL COBRO (máxima prioridad — sin esto no hay negocio)

> Stripe cerró la cuenta (videntes/astrología, prohibido). No reintentar Stripe/PayPal/Square.
> Ver `docs/DECISIONS.md` D-009.

- [ ] Verificar si **elohim-calculator** cobra por la misma cuenta de Stripe (estaría caído también)
- [ ] Revisar si Stripe retiene fondos y cómo/cuándo se liberan
- [ ] Elegir procesador "high-risk" que acepte la categoría con pagos globales (investigación en curso)
- [ ] Confirmar de cada candidato: onboarding México · comisión+reserva · integración (API vs hosted) · payout
- [ ] Integrar el nuevo procesador en `api/webhook.js` + `public/checkout.html` (motor Railway sin cambios)
- [ ] Decidir si conviene checkout hosted (simplifica `checkout.html`) o API directa

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

## Fase 5 — Bugs conocidos de persistencia y seguimiento (entrega depende solo del email hoy)

- [ ] **ID desincronizado:** `webhook.js` da al cliente un `crypto.randomUUID()`, pero Railway
      genera otro `admin-xxxxx` (`app.js:426`). El cliente nunca puede consultar su reporte por ID.
- [ ] **`/tmp` efímero:** Railway guarda `reporte-{id}.{html,json,pdf}` en `/tmp`, que se borra en
      cada redeploy/reinicio. Si el email falla, el reporte se pierde.
- [ ] **`check-status.js`/`download-report.js` rotos:** leen el `/tmp` de Netlify, pero el reporte
      vive en el `/tmp` de Railway → no encuentran nada.
- [ ] Plan acordado previo: persistencia en Supabase + sync de ID + página web tokenizada de reporte
      (en vez de depender 100% del email). Evaluar contra YAGNI según volumen real de clientes.

## Fase 6 — Tests mínimos del camino del dinero

- [ ] Validación de plan/precio server-side en `webhook.js` (rechaza plan inválido, no confía en monto del cliente)
- [ ] Handoff a Railway: maneja fallo de Railway sin perder el cobro (ya devuelve id_pedido — testearlo)
- [ ] Railway genera N bloques correctos por plan (14 esencial / 20 completo)
- [ ] Auditoría con reintentos no entra en loop infinito (tope de 4 — testearlo)
