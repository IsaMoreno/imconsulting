# IM Consulting — Contexto para Claude

## Regla de continuidad (CRÍTICA)
Este proyecto avanza a lo largo de varias sesiones. Por eso:
- **Al iniciar:** lee este archivo + `docs/PROGRESS.md` (estado actual) + `docs/ROADMAP.md` (fase activa).
- **Al cerrar:** agrega una entrada a `docs/PROGRESS.md` y marca checkboxes en `docs/ROADMAP.md`.
  Si tomaste una decisión de arquitectura, regístrala en `docs/DECISIONS.md`.
- **No asumas contexto de sesiones anteriores.** Lo único confiable es lo escrito en esos docs.
- **Verifica el flujo en el código antes de asumir** que esta doc o un diagrama es correcto
  (esta doc ya estuvo gravemente desincronizada una vez — ver PROGRESS 2026-06-18).

## Estado del cobro — migrado a Hotmart (2026-06-26, D-010)
Stripe cerró la cuenta por categoría prohibida (videntes/astrología) — ver `DECISIONS.md` D-009.
El cobro **se migró a Hotmart** (D-010); el flujo de abajo ya es el real. Falta la verificación
e2e de un pago Hotmart real y setear env vars en Netlify (`SUPABASE_URL`, `SUPABASE_SECRET_KEY`,
`HOTMART_HOTTOK`). Ver `docs/ROADMAP.md` Fase 0. **No reintentar Stripe.**

## Qué es este proyecto
Plataforma de reportes de autoconocimiento personalizados. El cliente paga en Hotmart y el
sistema genera un reporte con bloques narrativos (Claude Sonnet-4-6) y se lo envía por correo
en PDF. Isaac no interviene en el flujo automatizado.

## Flujo real (VERIFICADO en código — 2026-06-27)
```
public/checkout.html  (Netlify, sitio estático)
  └─ POST /.netlify/functions/guardar-pedido     [api/guardar-pedido.js — Netlify]
       · valida datos de nacimiento + email
       · inserta fila en Supabase tabla `pedidos` (status='pending')  [REST, no SDK]
       · responde { hotmart_url } → el browser redirige al checkout de Hotmart
  └─ Hotmart procesa el pago → envía webhook PURCHASE_APPROVED
  └─ POST /.netlify/functions/webhook            [api/webhook.js — Netlify]
       · valida header x-hotmart-hottok
       · busca el pedido en Supabase por email + status=pending
       · handoff → POST {RAILWAY_URL}/admin-report  (header X-Admin-Secret)
       · marca status='processing' + guarda hotmart_transaction
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
- **Netlify** = sitio estático (checkout) + funciones de cobro (guardar-pedido + webhook Hotmart). Timeout corto.
- **Railway** = motor de generación pesada (Express + Docker + Chromium). Sin timeout.

**Importante:** el cobro lo hace **Hotmart** (plataforma externa); Netlify solo guarda el pedido
y reacciona al webhook `PURCHASE_APPROVED`. El "webhook" de Stripe síncrono (D-006) ya NO existe.

**Gap conocido (Fase 5):** `webhook.js` no le pasa el `id` del pedido a Railway → Railway no puede
actualizar la fila de `pedidos`. Bloquea la descarga web futura (vestíbulo). Hoy la entrega es solo email.

## Dos planes
- **$55 Esencial** — 14 bloques (`SECUENCIA_55` en railway/app.js)
- **$111 Completo** — 20 bloques (`SECUENCIA_111`)

## Stack técnico
- **Railway** (Express + Docker) — `railway/app.js`, el motor real
- **Netlify** — sitio estático `public/` + funciones `guardar-pedido.js` + `webhook.js` (cobro Hotmart)
- **Supabase** — tabla `pedidos` (persistencia de pedidos), vía REST API directa (NO el SDK)
- **Hotmart** — procesador de cobro (checkout externo + webhook `PURCHASE_APPROVED`)
- **Claude API Sonnet-4-6** con prompt caching + auditoría de voz
- **Puppeteer + Chromium** — PDF · **Gmail/Resend** — email

## Archivos clave (flujo de producción)
| Archivo | Rol | Estado |
|---|---|---|
| railway/app.js | Motor: dataset + bloques + auditoría + PDF + email | ✅ Vivo (canónico) |
| api/guardar-pedido.js | Netlify: guarda pedido en Supabase + redirige a Hotmart | ✅ Vivo |
| api/webhook.js | Netlify: recibe PURCHASE_APPROVED de Hotmart + handoff a Railway | ✅ Vivo |
| api/audit-bloque.js | Auditoría de bloques (8 criterios), la usa Railway | ✅ Vivo |
| public/checkout.html | Página de captura de datos, llama a guardar-pedido | ✅ Vivo |
| prompts/*.md, prompts/03_ARBOL.json | Capas del prompt (CORE, ZOHAR, KABBALAH, TRANSFORMACION, árbol) | ✅ Vivo |

## Código muerto / legacy (NO es el flujo real — pendiente de limpieza, ver ROADMAP Fase 3)
- Flujo Netlify viejo en `api/`: `template-injector.js`, `html-to-pdf.js`, `send-email.js`,
  `admin-report.js`, `admin-report-background.js`, `generate-report.js`, `compute_dataset/`
- `api/check-status.js` + `api/download-report.js`: rotos (leen `/tmp` de Netlify). Se reescriben
  si se construye el vestíbulo (ROADMAP Fase 5), si no, candidatos a borrar.
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
