\# IM Consulting — Sistema de Reportes Automatizado



Sistema completamente automatizado que genera reportes personalizados de autoconocimiento en PDF. Cliente paga → recibe PDF en minutos.



\## 🎯 Stack Tecnológico



\- \*\*Frontend:\*\* HTML/CSS estático en Netlify

\- \*\*Backend:\*\* Netlify Functions (Node.js)

\- \*\*Motor de datos:\*\* Python 3.11 (astrología, numerología, matriz)

\- \*\*PDF:\*\* Puppeteer + Chrome local

\- \*\*Email:\*\* Resend API

\- \*\*Pago:\*\* Stripe

\- \*\*CMS:\*\* Ninguno (serverless)



\## 📊 Arquitectura



Cliente paga (Stripe) → webhook.js → generate-report.js (Claude) → generarHtmlDeBloques() → send-email.js (Resend) → ✅ Email con link de descarga



\## 🚀 Características



\- ✅ \*\*0 tokens de Claude por reporte\*\* — 100% template-driven

\- ✅ \*\*<30 segundos de generación\*\* — Puppeteer + Node.js local

\- ✅ \*\*$0.00 costo variable\*\* — Margen 100%

\- ✅ \*\*Escalable\*\* — 100+ reportes simultáneos

\- ✅ \*\*Personalizable\*\* — Datos reales del cliente



\## 📁 Estructura del Proyecto

imconsulting/

├── api/                     # Netlify Functions

├── engine/                  # Python scripts

├── prompts/                 # Metodología

├── templates/               # HTML maestro

├── tests/                   # Tests automatizados

└── ...



\## 🔧 Instalación Local



```bash

git clone https://github.com/IsaMoreno/imconsulting.git

cd imconsulting

npm install puppeteer-core

pip install --break-system-packages kerykeion pytz reportlab

cp .env.example .env

```



\## 🧪 Tests



```bash

node tests/test-validation-visual.js

node tests/test-performance.js

node tests/test-webhook.js

```



\## 📈 Métricas



| Métrica | Valor |

|---------|-------|

| Tiempo generación | 4.20s |

| Costo/reporte | $0.00 |

| Margen | 99.6% - 100% |



\## 🚀 Deploy a Netlify



```bash

netlify login

netlify deploy --prod

```



\## 📞 Contacto



Isaac Moreno — imconsulting.me@gmail.com



\---



Status: ✅ Production Ready

