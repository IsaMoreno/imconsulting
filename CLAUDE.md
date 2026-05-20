# IM Consulting — Contexto para Claude

## Qué es este proyecto
Plataforma de reportes de autoconocimiento personalizados. Cliente paga en Stripe →
sistema genera reporte con bloques narrativos usando Claude Sonnet-4-6 →
envía email con link de descarga. Isaac no interviene en el flujo automatizado.

## Flujo real del sistema (VERIFICADO con CodeGraph)
```
Cliente paga (Stripe)
→ webhook.js
→ generate-report.js (genera 14 o 20 bloques con Claude Sonnet-4-6)
→ generarHtmlDeBloques() [función interna de webhook.js]
→ send-email.js (Resend)
→ ✅ Email al cliente
```

## Lo que NO hace webhook.js
- NO llama a template-injector.js
- NO llama a html-to-pdf.js
- NO llama a dataset.py directamente (el dataset se arma inline dentro de webhook.js)

## Dos planes
- **$55 Esencial** — 14 bloques
- **$111 Completo** — 20 bloques

## Stack técnico
- **Netlify Functions** (Node.js) — api/
- **Python 3.11** — engine/ (cálculos astrológicos, numerología, Matriz del Destino)
- **Claude API Sonnet-4-6** con prompt caching + auditoría de voz
- **Stripe** — pagos
- **Resend** — envío de emails

## Archivos clave
| Archivo | Rol | Estado |
|---|---|---|
| api/webhook.js | Orquestador principal del flujo | ✅ Completo |
| api/generate-report.js | Genera bloques narrativos con Claude | ✅ Completo |
| api/send-email.js | Envía email con Resend | ✅ Completo |
| api/audit-bloque.js | Audita calidad de bloques (8 criterios) | ✅ Completo |
| api/cache-bloques.js | Caché de bloques por signo+edad | ✅ Completo |
| api/track-tokens.js | Tracking de consumo y costo | ✅ Completo |
| api/template-injector.js | Inyector HTML — existe pero NO integrado aún | ⚠️ Pendiente |
| api/html-to-pdf.js | Conversor PDF — existe pero NO integrado aún | ⚠️ Pendiente |
| engine/dataset.py | Cálculos astrológicos y numerológicos | ✅ Completo |
| engine/compress_dataset.py | Compresión automática de datasets | ✅ Completo |

## Optimizaciones implementadas (Sesión 2 — 15 May 2026)
- Cambio Opus → Sonnet: 80% ahorro en costo API
- Auditoría automática de bloques (8 criterios skill-voz-im)
- Caché de bloques en /tmp/ por número+signo+edad
- Tracking de tokens en /tmp/consumo_tokens.jsonl
- Compresión automática de datasets (3-7% ahorro)
- **Resultado:** 73% reducción de tokens (45,000 → 12,000 por reporte)

## Pendiente
- Integrar template-injector.js y html-to-pdf.js al flujo de webhook.js
- Deploy a producción en Netlify
- Configurar dominio imconsulting.me
- Configurar Stripe webhook en producción

## Reglas al trabajar en este proyecto
- Siempre usar codegraph_* tools antes de grep o read para preguntas estructurales
- Verificar flujo real en el código antes de asumir que el diagrama en docs es correcto
- El dataset se construye inline en webhook.js, no desde dataset.py en el flujo automatizado
