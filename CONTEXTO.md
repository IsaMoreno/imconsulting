# IM Consulting — Contexto del Proyecto

## Qué es
Plataforma de reportes de autoconocimiento personalizados. Isaac recopila datos del cliente (fecha/hora/lugar de nacimiento, contexto biográfico), y el sistema genera un reporte narrativo en español usando múltiples disciplinas (astrología, numerología, Matriz del Destino, Kabbalah, etc.) como andamiaje invisible — nunca nombradas en el texto.

## Dos planes
- **$55 Esencial** — 14 bloques
- **$111 Completo** — 20 bloques

## Dos flujos
- **Manual** — Isaac trabaja bloque por bloque con Claude. Máximo 2 bloques por sesión para mantener calidad.
- **Automatizado** — Cliente paga en Stripe → sistema genera el reporte completo solo → envía PDF por email (Resend). Isaac no interviene.

## Stack técnico
- **Netlify** — hosting y funciones serverless
- **Claude API (Anthropic)** — generación de bloques con prompt caching
- **Stripe** — pagos y webhooks
- **Resend** — envío de emails
- **Python** — motor de cálculo (carta natal, Matriz, numerología)
- **Node.js** — función que orquesta las llamadas a Claude

## Estado actual
| Componente | Estado |
|---|---|
| Prompts del sistema (voz, reglas, bloques) | Completo |
| Motor Python (cálculos astrológicos) | Completo |
| Función generate-report.js (genera bloques) | Completo |
| Webhook Stripe | Pendiente |
| Ensamblador PDF desde template Word (.docx) | En desarrollo |
| Función envío email con PDF | Pendiente |

## Siguiente paso acordado
Construir el ensamblador PDF: Python toma el template `.docx` con marcadores (`{{B1}}`, `{{nombre}}`, etc.), reemplaza con los bloques generados por Claude, y convierte a PDF listo para enviar.

---

*IM Consulting · Uso Interno · 2026*
