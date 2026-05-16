\# 🚀 DEPLOYMENT GUIDE — IM Consulting



Guía paso a paso para desplegar a producción en Netlify.



\## Pre-requisitos



\- Cuenta Netlify (gratuita)

\- Dominio imconsulting.me (registrado)

\- Credenciales Stripe

\- API key Resend



\## Paso 1: Conectar GitHub a Netlify



1\. Ir a https://app.netlify.com

2\. Click "New site from Git"

3\. Seleccionar "GitHub"

4\. Autorizar Netlify

5\. Seleccionar repositorio `imconsulting`

6\. Click "Deploy"



\## Paso 2: Configurar Variables de Entorno



En Netlify Dashboard:



1\. Site settings → Environment

2\. Agregar variables:



STRIPE\_SECRET\_KEY=sk\_live\_...

STRIPE\_PUBLISHABLE\_KEY=pk\_live\_...

RESEND\_API\_KEY=re\_...

NODE\_ENV=production



\## Paso 3: Configurar Dominio



1\. Domain settings → Add custom domain

2\. Agregar: imconsulting.me

3\. Seguir instrucciones de DNS



\## Paso 4: Configurar Stripe Webhook



En Stripe Dashboard:



1\. Webhooks → Add endpoint

2\. URL: https://imconsulting.me/.netlify/functions/webhook

3\. Eventos: payment\_intent.succeeded



\## Paso 5: Test End-to-End



1\. Crear orden de prueba en Stripe

2\. Verificar que webhook se activa

3\. Revisar email recibido

4\. Abrir PDF adjunto



\## Rollback de Emergencia



git revert <commit\_hash>

git push



Netlify auto-deploya en 2-3 minutos



\---



Tiempo estimado: 30 minutos

