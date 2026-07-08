import { DocContent, DocSection } from "./types";

export const NAVIGATION: DocSection[] = [
  {
    title: "Primeros Pasos",
    items: [
      { id: "introduccion", title: "Introducción" },
      { id: "inicio-rapido", title: "Guía de inicio rápido" },
      { id: "sandbox", title: "Sandbox demo (5 min)" },
    ]
  },
  {
    title: "Referencia API",
    items: [
      { id: "autenticacion", title: "Autenticación", isApiRef: true },
      { id: "instancias", title: "Instancias", isApiRef: true },
      { id: "mensajes", title: "Mensajes", isApiRef: true },
      { id: "errores", title: "Errores comunes", isApiRef: true },
    ]
  }
];

export const DOCS_DATABASE: Record<string, DocContent> = {
  "introduccion": {
    id: "introduccion",
    title: "Introducción",
    markdown: `
# Introducción a la API de Lebytek

La API de **Lebytek** te permite enviar mensajes de WhatsApp desde tu propio sistema usando una URL y un token de acceso.

Está pensada para negocios, desarrolladores e integradores que quieren automatizar confirmaciones, recordatorios, avisos, promociones o notificaciones sin construir una solución de mensajería desde cero.

## ¿Para quién es esta API?

La API de Lebytek es útil para:

- **Sistemas internos** que necesitan enviar avisos automáticos por WhatsApp.
- **CRMs, ERPs o paneles administrativos** que quieren agregar notificaciones a clientes.
- **Negocios con procesos repetitivos**, como confirmaciones, cobranza, citas, recordatorios o seguimiento de ventas.
- **Equipos técnicos** que buscan una integración simple basada en peticiones HTTP.

## ¿Qué resuelve?

Con Lebytek puedes conectar una instancia de WhatsApp a tu sistema y enviar mensajes desde tus propios flujos.

En lugar de depender de mensajes manuales, copiados o enviados uno por uno, puedes automatizar comunicaciones importantes desde tu aplicación.

Ejemplos de uso:

- Confirmación de citas o reservas.
- Recordatorios de pago.
- Avisos de seguimiento.
- Notificaciones internas.
- Mensajes transaccionales.
- Promociones o campañas autorizadas.

## ¿Cómo funciona?

1. Lebytek activa tu instancia.
2. Recibes tus credenciales de acceso.
3. Conectas tu sistema mediante URL y token.
4. Realizas peticiones HTTP para enviar mensajes.
5. Consultas el estado de tus mensajes cuando lo necesites.

> 💡 **Tip:** Si recibiste una demo, puedes usar el Sandbox para probar tu token y enviar un mensaje de prueba antes de integrar la API en tu sistema.

### ¿Qué sigue?

Avanza a la **Guía de inicio rápido** para enviar tu primer mensaje.
`
  },
  "sandbox": {
    id: "sandbox",
    title: "Sandbox demo",
    markdown: `
# Sandbox demo

Usa esta sección para probar tu token, validar tu instancia y enviar un mensaje de prueba.

> Esta demo está pensada para ayudarte a comprobar que tus credenciales funcionan antes de integrar la API en tu sistema.
`
  },
  "inicio-rapido": {
    id: "inicio-rapido",
    title: "Guía de inicio rápido",
    markdown: `
# Guía de inicio rápido

Esta guía te ayuda a validar tu acceso y enviar tu primer mensaje por WhatsApp usando la API de Lebytek.

> 🚀 **¿Recibiste una demo?** Ten a la mano la URL base, tu token y el identificador de tu instancia.

---

## 1. Recibir tus credenciales

Al activar tu instancia recibirás los datos necesarios para conectarte a la API:

- URL base de la API.
- Token de acceso.
- Identificador público de instancia.

Guarda estos datos en un lugar seguro. No los publiques en repositorios, capturas de pantalla, frontend público o canales no protegidos.

---

## 2. Validar tu token

Antes de enviar mensajes, puedes hacer una petición de verificación para confirmar que tu token está funcionando.

**GET** \`/health\`

\`\`\`bash
curl -X GET "https://api.lebytek.com/api/v1/health" \\
  -H "Authorization: Bearer {token}" \\
  -H "Accept: application/json"
\`\`\`

Si la respuesta es correcta, puedes continuar con la integración.

---

## 3. Revisar el estado de tu instancia

Una instancia representa la línea de WhatsApp que se usará para enviar mensajes.

**GET** \`/instances/{instancePublicId}\`

\`\`\`bash
curl -X GET "https://api.lebytek.com/api/v1/instances/{instancePublicId}" \\
  -H "Authorization: Bearer {token}" \\
  -H "Accept: application/json"
\`\`\`

La instancia debe estar conectada antes de enviar mensajes.

---

## 4. Conectar la instancia con QR

Si tu instancia requiere vinculación, solicita el QR de conexión.

**GET** \`/instances/{instancePublicId}/qr\`

\`\`\`bash
curl -X GET "https://api.lebytek.com/api/v1/instances/{instancePublicId}/qr" \\
  -H "Authorization: Bearer {token}" \\
  -H "Accept: application/json"
\`\`\`

Escanea el QR desde la aplicación de WhatsApp en el teléfono que deseas conectar.

![Placeholder: Pantalla QR para conectar WhatsApp](/assets/docs/qr-instancia.png)

---

## 5. Enviar tu primer mensaje

Cuando la instancia esté conectada, puedes enviar un mensaje de prueba.

**POST** \`/messages\`

\`\`\`bash
curl -X POST "https://api.lebytek.com/api/v1/messages" \\
  -H "Authorization: Bearer {token}" \\
  -H "Accept: application/json" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: 123e4567-e89b-12d3-a456-426614174000" \\
  -d '{
    "recipient": "5215512345678",
    "body": "Hola desde Lebytek API",
    "instancePublicId": "{instancePublicId}"
  }'
\`\`\`

---

## Problemas frecuentes

- **Token inválido:** Revisa que el header tenga el formato \`Authorization: Bearer {token}\`.
- **Instancia no conectada:** Verifica el estado de la instancia antes de enviar mensajes.
- **QR expirado:** Genera un nuevo QR e intenta escanearlo nuevamente.
- **Demasiadas solicitudes:** Reduce la frecuencia de peticiones o espera antes de reintentar.

### ¿Qué sigue?

Consulta la sección de **Autenticación** para conocer los headers recomendados en tus peticiones.
`
  },
  "autenticacion": {
    id: "autenticacion",
    title: "Autenticación",
    markdown: `
# Autenticación

Todas las peticiones a la API de Lebytek requieren autenticación mediante **Bearer Token**.

El token será entregado al activar tu instancia y debe enviarse en cada petición dentro del header \`Authorization\`.

## Header de autenticación

\`\`\`http
Authorization: Bearer {token}
\`\`\`

## Headers recomendados

Incluye estos headers para que tus peticiones se procesen correctamente:

- \`Authorization: Bearer {token}\`
- \`Accept: application/json\`
- \`Content-Type: application/json\` en peticiones \`POST\`, \`PUT\` o \`PATCH\`
- \`Idempotency-Key: {uuid-v4}\` en peticiones de envío para evitar duplicados

## Seguridad del token

Tu token es privado y permite usar tu instancia de la API.

No lo compartas en:

- Repositorios públicos.
- Frontend o JavaScript expuesto al navegador.
- Capturas de pantalla.
- Correos reenviados sin control.
- Canales públicos o grupos abiertos.

Si sospechas que tu token fue expuesto, solicita una regeneración de credenciales.

## Ejemplo de verificación

\`\`\`bash
curl -X GET "https://api.lebytek.com/api/v1/health" \\
  -H "Authorization: Bearer {token}" \\
  -H "Accept: application/json"
\`\`\`

## Ejemplo de envío con Idempotency-Key

\`\`\`bash
curl -X POST "https://api.lebytek.com/api/v1/messages" \\
  -H "Authorization: Bearer {token}" \\
  -H "Accept: application/json" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: 123e4567-e89b-12d3-a456-426614174000" \\
  -d '{
    "recipient": "5215512345678",
    "body": "Hola desde Lebytek API",
    "instancePublicId": "{instancePublicId}"
  }'
\`\`\`
`
  },
  "instancias": {
    id: "instancias",
    title: "Instancias",
    markdown: `
# Instancias

Una instancia representa la línea de WhatsApp conectada a tu integración.

Cada mensaje enviado por la API debe indicar qué instancia se utilizará para realizar el envío.

## Consultar una instancia

Utiliza este endpoint para revisar si tu instancia está lista para enviar mensajes.

**GET** \`/instances/{instancePublicId}\`

**Headers:**

\`\`\`http
Authorization: Bearer {token}
Accept: application/json
\`\`\`

**Respuesta de ejemplo:**

\`\`\`json
{
  "id": "{instancePublicId}",
  "label": "Mi instancia principal",
  "status": "connected",
  "createdAt": "2026-07-04T10:00:00Z"
}
\`\`\`

## Obtener QR de conexión

Si tu instancia todavía no está conectada, puedes solicitar un QR para vincularla.

**GET** \`/instances/{instancePublicId}/qr\`

**Headers:**

\`\`\`http
Authorization: Bearer {token}
Accept: application/json
\`\`\`

**Respuesta de ejemplo:**

\`\`\`json
{
  "instancePublicId": "{instancePublicId}",
  "status": "waiting_qr",
  "qr": "data:image/png;base64,..."
}
\`\`\`

> El QR puede expirar después de un periodo corto. Si expira, solicita uno nuevo y vuelve a escanearlo.

## Estados comunes

| Estado | Significado |
| :--- | :--- |
| \`connected\` | La instancia está lista para enviar mensajes. |
| \`waiting_qr\` | La instancia requiere escanear un QR. |
| \`disconnected\` | La instancia no está conectada actualmente. |
| \`failed\` | Ocurrió un problema al preparar la instancia. |
`
  },
  "mensajes": {
    id: "mensajes",
    title: "Mensajes",
    markdown: `
# Mensajes

El endpoint de mensajes permite enviar textos de WhatsApp desde tu sistema.

> La instancia indicada debe estar conectada antes de enviar mensajes.

## Enviar un mensaje de texto

**POST** \`/messages\`

**Headers:**

\`\`\`http
Authorization: Bearer {token}
Accept: application/json
Content-Type: application/json
Idempotency-Key: {uuid-v4}
\`\`\`

**Body:**

\`\`\`json
{
  "recipient": "5215512345678",
  "body": "Hola desde Lebytek API",
  "instancePublicId": "{instancePublicId}"
}
\`\`\`

**Respuesta de ejemplo:**

\`\`\`json
{
  "id": "{messageId}",
  "status": "queued",
  "recipient": "5215512345678",
  "createdAt": "2026-07-04T10:05:00Z"
}
\`\`\`

## Consultar estado de envío

Verifica el estado actual de un mensaje enviado.

**GET** \`/messages/{messageId}\`

**Headers:**

\`\`\`http
Authorization: Bearer {token}
Accept: application/json
\`\`\`

**Respuesta de ejemplo:**

\`\`\`json
{
  "id": "{messageId}",
  "status": "sent",
  "recipient": "5215512345678",
  "sentAt": "2026-07-04T10:05:30Z"
}
\`\`\`

## Estados comunes de mensaje

| Estado | Significado |
| :--- | :--- |
| \`queued\` | El mensaje fue recibido y está en cola de envío. |
| \`sent\` | El mensaje fue enviado correctamente. |
| \`failed\` | El mensaje no pudo enviarse. |
`
  },
  "errores": {
    id: "errores",
    title: "Errores comunes",
    markdown: `
# Errores comunes

Estos son algunos errores que puedes recibir al consumir la API.

| Código HTTP | Causa probable | Qué revisar |
| :--- | :--- | :--- |
| \`400\` | La petición está mal formada. | Revisa el JSON y los campos enviados. |
| \`401\` | Token ausente o inválido. | Verifica el header \`Authorization\`. |
| \`403\` | El token no puede realizar esa acción. | Confirma que estás usando las credenciales correctas. |
| \`404\` | Recurso no encontrado. | Revisa el identificador usado en la URL. |
| \`422\` | Datos inválidos o instancia no lista. | Revisa campos requeridos y estado de la instancia. |
| \`429\` | Demasiadas solicitudes. | Reduce la frecuencia de peticiones y reintenta. |
| \`500\` | Error inesperado. | Reintenta más tarde o contacta soporte. |

## Recomendaciones

- Usa siempre \`Idempotency-Key\` en envíos para evitar duplicados.
- Valida el estado de la instancia antes de enviar mensajes.
- No expongas tu token en el navegador.
- Guarda los identificadores de mensajes para poder consultar su estado.
`
  }
};
