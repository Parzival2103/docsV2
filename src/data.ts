import { DocContent, DocSection } from "./types";

export const NAVIGATION: DocSection[] = [
  {
    title: "Primeros Pasos",
    items: [
      { id: "introduccion", title: "Introducción" },
      { id: "inicio-rapido", title: "Guía de inicio rápido" },
    ]
  },
  {
    title: "Referencia API",
    items: [
      { id: "autenticacion", title: "Autenticación", isApiRef: true },
      { id: "tenants", title: "Tenants", isApiRef: true },
      { id: "instancias", title: "Instancias", isApiRef: true },
      { id: "mensajes", title: "Mensajes", isApiRef: true },
    ]
  }
];

export const DOCS_DATABASE: Record<string, DocContent> = {
  "introduccion": {
    id: "introduccion",
    title: "Introducción",
    markdown: `
# Introducción a la API de Lebytek

Bienvenido a la documentación oficial de **Lebytek**. Nuestra API está diseñada para ser el intermediario perfecto entre clientes, integradores y WhatsApp. Si alguna vez has intentado conectar tu software directamente con la API de WhatsApp, sabes que puede ser un proceso largo, técnico y lleno de requisitos de aprobación. Nosotros simplificamos todo eso.

## ¿Para quién es esta API?

La API de Lebytek está construida pensando en:
- **Desarrolladores e integradores** que quieren añadir capacidades de mensajería de WhatsApp a sus aplicaciones (CRM, ERP, sistemas de tickets) en cuestión de minutos, no de semanas.
- **Agencias SaaS** que necesitan gestionar múltiples cuentas de clientes bajo un mismo paraguas, de forma ordenada y aislada.

## ¿Qué resuelve?

En lugar de lidiar con webhooks complejos, verificaciones de negocio engorrosas y largos tiempos de espera, nosotros te entregamos una conexión limpia. Podrás provisionar cuentas (tenants), crear instancias (líneas conectadas), escanear un código QR como si fuera WhatsApp Web y empezar a enviar y recibir mensajes inmediatamente. El cliente NUNCA llama a proveedores subyacentes (como Green API) directamente; todo pasa por nuestra infraestructura en \`api.lebytek.com\`.

> 💡 **Tip:** Si quieres explorar la API de forma interactiva y probar los endpoints directamente en el navegador, visita nuestra [Documentación OpenAPI (Swagger)](https://api.lebytek.com/docs).

![Placeholder: Arquitectura de conexión de Lebytek](/assets/docs/arquitectura-lebytek.png)

### ¿Qué sigue?
¿Listo para empezar? Avanza a la **Guía de inicio rápido**.
`
  },
  "inicio-rapido": {
    id: "inicio-rapido",
    title: "Guía de inicio rápido",
    markdown: `
# Guía de inicio rápido

Integrar WhatsApp en tu sistema no tiene por qué ser un dolor de cabeza. En esta guía, te llevaremos de la mano para que envíes tu primer mensaje en 5 pasos sencillos. 

¡Comencemos!

---

## 1. Obtener tu token de acceso

Para que podamos reconocerte, necesitas una "llave" de acceso. 
- Si eres un **integrador**, recibirás un Token de Plataforma en tu panel de control.
- Si eres un **cliente final**, recibirás un Token por-tenant por correo electrónico (o a través del software de tu integrador).

Este token debe ir en todas las peticiones que le hagas a la API en el header \`Authorization\`.

> ℹ️ **Ojo:** Guarda tu token en un lugar seguro. ¡No lo expongas en código público ni lo compartas!

## 2. Provisionar un tenant

*(Paso solo para integradores con Token de Plataforma).*

En Lebytek, un **tenant** es una cuenta de cliente. Si estás construyendo un sistema para varias empresas, cada empresa debe tener su propio tenant. Esto mantiene la información y la facturación de cada uno totalmente aislada.

Haz una petición \`POST /tenants\` para crear tu primer tenant y guarda el \`publicId\` (un código único ULID) que te devolveremos.

## 3. Crear una instancia WhatsApp

Una instancia es, en esencia, "una línea de WhatsApp conectada" que pertenece a un tenant. 
Llama al endpoint \`POST /instances\` enviando en los headers el \`X-Tenant-Id\` para crear la instancia. Cuando se cree correctamente, pasará a un estado de provisionamiento y luego estará lista para vincularse.

## 4. Conectar escaneando el QR

Para autorizar la instancia, debes pedirle a nuestra API que genere un código QR haciendo un \`GET /instances/{publicId}/qr\`. 

Este código es igual al que ves cuando inicias sesión en WhatsApp Web. Abre la app de WhatsApp en el teléfono que quieres conectar, ve a "Dispositivos vinculados" y escanea la pantalla.

![Placeholder: Pantalla QR para conectar WhatsApp](/assets/docs/qr-instancia.png)

Una vez escaneado y procesado por nuestro sistema, la instancia cambiará su estado a \`authorized\`.

![Placeholder: Estado de instancia authorized](/assets/docs/instancia-autorizada.png)

## 5. Enviar tu primer mensaje

¡Ya estás conectado! Ahora puedes usar el endpoint \`POST /messages\` para enviarte un mensaje de prueba a ti mismo o a cualquier otro número.

![Placeholder: Respuesta de mensaje enviado](/assets/docs/mensaje-enviado.png)

---

## Problemas frecuentes

- **Mi token dice que es inválido (Error 401):** Verifica que estás enviando el token en el formato correcto en las cabeceras HTTP: \`Authorization: Bearer {tu_token}\`. Revisa que no se haya copiado con espacios extra.
- **La instancia aparece sin autorizar (Error 422):** Si intentas enviar un mensaje, asegúrate de que el estado de la instancia sea \`authorized\`.
- **El QR me dice que ha expirado:** Los códigos QR de WhatsApp caducan muy rápido. Vuelve a llamar al endpoint del QR para generar uno nuevo e inténtalo otra vez inmediatamente.
- **Error 429 (Too Many Requests):** La API tiene un límite (Rate limit) de 60 solicitudes por minuto. Si lo superas, deberás esperar un poco.

### ¿Qué sigue?
Ahora que ya enviaste tu primer mensaje, descubre cómo estructurar la seguridad de tu app en la sección de **Autenticación**.
`
  },
  "autenticacion": {
    id: "autenticacion",
    title: "Autenticación",
    markdown: `
# Autenticación

Todas las peticiones a la API de Lebytek deben estar autenticadas. Utilizamos un esquema de autenticación basado en **Bearer Tokens** (vía Sanctum de Laravel).

Existen dos niveles de tokens que determinan a qué datos tienes acceso.

## Tipos de Token

| | Token plataforma | Token por-tenant |
| :--- | :--- | :--- |
| **Quién lo usa** | Integrador / back-office | Cliente final |
| **Emisión** | \`php artisan integration:issue-waapi-token\` | \`POST /tenants/{publicId}/tokens\` |
| **Alcance** | Todos los tenants | Solo su tenant |
| **Header** | \`Authorization: Bearer {token}\` | \`Authorization: Bearer {token}\` |

> ℹ️ **Ojo:** El token por-tenant se muestra una sola vez al crearlo. Guárdalo de inmediato, no podrás volver a verlo.

## Headers Obligatorios

Todas tus peticiones deben incluir los siguientes headers HTTP para garantizar que la información se procese correctamente:

- \`Authorization: Bearer {token}\`
- \`Accept: application/json\`
- \`Content-Type: application/json\` (Obligatorio en peticiones POST, PUT o PATCH)
- \`Idempotency-Key: {uuid-v4}\` (Obligatorio en peticiones POST/PATCH para evitar envíos duplicados)
- \`X-Tenant-Id: {publicId}\` (Solo si usas un **Token de plataforma** en rutas que no tienen el tenant en la URL, para indicarnos sobre qué cliente estás operando).

## Ejemplos de uso (cURL)

**Ejemplo de una petición GET de verificación (Health check)**
\`\`\`bash
curl -X GET "https://api.lebytek.com/api/v1/health" \\
  -H "Authorization: Bearer {token}" \\
  -H "Accept: application/json"
\`\`\`

**Ejemplo de una petición POST con Idempotency-Key**
\`\`\`bash
curl -X POST "https://api.lebytek.com/api/v1/tenants" \\
  -H "Authorization: Bearer {token}" \\
  -H "Accept: application/json" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: 123e4567-e89b-12d3-a456-426614174000" \\
  -d '{"name": "Acme Corp", "slug": "acme-corp"}'
\`\`\`
`
  },
  "tenants": {
    id: "tenants",
    title: "Tenants",
    markdown: `
# Gestión de Tenants

Un **Tenant** representa a uno de tus clientes o empresas. Toda instancia y mensaje en Lebytek debe pertenecer obligatoriamente a un Tenant.

## Crear un nuevo Tenant

Crea un espacio de trabajo aislado para tu nuevo cliente. (Solo accesible con Token de plataforma).

**POST** \`/tenants\`

**Headers:**
\`\`\`http
Authorization: Bearer {token_plataforma}
Accept: application/json
Content-Type: application/json
Idempotency-Key: {uuid-v4}
\`\`\`

**Body (JSON):**
\`\`\`json
{
  "name": "Acme Corp",
  "slug": "acme-corp",
  "externalRef": "lead_42"
}
\`\`\`

**Response (201 Created):**
\`\`\`json
{
  "publicId": "01JXYZABCDEF1234567890",
  "name": "Acme Corp",
  "slug": "acme-corp",
  "isActive": true,
  "createdAt": "2026-07-04T10:00:00Z"
}
\`\`\`

## Emitir un Token de Tenant

Genera un token de acceso exclusivo para un Tenant específico para que tu cliente final pueda operar su propia cuenta sin ver los datos de los demás.

**POST** \`/tenants/{publicId}/tokens\`

**Headers:**
\`\`\`http
Authorization: Bearer {token_plataforma}
Accept: application/json
Content-Type: application/json
Idempotency-Key: {uuid-v4}
\`\`\`

**Body (JSON):**
\`\`\`json
{
  "name": "cliente-acme"
}
\`\`\`

**Response (201 Created):**
\`\`\`json
{
  "publicId": "01JXYZABC...",
  "token": "12|abcdef1234567890...",
  "name": "cliente-acme",
  "createdAt": "2026-07-04T10:05:00Z"
}
\`\`\`

## Consultar Tenant existente

Obtén los detalles de un Tenant.

**GET** \`/tenants/{publicId}\`

**Headers:**
\`\`\`http
Authorization: Bearer {token_plataforma}
Accept: application/json
\`\`\`

## Códigos de Error Frecuentes

| Código HTTP | Causa probable |
| :--- | :--- |
| **401 Unauthorized** | Token ausente, inválido o expirado. |
| **403 Forbidden** | Estás usando un token que no tiene permisos para crear Tenants. |
| **404 Not Found** | El Tenant indicado en la URL no existe. |
| **422 Unprocessable Entity** | Faltan campos requeridos o el \`slug\` ya está en uso (duplicado). |
`
  },
  "instancias": {
    id: "instancias",
    title: "Instancias",
    markdown: `
# Gestión de Instancias

Una instancia es el puente entre el Tenant y el dispositivo móvil con WhatsApp.

## Crear una Instancia

Inicializa un nuevo entorno de conexión para un Tenant.

**POST** \`/instances\`

**Headers:**
\`\`\`http
Authorization: Bearer {token_plataforma}
Accept: application/json
Content-Type: application/json
Idempotency-Key: {uuid-v4}
X-Tenant-Id: {publicId}
\`\`\`

**Body (JSON):**
\`\`\`json
{
  "label": "Demo Acme",
  "externalRef": "lead_42_instance",
  "purpose": "demo"
}
\`\`\`

**Response (202 Accepted):**
La petición inicia el proceso de aprovisionamiento de manera asíncrona. Recibirás una respuesta indicando que la instancia está siendo creada.

## Obtener información de la Instancia

Consulta el estado actual de la instancia. Los estados posibles son: \`provisioning\`, \`waiting_qr\`, \`authorized\`, o \`failed\`.

**GET** \`/instances/{publicId}\`

## Obtener el QR de conexión

Devuelve el código QR necesario para vincular la aplicación de WhatsApp.

**GET** \`/instances/{publicId}/qr\`

**Headers:**
\`\`\`http
Authorization: Bearer {token}
Accept: application/json
\`\`\`

![Placeholder: Código QR en pantalla](/assets/docs/qr-code.png)

## Eliminar una Instancia

Desconecta el dispositivo y elimina la instancia de forma permanente.

**DELETE** \`/instances/{publicId}\`

**Headers:**
\`\`\`http
Authorization: Bearer {token}
Accept: application/json
\`\`\`
`
  },
  "mensajes": {
    id: "mensajes",
    title: "Mensajes",
    markdown: `
# Envío de Mensajes

El núcleo de la API: enviar notificaciones, alertas y mensajes transaccionales de texto plano.

> 💡 **Tip:** La instancia especificada en la petición debe encontrarse en estado \`authorized\` antes de poder enviar cualquier mensaje.

## Enviar un mensaje de texto

Envía un mensaje de texto a un número de teléfono específico.

**POST** \`/messages\`

**Headers:**
\`\`\`http
Authorization: Bearer {token}
Accept: application/json
Content-Type: application/json
Idempotency-Key: {uuid-v4}
\`\`\`
*(Si usas un Token de Plataforma, debes agregar el header \`X-Tenant-Id\`)*

**Body (JSON):**
\`\`\`json
{
  "recipient": "5215512345678",
  "body": "Hola desde Lebytek API",
  "instancePublicId": "01JINSTABCDEF1234567890"
}
\`\`\`

**Response (202 Accepted):**
\`\`\`json
{
  "publicId": "01JMSGABCDEF...",
  "status": "queued",
  "recipient": "5215512345678",
  "body": "Hola desde Lebytek API"
}
\`\`\`

## Consultar estado de envío

Verifica el estado actual de un mensaje específico (\`queued\`, \`sent\` o \`failed\`).

**GET** \`/messages/{publicId}\`

**Headers:**
\`\`\`http
Authorization: Bearer {token}
Accept: application/json
\`\`\`

## Códigos de Error Frecuentes

| Código HTTP | Causa probable |
| :--- | :--- |
| **422 Unprocessable Entity** | La instancia especificada no se encuentra en estado \`authorized\`, o el formato del JSON es inválido. |
| **429 Too Many Requests** | Has superado el límite de 60 peticiones por minuto. (Rate limit). |
`
  }
};
