# 05_OPERACION — Instrucciones del Sistema
> Referencia operativa. No se carga en prompts de ejecución.
> VERSIÓN 2.0 — Integra flujo manual optimizado + sistema automatizado.

---

## ARQUITECTURA DEL SISTEMA

| Archivo | Función | Dónde vive | Lo toca Isaac |
|---------|---------|------------|---------------|
| 00_CORE.md | Identidad y reglas — Capa A (producción) + Capa B (desglose) | Proyecto | Nunca |
| 01_ZOHAR.md | Principios por bloque — lookup de fila única | Proyecto | Nunca |
| 02_KABBALAH.md | Signos — lookup de fila única | Proyecto | Nunca |
| 03_CLIENTE_[nombre].md | Dataset compacto del cliente | Equipo de Isaac | Una vez por cliente — generado por skill-dataset-im |
| REP_[nombre].md | Resumen ejecutivo del perfil | Equipo de Isaac | Una vez por cliente al finalizar |

**Archivos eliminados del flujo:**
- `04_BLOQUE` — eliminado (instrucción va directo en el chat)
- `07_TRANSCRIPCION` — reemplazado por **skill-dataset-im**
- `06_ENSAMBLAJE` — reemplazado por **skill-desglose-im** + sistema PDF automatizado

---

## FLUJO A — MANUAL OPTIMIZADO
> Para clientes que llegan por referido o canal directo antes de que el sistema automatizado esté activo.
> Aplica también cuando Isaac quiere revisar o ajustar bloques individualmente.

### PASO 1 — Generar el dataset del cliente (una sola vez)
1. Abre un chat nuevo
2. Activa **skill-dataset-im** escribiendo: `"Genera el dataset del cliente"`
3. El skill te pide los datos en orden: nombre, fecha de nacimiento, hora, lugar, contexto declarado, eventos biográficos con edad si los hay
4. Output: el archivo `03_CLIENTE_[nombre].md` en formato compacto listo para usar
5. Guárdalo en tu equipo con ese nombre

> Si el cliente llegó por sesión inicial presencial: proporciona al skill el resumen de esa sesión (3-5 líneas de lo más relevante) en lugar de la transcripción completa. El skill no necesita la transcripción íntegra — solo los datos esenciales del perfil.

### PASO 2 — Desarrollar bloques (una sesión por bloque o por par)
1. Abre un chat nuevo
2. Pega el contenido de `03_CLIENTE_[nombre].md`
3. Escribe únicamente la instrucción del bloque: `"Desarrolla B1"` o `"Desarrolla B1 y B2"`
4. Claude consulta el proyecto, extrae la fila de ZOHAR y la fila de KABBALAH correspondientes, y genera el bloque
5. **No pedir desglose en esta sesión** — el desglose se genera al final, una sola vez
6. Si el bloque necesita ajuste, corrígelo en la misma sesión antes de cerrarla
7. Copia el bloque aprobado a tu archivo de trabajo

**Regla de sesiones:**
- Un bloque por sesión cuando se requiere máxima calidad y concentración
- Máximo dos bloques por sesión cuando los bloques son temáticamente cercanos (ej. B7 y B9, B5 y B6)
- Nunca más de dos bloques por sesión — el contexto acumulado degrada la calidad del tercero

### PASO 3 — Generar el desglose (una sola vez, al final)
1. Cuando todos los bloques estén aprobados, abre un chat nuevo
2. Activa **skill-desglose-im** escribiendo: `"Genera el desglose interno"`
3. Pega el dataset del cliente + todos los bloques finales en orden
4. Output: desglose interno completo de todos los bloques en una sola respuesta
5. Guarda el desglose en tu expediente del cliente

### PASO 4 — Generar el Resumen Ejecutivo del Perfil
1. Abre un chat nuevo
2. Pega el dataset del cliente + todos los bloques finales
3. Escribe: `"Genera el Resumen Ejecutivo del Perfil"`
4. Output: REP completo listo para guardar como `REP_[nombre].md`

### PASO 5 — Armar el PDF (manual por ahora)
Copia los bloques aprobados al documento Word con la plantilla de IM Consulting.
Cuando el sistema automatizado esté activo, este paso desaparece.

---

## DISTRIBUCIÓN DE BLOQUES RECOMENDADA — FLUJO MANUAL

| Sesión | Instrucción en el chat | Criterio |
|--------|----------------------|----------|
| 1 | "Desarrolla B1" | Bloque ancla — solo, máxima atención |
| 2 | "Desarrolla B2 y B11" | Par complementario |
| 3 | "Desarrolla B3 y B4" | Par temático (mente + subconsciente) |
| 4 | "Desarrolla B5 y B6" | Par temático (patrones + linaje) |
| 5 | "Desarrolla B8 y B12" | Par temático (profesión + ciclos) |
| 6 | "Desarrolla B10" | Solo si requiere profundidad somática |
| 7 | "Desarrolla B7 y B9" | Solo plan $111 |
| 8 | "Desarrolla B13 y B14" | Cierre de Parte I |
| 9 | "Desarrolla B2.1 y B2.2" | Solo plan $111 |
| 10 | "Desarrolla B2.3 y B2.4" | Solo plan $111 |
| 11 | "Desarrolla B2.5 y B2.6" | Solo plan $111 |

**Plan $55 (Esencial):** Sesiones 1-6 + 8 = 7 sesiones máximo
**Plan $111 (Completo):** Todas las sesiones = 11 sesiones máximo

---

## FLUJO B — SISTEMA AUTOMATIZADO
> Activo cuando el sistema web esté desplegado en Netlify.
> Isaac no interviene en ningún paso — el sistema opera solo.

```
Cliente paga en Stripe ($55 o $111)
        ↓
Webhook activa el motor
        ↓
dataset.py corre Kerykeion + Matriz + Numerología → JSON
        ↓
generate-report.js hace N llamadas encadenadas a la API de Claude
  · Cada llamada recibe: 00_CORE Capa A + fila ZOHAR del bloque + fila KABBALAH + JSON dataset
  · Parámetro system cacheado (prompt caching activado) → ahorro 70-80% en tokens de sistema
  · Plan $55: 14 llamadas  |  Plan $111: 20 llamadas
        ↓
assembler.py genera el PDF con plantilla de marca
        ↓
PDF se envía por correo al cliente (Resend)
        ↓
Notificación a Isaac
  · Plan $111: incluye aviso de sesión 1:1 pendiente
```

**Desglose en el sistema automatizado:**
El desglose interno no se genera automáticamente — no viaja a los clientes. Si Isaac necesita el desglose de un cliente específico del sistema automatizado, activa skill-desglose-im manualmente con el dataset JSON del cliente y los bloques generados.

---

## ITERACIÓN DENTRO DEL MISMO CHAT — FLUJO MANUAL

Si un bloque necesita ajuste, escribirlo de forma específica antes de cerrar la sesión:
- `"Reescribe el segundo párrafo, suena clínico"`
- `"La pregunta de poder es muy vaga, hazla más incisiva"`
- `"El tono se volvió terapéutico, ajusta a diagnóstico"`
- `"Este párrafo está en tercera persona, corrígelo"`

Nunca pedir una reescritura completa del bloque sin señalar qué falla específicamente. La iteración con feedback preciso consume menos tokens y produce mejor resultado.

---

## REGLAS DE EFICIENCIA DE TOKENS

1. **Nunca cargar 01_ZOHAR o 02_KABBALAH completos** — solo la fila del bloque activo
2. **El desglose va siempre al final** — nunca durante la producción de bloques
3. **El 03_CLIENTE debe ser compacto** — generado por skill-dataset-im, no transcripción libre
4. **Máximo 2 bloques por sesión** — el tercer bloque en la misma sesión cuesta más y produce menos
5. **Prompt caching activado** en el sistema API — el parámetro `system` (00_CORE Capa A) se cachea automáticamente entre llamadas encadenadas

---

*IM Consulting · Sistema Modular · Uso Interno · Confidencial · 2026*
