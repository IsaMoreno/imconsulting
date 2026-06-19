# DEPLOYMENT — IM Consulting

Guía de despliegue a producción. El sistema corre en **dos plataformas** (ver `CLAUDE.md`):
- **Netlify** — sitio estático (`public/`) + función de cobro `api/webhook.js`
- **Railway** — motor de generación `railway/app.js` (Docker + Chromium, sin timeout)

> NO hay listener de webhook de Stripe: el cobro es síncrono dentro de `webhook.js` (ver
> `docs/DECISIONS.md` D-006). No configures un endpoint de webhook en Stripe.

## Pre-requisitos
- Cuenta Netlify (conectada al repo) y proyecto Railway desplegado
- Dominio `im-consulting.me` (DNS en Netlify DNS)
- Stripe (keys), Gmail (app password) y Resend (fallback)

## 1. Variables de entorno
**Netlify** (Site settings → Environment):
- `STRIPE_SECRET_KEY`, `ADMIN_SECRET`, `RAILWAY_URL`, `SITE_URL=https://im-consulting.me`

**Railway** (Variables):
- `ANTHROPIC_API_KEY`, `ADMIN_SECRET`, `GMAIL_USER`, `GMAIL_PASS`, `RESEND_API_KEY`, `ISAAC_EMAIL`, `REPORT_EMAIL_FROM`

> ⚠️ `ADMIN_SECRET` debe ser **idéntico** en Netlify y Railway. Si no coinciden, el handoff
> devuelve 401 y el cliente paga sin recibir reporte.

## 2. Dominio
- Netlify DNS gestiona `im-consulting.me` (primario) y `www` (redirige al primario).
- Netlify emite el SSL automáticamente al activar el dominio.

## 3. Deploy
- `git push` a `main` → Netlify redeploya solo. Railway redeploya por su cuenta según su trigger.

## 4. Verificación (primero en modo TEST de Stripe)
1. GET a `https://im-consulting.me/.netlify/functions/webhook` → debe dar **405**.
2. `GET https://<railway>/health` → `{"status":"ok"}`.
3. Pago con tarjeta de prueba `4242 4242 4242 4242` → confirmar que llega el correo con PDF.

## 5. Go live
- Cambiar a Stripe **live**: `STRIPE_SECRET_KEY` (Netlify) y la publishable key `pk_live_...`
  en `public/checkout.html`.
- Redeploy → 1 pago real chico de prueba.

## Rollback
```
git revert <commit_hash>
git push   # Netlify auto-deploya en 2-3 min
```
