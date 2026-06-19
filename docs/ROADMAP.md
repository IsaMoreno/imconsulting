# ROADMAP — IM Consulting

> Fases con checkboxes. Prioridad = qué desbloquea producción. Al completar un item, marca el
> checkbox y registra el avance en `docs/PROGRESS.md`. Decisiones de arquitectura → `docs/DECISIONS.md`.

**Estado general:** el flujo pago→reporte ya funciona end-to-end (checkout → Stripe → Railway →
PDF por email). Lo que falta es confirmar producción, limpiar deuda y blindar el camino del dinero.

---

## Fase 1 — Confirmar que producción está viva (DESBLOQUEANTE)

- [x] Verificar deploy de Netlify (sitio 200 + función `webhook` 405 a GET) en `imconsulting.netlify.app` — 2026-06-18
- [x] Verificar deploy de Railway (`/health` → 200 `{"status":"ok"}`) y que el código apunta a `imconsulting-production.up.railway.app` — 2026-06-18
- [ ] Confirmar variables de entorno en ambas plataformas:
      Netlify: `STRIPE_SECRET_KEY`, `ADMIN_SECRET`, `RAILWAY_URL` ·
      Railway: `ANTHROPIC_API_KEY`, `ADMIN_SECRET`, `GMAIL_USER`, `GMAIL_PASS`, `RESEND_API_KEY`, `ISAAC_EMAIL`
- [ ] Confirmar Stripe en modo **live** (no test keys)
- [ ] Prueba end-to-end real: un pago de prueba → reporte llega por correo con PDF

## Fase 2 — Dominio

- [ ] Apuntar `imconsulting.me` a Netlify
- [ ] Actualizar `WEBHOOK_URL` en `public/checkout.html` (hoy hardcodea `imconsulting.netlify.app`)
      y `return_url`/`SITE_URL` en `api/webhook.js`

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
