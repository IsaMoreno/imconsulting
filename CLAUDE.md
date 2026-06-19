# IM Consulting — Contexto para Claude

## Regla de continuidad (CRÍTICA)
Este proyecto avanza a lo largo de varias sesiones. Por eso:
- **Al iniciar:** lee este archivo + `docs/PROGRESS.md` (estado actual) + `docs/ROADMAP.md` (fase activa).
- **Al cerrar:** agrega una entrada a `docs/PROGRESS.md` y marca checkboxes en `docs/ROADMAP.md`.
  Si tomaste una decisión de arquitectura, regístrala en `docs/DECISIONS.md`.
- **No asumas contexto de sesiones anteriores.** Lo único confiable es lo escrito en esos docs.
- **Verifica el flujo en el código antes de asumir** que esta doc o un diagrama es correcto
  (esta doc ya estuvo gravemente desincronizada una vez — ver PROGRESS 2026-06-18).

## 🚫 BLOQUEO ACTIVO — cobro caído (2026-06-18)
Stripe **cerró la cuenta** por categoría prohibida (videntes/astrología). El flujo de pago de
abajo describe la arquitectura, pero **el cobro con Stripe NO funciona** y no debe reintentarse.
Migración a procesador "high-risk" pendiente (ver `docs/ROADMAP.md` Fase 0 y `DECISIONS.md` D-009).
Cuando se elija procesador, solo cambian `api/webhook.js` + `public/checkout.html`.

## Qué es este proyecto
Plataforma de reportes de autoconocimiento personalizados. El cliente paga en Stripe y el
sistema genera un reporte con bloques narrativos (Claude Sonnet-4-6) y se lo envía por correo
en PDF. Isaac no interviene en el flujo automatizado.

## Flujo real (VERIFICADO en código — 2026-06-18)
```
public/checkout.html  (Netlify, sitio estático)
  └─ POST /.netlify/functions/webhook            [api/webhook.js — Netlify]
       · valida plan+email · cobra Stripe PaymentIntent server-side ($55=5500 / $111=11100)
       · handoff → POST {RAILWAY_URL}/admin-report  (header X-Admin-Secret)
       · responde 200 {id_pedido}
  └─ POST /admin-report                           [railway/app.js — Railway, el MOTOR]
       · responde 202 inmediato, procesa en background (sin timeout)
       · buildDataset() inline: signo solar + numerología en JS puro (NO usa Python)
       · callBloque() ×14 (esencial) o ×20 (completo) con Sonnet-4-6
            - bloques de transformación (B2.*): FASE A plan interno + FASE B composición
            - auditoría (api/audit-bloque.js, 8 criterios) con hasta 4 reintentos
       · buildPrintHtml() inline → generatePdf() (Puppeteer + Chromium del Dockerfile)
       · guarda en /tmp antes de enviar (nunca se pierde)
       · sendEmail() Resend desde reportes@im-consulting.me (Gmail opcional fallback), PDF adjunto + copia a Isaac
```

**Dos plataformas, dos roles:**
- **Netlify** = sitio estático (checkout) + cobro Stripe. Timeout corto → solo cobra.
- **Railway** = motor de generación pesada (Express + Docker + Chromium). Sin timeout.

**Importante:** NO hay listener de webhook de Stripe. El cobro es síncrono dentro de
`api/webhook.js` (el nombre es heredado y engañoso). Ver `docs/DECISIONS.md` D-006.

## Dos planes
- **$55 Esencial** — 14 bloques (`SECUENCIA_55` en railway/app.js)
- **$111 Completo** — 20 bloques (`SECUENCIA_111`)

## Stack técnico
- **Railway** (Express + Docker) — `railway/app.js`, el motor real
- **Netlify** — sitio estático `public/` + función `api/webhook.js` (cobro Stripe)
- **Claude API Sonnet-4-6** con prompt caching + auditoría de voz
- **Stripe** — cobro síncrono · **Puppeteer + Chromium** — PDF · **Gmail/Resend** — email

## Archivos clave (flujo de producción)
| Archivo | Rol | Estado |
|---|---|---|
| railway/app.js | Motor: dataset + bloques + auditoría + PDF + email | ✅ Vivo (canónico) |
| api/webhook.js | Netlify: cobra Stripe y hace handoff a Railway | ✅ Vivo (tiene código muerto adentro) |
| api/audit-bloque.js | Auditoría de bloques (8 criterios), la usa Railway | ✅ Vivo |
| public/checkout.html | Página de pago, llama a la función webhook | ✅ Vivo |
| prompts/*.md, prompts/03_ARBOL.json | Capas del prompt (CORE, ZOHAR, KABBALAH, TRANSFORMACION, árbol) | ✅ Vivo |

## Código muerto / legacy (NO es el flujo real — pendiente de limpieza, ver ROADMAP Fase 3)
- Flujo Netlify viejo en `api/`: `template-injector.js`, `html-to-pdf.js`, `send-email.js`,
  `admin-report.js`, `admin-report-background.js`, `generate-report.js`, `compute_dataset/`
- Dentro de `api/webhook.js`: imports líneas 17-19 + funciones `buildDataset`/`geocodificar`/
  `resolverTimezone`/`generarHtmlDeBloques`/`esc` que el handler ya no llama
- Solo para uso local (script manual `generate-elizabeth.js`): `api/cache-bloques.js`, `api/track-tokens.js`
- Scripts sueltos en raíz: `patch-*.js`, `generate-pdf-local.js(.bak)`, `integrar-graficos.js`, etc.

## Skills a invocar en este proyecto
| Contexto | Skill |
|---|---|
| Cualquier código que use `@anthropic-ai/sdk` | `claude-api` — verificar parámetros, modelos y pricing |
| Bug o comportamiento inesperado | `superpowers:systematic-debugging` |
| Nueva funcionalidad o integración | `superpowers:brainstorming` |
| Antes de marcar algo como listo | `superpowers:verification-before-completion` |
| Auditar bloques o voz narrativa | `anthropic-skills:skill-voz-im` |

## Reglas al trabajar en este proyecto
- Verifica el flujo real en el código antes de asumir que la doc es correcta.
- El motor es `railway/app.js`, NO las Netlify Functions. El dataset se arma inline en JS, no en Python.
- Usa `claude-api` skill antes de cambiar modelo, parámetros o estructura de llamadas a Claude.
- Usa `codegraph_*` tools antes de grep/read para preguntas estructurales.
