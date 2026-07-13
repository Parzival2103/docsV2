import { DocContent, DocSection } from "./types";

export const NAVIGATION: DocSection[] = [
  {
    title: "Primeros Pasos",
    items: [
      { id: "introduccion", title: "Introducción" },
      { id: "inicio-rapido", title: "Guía de inicio rápido" },
      { id: "sandbox", title: "Sandbox demo (5 min)" },
      { id: "tester", title: "API Tester (PHP)" },
    ]
  },
  {
    title: "Referencia API",
    items: [
      { id: "autenticacion", title: "Autenticación", isApiRef: true },
      { id: "instancias", title: "Instancias", isApiRef: true },
      { id: "mensajes", title: "Mensajes", isApiRef: true },
      { id: "cuenta", title: "Cuenta y cuota", isApiRef: true },
      { id: "uso", title: "Uso", isApiRef: true },
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

La API de **Lebytek** te permite enviar mensajes de WhatsApp desde tu propio sistema usando una URL base y un token de acceso Bearer.

Base URL de producción:

\`\`\`
https://api.lebytek.com/api/v1
\`\`\`

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
2. Recibes tus credenciales de acceso (token Bearer y \`publicId\` de instancia).
   > 🚨 **IDs distintos:** El \`publicId\` del **tenant** (\`tenantPublicId\`) **no** es el de la instancia (\`instancePublicId\`). Resuélvelo con \`GET /instances\` → \`data[].publicId\` para rutas y body de envío.
3. Conectas tu sistema mediante la URL base y el token.
4. Realizas peticiones HTTP para enviar mensajes.
5. Consultas el estado de tus mensajes cuando lo necesites.

> 💡 **Tip:** Si recibiste una demo, usa el **Sandbox** o el **[API Tester (PHP)](/#tester)** (también [descargable](/tester.php?download=1) para tu servidor).

### ¿Qué sigue?

Avanza a la **Guía de inicio rápido** para enviar tu primer mensaje.
`
  },
  "sandbox": {
    id: "sandbox",
    title: "Sandbox demo",
    markdown: `
# Sandbox demo

El **Sandbox interactivo** de esta documentación te permite probar tu demo en ~5 minutos: pegas el token, vinculas WhatsApp con QR y envías un mensaje real — sin escribir código.

> 🚀 **¿Recibiste el correo demo?** Abre **Sandbox demo (5 min)** en el menú. La UI interactiva reemplaza esta página; el contenido de abajo documenta el mismo flujo para referencia e integración.

## Qué necesitas

- Token Bearer del **segundo correo** de demo (formato Sanctum \`15|…\` o el plain text).
- Un teléfono con WhatsApp para escanear el QR (si la instancia aún no está \`authorized\`).
- El número destino en E.164 **sin** \`+\` (ej. \`5215512345678\`, 10–15 dígitos).

## Flujo de la UI (4 pasos)

| Paso | Qué hace | Endpoints |
| :--- | :--- | :--- |
| 1. Token | Valida formato, guarda en \`sessionStorage\`, lista instancias | \`GET /instances\` → \`GET /instances/{publicId}\` |
| 2. Vincular | Si no está \`authorized\`, muestra QR y hace polling de estado | \`GET .../qr\` + refresh de instancia |
| 3. Enviar | POST del mensaje de prueba | \`POST /messages\` (+ \`Idempotency-Key\`) |
| 4. Listo | Muestra JSON y hace poll hasta \`sent\` o \`failed\` | \`GET /messages/{publicId}\` |

### Detalle del paso 2 (QR)

- Solo pide QR si \`status\` es \`waiting_qr\` o \`configuring\`.
- El QR expira en ~**20 segundos**; la UI lo refresca automáticamente (~18 s) y permite “Refrescar QR”.
- Polling de estado cada ~8 s hasta \`authorized\`.
- Si \`status\` es \`provisioning\`, espera; si es \`failed\`, contacta soporte.
- Respuesta QR: \`{ "qr": "<base64 PNG>", "expiresAt": "..." }\` (sin prefijo \`data:\`; la UI lo normaliza).

### Detalle del paso 3–4 (mensaje)

- Body máximo en sandbox: **1000** caracteres (la API acepta hasta 4096).
- Primer envío: **202 Accepted** con \`status: "queued"\`.
- La UI consulta el mensaje cada ~3 s hasta \`sent\` o \`failed\`.

## Endpoints que usa el sandbox

| Método | Ruta | Permiso | Notas |
| :--- | :--- | :--- | :--- |
| GET | \`/instances\` | \`instancias.ver\` | Valida token; toma la primera instancia |
| GET | \`/instances/{publicId}\` | \`instancias.ver\` | Estado actual |
| GET | \`/instances/{publicId}/qr\` | \`instancias.ver\` | Solo si lista para QR; 409 si ya autorizada |
| POST | \`/messages\` | \`mensajes.enviar\` | Requiere instancia \`authorized\` |
| GET | \`/messages/{publicId}\` | \`mensajes.ver\` | Poll de estado |

El sandbox solo llama a rutas de instancias y mensajes (las que permite tu token).

## Seguridad y límites

| Tema | Comportamiento |
| :--- | :--- |
| Almacenamiento | Token solo en \`sessionStorage\` de esta pestaña (\`lebytek_sandbox_token_v1\`) |
| Destino de llamadas | Directo a \`https://api.lebytek.com/api/v1\` (CORS); **no** pasa por docs.lebytek.com |
| Rate limit | 60 req/min API; 10 envíos/min en \`POST /messages\` |
| Cuota | 429 si se agota la cuota mensual del plan demo |
| Rutas permitidas | El cliente del sandbox solo permite instances/messages (anti-SSRF) |

## Errores frecuentes en el sandbox

| Síntoma | Causa | Qué hacer |
| :--- | :--- | :--- |
| Token inválido (401) | Token incompleto o mal pegado | Pega el valor completo del correo (incluye \`id|\` si aparece) |
| 403 | Token sin ability | Usa el token del segundo correo demo |
| 409 al enviar | Instancia no \`authorized\` | Escanea QR y espera estado autorizado |
| 409 en QR | Ya vinculada o aún no lista | Refresca estado; espera si está \`provisioning\` |
| 422 | Falta \`Idempotency-Key\` o body inválido | En la UI no debería ocurrir; en curl añade el header |
| 429 | Throttle o cuota | Espera 1 min o revisa \`POST /account/status\` |

## Después del sandbox

1. Replica el mismo flujo con curl o tu lenguaje (ver **Guía de inicio rápido**).
2. Lee **Autenticación**, **Instancias** y **Mensajes** para contratos JSON exactos.
3. Para cuota y plan demo: **Cuenta y cuota** (\`POST /account/status\`).

## API Tester (PHP)

Abre el **[API Tester](/#tester)** en esta documentación (misma UI embebida que \`/tester.php\`).

Para usarlo en **tu servidor**:

1. [Descarga \`tester.php\`](/tester.php?download=1)
2. Súbelo a tu host o ejecuta local: \`php -S localhost:8000\`
3. Pega Base URL + Bearer Token y elige el endpoint

Cubre instancias, mensajes, cuenta y uso. Para \`POST /messages\` añade en headers extra: \`Idempotency-Key: <uuid>\`.

> El sandbox es solo para validar credenciales demo. En producción no expongas el token en frontend público.
`
  },
  "tester": {
    id: "tester",
    title: "API Tester (PHP)",
    markdown: `
# API Tester (PHP)

La UI interactiva reemplaza esta página. Si no la ves, abre [/#tester](/#tester) o [tester.php](/tester.php).

[Descargar tester.php](/tester.php?download=1) para ejecutarlo en tu propio servidor.
`
  },
  "inicio-rapido": {
    id: "inicio-rapido",
    title: "Guía de inicio rápido",
    markdown: `
# Guía de inicio rápido

Esta guía refleja el flujo real verificado contra la implementación en \`api.lebytek.com\`.

> 🚀 **¿Recibiste una demo?** Ten a la mano la URL base, tu token y el identificador público de instancia (\`publicId\`).

> 🧰 **Tester PHP:** Abre el **[API Tester](/#tester)** en docs, o [descarga \`tester.php\`](/tester.php?download=1) para tu servidor.

---

## 1. Recibir tus credenciales

Al activar tu instancia recibirás:

- URL base: \`https://api.lebytek.com/api/v1\`
- Token de acceso Bearer (Sanctum).
- \`publicId\` de tu instancia (ULID de 26 caracteres).

Guarda estos datos en un lugar seguro.

> 🚨 **\`tenantPublicId\` ≠ \`instancePublicId\`:** El correo puede incluir ambos identificadores. En \`/instances/{publicId}\` y en \`instancePublicId\` del body de \`POST /messages\` usa siempre el \`publicId\` de **instancia** (\`GET /instances\` → \`data[].publicId\`). El ID del tenant en esas rutas produce **404** o **422**.

### Qué puedes hacer con tu token

Tu token de cliente permite:

| Ruta | Permiso |
| :--- | :--- |
| \`GET /instances\` | \`instancias.ver\` |
| \`GET /instances/{publicId}\` | \`instancias.ver\` |
| \`GET /instances/{publicId}/qr\` | \`instancias.ver\` |
| \`POST /messages\` | \`mensajes.enviar\` |
| \`GET /messages/{publicId}\` | \`mensajes.ver\` |
| \`GET /usage\` | \`mensajes.ver\` |
| \`POST /account/status\` | \`cuenta.ver\` |

**Headers:**

| Header | Uso |
| :--- | :--- |
| \`Authorization: Bearer {token}\` | Siempre |
| \`Accept: application/json\` | Siempre |
| \`Content-Type: application/json\` | Escrituras con cuerpo JSON |
| \`Idempotency-Key: {uuid}\` | **Obligatorio** en POST/PUT/PATCH |

> Si recibes **403** en una ruta que no aparece arriba, tu token no incluye ese permiso (es esperado).

---

## 2. Validar tu token

Los tokens de demo incluyen permisos \`instancias.ver\`, \`mensajes.enviar\`, \`mensajes.ver\` y \`cuenta.ver\`.

**Opción A — listar instancias:**

**GET** \`/instances\`

\`\`\`bash
curl -X GET "https://api.lebytek.com/api/v1/instances" \\
  -H "Authorization: Bearer {token}" \\
  -H "Accept: application/json"
\`\`\`

**Opción B — estado de cuenta (recomendado):**

**POST** \`/account/status\`

\`\`\`bash
curl -X POST "https://api.lebytek.com/api/v1/account/status" \\
  -H "Authorization: Bearer {token}" \\
  -H "Accept: application/json"
\`\`\`

> Si \`POST /account/status\` devuelve **403** (sin \`cuenta.ver\`), valida el token con \`GET /instances\` (Opción A).

---

## 3. Revisar el estado de tu instancia

**GET** \`/instances/{publicId}\`

\`\`\`bash
curl -X GET "https://api.lebytek.com/api/v1/instances/{publicId}" \\
  -H "Authorization: Bearer {token}" \\
  -H "Accept: application/json"
\`\`\`

La instancia debe tener \`status: "authorized"\` antes de enviar mensajes.

---

## 4. Conectar la instancia con QR

Si \`status\` es \`waiting_qr\` o \`configuring\`:

**GET** \`/instances/{publicId}/qr\`

\`\`\`bash
curl -X GET "https://api.lebytek.com/api/v1/instances/{publicId}/qr" \\
  -H "Authorization: Bearer {token}" \\
  -H "Accept: application/json"
\`\`\`

El QR expira en aproximadamente **20 segundos** (\`expiresAt\`). Si expira, solicita uno nuevo.

---

## 5. Enviar tu primer mensaje

**POST** \`/messages\` — responde **202 Accepted** al encolar un mensaje nuevo.

\`\`\`bash
curl -X POST "https://api.lebytek.com/api/v1/messages" \\
  -H "Authorization: Bearer {token}" \\
  -H "Accept: application/json" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: 123e4567-e89b-12d3-a456-426614174000" \\
  -d '{
    "recipient": "5215512345678",
    "body": "Hola desde Lebytek API",
    "instancePublicId": "{publicId}"
  }'
\`\`\`

---

## 6. Consultar el mensaje

**GET** \`/messages/{publicId}\`

\`\`\`bash
curl -X GET "https://api.lebytek.com/api/v1/messages/{publicId}" \\
  -H "Authorization: Bearer {token}" \\
  -H "Accept: application/json"
\`\`\`

El \`publicId\` del mensaje viene en la respuesta del POST.

---

## Problemas frecuentes

- **409 al enviar:** La instancia no está \`authorized\`; revisa estado y QR.
- **422 sin Idempotency-Key:** Obligatorio en POST (y en PUT/PATCH de la API).
- **429:** Límite de peticiones (60/min general, 10/min en envío) o cuota mensual agotada.

### ¿Qué sigue?

Consulta **Autenticación**, **Instancias** y **Mensajes** para el detalle completo.
`
  },
  "autenticacion": {
    id: "autenticacion",
    title: "Autenticación",
    markdown: `
# Autenticación

Todas las rutas bajo \`/api/v1\` requieren **Bearer Token** (Laravel Sanctum).

## Header de autenticación

\`\`\`http
Authorization: Bearer {token}
\`\`\`

El token puede ser el valor completo emitido por Sanctum (incluye \`id|\` al inicio si aplica).

## Headers recomendados

| Header | Cuándo |
| :--- | :--- |
| \`Authorization: Bearer {token}\` | Siempre |
| \`Accept: application/json\` | Siempre |
| \`Content-Type: application/json\` | POST, PUT, PATCH con cuerpo |
| \`Idempotency-Key: {uuid}\` | **Obligatorio** en POST, PUT, PATCH (422 si falta) |

## Permisos del token

Cada ruta exige un permiso (\`ability\`). Con tu token de cliente:

| Permiso | Rutas |
| :--- | :--- |
| \`instancias.ver\` | \`GET /instances\`, \`GET /instances/{publicId}\`, \`GET .../qr\` |
| \`mensajes.enviar\` | \`POST /messages\` |
| \`mensajes.ver\` | \`GET /messages/{publicId}\`, \`GET /usage\` |
| \`cuenta.ver\` | \`POST /account/status\` |

Token demo típico: \`instancias.ver\`, \`mensajes.enviar\`, \`mensajes.ver\`, \`cuenta.ver\`.

Sin el permiso requerido → **403**.

**Headers:** \`Authorization\`, \`Accept\`; en escrituras añade \`Content-Type\` + \`Idempotency-Key\`.

## Idempotencia

Middleware \`api.idempotency\`: en operaciones de escritura, si repites la misma \`Idempotency-Key\` dentro de 24 h, la API devuelve la misma respuesta cacheada (status + cuerpo).

\`\`\`json
{
  "message": "Idempotency-Key header is required for write operations."
}
\`\`\`

Código **422** si el header falta o está vacío.

## Rate limiting

| Límite | Alcance |
| :--- | :--- |
| 60 peticiones/min | Toda la API v1 autenticada |
| 10 peticiones/min | \`POST /messages\` (adicional) |

Exceso → **429** \`Too Many Attempts.\`

## Seguridad del token

No expongas el token en frontend público, repositorios ni capturas. Si se filtra, solicita regeneración.

## Ejemplo — validar con listado de instancias

\`\`\`bash
curl -X GET "https://api.lebytek.com/api/v1/instances" \\
  -H "Authorization: Bearer {token}" \\
  -H "Accept: application/json"
\`\`\`

## Ejemplo — envío con Idempotency-Key

\`\`\`bash
curl -X POST "https://api.lebytek.com/api/v1/messages" \\
  -H "Authorization: Bearer {token}" \\
  -H "Accept: application/json" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: 123e4567-e89b-12d3-a456-426614174000" \\
  -d '{
    "recipient": "5215512345678",
    "body": "Hola desde Lebytek API",
    "instancePublicId": "{publicId}"
  }'
\`\`\`

### JavaScript (fetch)

\`\`\`javascript
const response = await fetch("https://api.lebytek.com/api/v1/messages", {
  method: "POST",
  headers: {
    Authorization: "Bearer " + token,
    Accept: "application/json",
    "Content-Type": "application/json",
    "Idempotency-Key": crypto.randomUUID(),
  },
  body: JSON.stringify({
    recipient: "5215512345678",
    body: "Hola desde Lebytek API",
    instancePublicId: publicId,
  }),
});
const data = await response.json();
\`\`\`

### PHP (cURL)

\`\`\`php
$ch = curl_init("https://api.lebytek.com/api/v1/messages");
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        "Authorization: Bearer {$token}",
        "Accept: application/json",
        "Content-Type: application/json",
        "Idempotency-Key: " . bin2hex(random_bytes(16)),
    ],
    CURLOPT_POSTFIELDS => json_encode([
        "recipient" => "5215512345678",
        "body" => "Hola desde Lebytek API",
        "instancePublicId" => $publicId,
    ]),
    CURLOPT_RETURNTRANSFER => true,
]);
$body = curl_exec($ch);
\`\`\`

### Laravel HTTP Client

\`\`\`php
use Illuminate\\Support\\Facades\\Http;
use Illuminate\\Support\\Str;

$response = Http::withToken($token)
    ->withHeaders(['Idempotency-Key' => (string) Str::uuid()])
    ->post('https://api.lebytek.com/api/v1/messages', [
        'recipient' => '5215512345678',
        'body' => 'Hola desde Lebytek API',
        'instancePublicId' => $publicId,
    ]);
\`\`\`
`
  },
  "instancias": {
    id: "instancias",
    title: "Instancias",
    markdown: `
# Instancias

Una instancia es la línea de WhatsApp vinculada a tu tenant. Los identificadores en JSON y URL usan \`publicId\` (campo \`public_id\` en base de datos).

> 🚨 **\`tenantPublicId\` ≠ \`instancePublicId\`:** El \`publicId\` de esta sección es siempre el de **instancia**. Obtén el valor con \`GET /instances\` → \`data[].publicId\` y úsalo en rutas \`/instances/{publicId}\` y en \`instancePublicId\` al enviar mensajes.

## Listar instancias

**GET** \`/instances\`

Permiso: \`instancias.ver\`. Respuesta paginada (por defecto 15 por página, parámetro \`perPage\`).

\`\`\`bash
curl -X GET "https://api.lebytek.com/api/v1/instances" \\
  -H "Authorization: Bearer {token}" \\
  -H "Accept: application/json"
\`\`\`

\`\`\`json
{
  "data": [
    {
      "publicId": "01JXXXXXXXXXXXXXXXXXXXXXX",
      "label": "Mi instancia principal",
      "purpose": "demo",
      "status": "authorized",
      "authorizedAt": "2026-07-04T10:00:00+00:00",
      "createdAt": "2026-07-04T09:00:00+00:00",
      "updatedAt": "2026-07-04T10:00:00+00:00"
    }
  ],
  "links": { "...": "..." },
  "meta": { "...": "..." }
}
\`\`\`

## Consultar una instancia

**GET** \`/instances/{publicId}\`

\`\`\`bash
curl -X GET "https://api.lebytek.com/api/v1/instances/{publicId}" \\
  -H "Authorization: Bearer {token}" \\
  -H "Accept: application/json"
\`\`\`

**Respuesta (200):**

\`\`\`json
{
  "publicId": "01JXXXXXXXXXXXXXXXXXXXXXX",
  "label": "Mi instancia principal",
  "purpose": "demo",
  "status": "authorized",
  "authorizedAt": "2026-07-04T10:00:00+00:00",
  "createdAt": "2026-07-04T09:00:00+00:00",
  "updatedAt": "2026-07-04T10:00:00+00:00"
}
\`\`\`

Si \`status\` no es \`authorized\`, la API actualiza el estado de conexión antes de responder.

## Obtener QR de conexión

**GET** \`/instances/{publicId}/qr\`

Solo cuando \`status\` es \`waiting_qr\` o \`configuring\`.

\`\`\`bash
curl -X GET "https://api.lebytek.com/api/v1/instances/{publicId}/qr" \\
  -H "Authorization: Bearer {token}" \\
  -H "Accept: application/json"
\`\`\`

**Respuesta (200):**

\`\`\`json
{
  "qr": "iVBORw0KGgoAAAANSUhEUgAA...",
  "expiresAt": "2026-07-08T12:00:20+00:00"
}
\`\`\`

> \`qr\` es PNG en base64 puro (sin prefijo \`data:\`). En HTML usa \`data:image/png;base64,{qr}\`.

**Errores 409:**

- \`Instance already authorized\`
- \`Instance not ready for QR\`

## Estados de instancia

| \`status\` | Significado |
| :--- | :--- |
| \`provisioning\` | Creación en curso. |
| \`configuring\` | Configurando la conexión. |
| \`waiting_qr\` | Esperando escaneo de QR. |
| \`authorized\` | Lista para enviar mensajes. |
| \`failed\` | Falló el aprovisionamiento. |
| \`deleted\` | Instancia eliminada. |

Tu token de cliente permite **listar**, **consultar** y obtener **QR**. El alta o baja de instancias las gestiona Lebytek al activar tu cuenta.
`
  },
  "mensajes": {
    id: "mensajes",
    title: "Mensajes",
    markdown: `
# Mensajes

Envío transaccional de texto WhatsApp. Identificador del mensaje: \`publicId\`.

## Enviar un mensaje de texto

**POST** \`/messages\`

Permiso: \`mensajes.enviar\`. Throttle adicional: 10 req/min.

**Headers:**

\`\`\`http
Authorization: Bearer {token}
Accept: application/json
Content-Type: application/json
Idempotency-Key: {uuid}
\`\`\`

**Body (validado):**

| Campo | Reglas |
| :--- | :--- |
| \`recipient\` | Requerido, string, máx. 32 caracteres (se normalizan solo dígitos) |
| \`body\` | Requerido, string, máx. 4096 caracteres |
| \`instancePublicId\` | Requerido, string — **ID de instancia**, no de tenant (ver \`GET /instances\` → \`data[].publicId\`) |

## Formato de destinatario (México móvil)

Para celulares en México, usa E.164 **sin** \`+\`:

| Formato | Ejemplo | ¿Válido? |
| :--- | :--- | :---: |
| Correcto — \`52\` + \`1\` + 10 dígitos | \`5215512345678\` | Sí |
| Incorrecto — \`528\` + … (falta el \`1\`) | \`5285512345678\` | No |

Regla: **52** (país) + **1** (móvil) + **10 dígitos** → \`521XXXXXXXXXX\`.

\`\`\`json
{
  "recipient": "5215512345678",
  "body": "Hola desde Lebytek API",
  "instancePublicId": "01JXXXXXXXXXXXXXXXXXXXXXX"
}
\`\`\`

**Respuesta al crear (202 Accepted):**

\`\`\`json
{
  "publicId": "01JYYYYYYYYYYYYYYYYYYYYYY",
  "direction": "outbound",
  "recipient": "5215512345678",
  "body": "Hola desde Lebytek API",
  "status": "queued",
  "error": null,
  "sentAt": null,
  "createdAt": "2026-07-08T12:05:00+00:00",
  "updatedAt": "2026-07-08T12:05:00+00:00"
}
\`\`\`

**Reintento idempotente (200 OK):** mismo cuerpo, mismo \`publicId\`.

**409:** instancia no \`authorized\` → \`Instance not authorized for sending.\`

**429:** cuota mensual del tenant agotada → \`Monthly message quota exceeded.\`

## Consultar estado de envío

**GET** \`/messages/{publicId}\`

Permiso: \`mensajes.ver\`.

\`\`\`bash
curl -X GET "https://api.lebytek.com/api/v1/messages/{publicId}" \\
  -H "Authorization: Bearer {token}" \\
  -H "Accept: application/json"
\`\`\`

**Respuesta (200) — mensaje enviado:**

\`\`\`json
{
  "publicId": "01JYYYYYYYYYYYYYYYYYYYYYY",
  "direction": "outbound",
  "recipient": "5215512345678",
  "body": "Hola desde Lebytek API",
  "status": "sent",
  "error": null,
  "sentAt": "2026-07-08T12:05:30+00:00",
  "createdAt": "2026-07-08T12:05:00+00:00",
  "updatedAt": "2026-07-08T12:05:30+00:00"
}
\`\`\`

**404:** mensaje de otro tenant o \`publicId\` inexistente.

## Estados de mensaje

| \`status\` | Significado |
| :--- | :--- |
| \`queued\` | Encolado; pendiente de envío. |
| \`sent\` | La API aceptó el envío; ver nota abajo. |
| \`failed\` | Error de envío; revisar campo \`error\`. |

> ⚠️ **\`sent\` ≠ entrega garantizada:** \`status: "sent"\` confirma que Lebytek aceptó y procesó el mensaje hacia WhatsApp. **No** garantiza que el destinatario lo haya recibido o leído.

## Ejemplo Axios

\`\`\`javascript
import axios from "axios";
import { randomUUID } from "crypto";

const { data, status } = await axios.post(
  "https://api.lebytek.com/api/v1/messages",
  {
    recipient: "5215512345678",
    body: "Hola desde Lebytek API",
    instancePublicId: publicId,
  },
  {
    headers: {
      Authorization: \`Bearer \${token}\`,
      "Idempotency-Key": randomUUID(),
    },
    validateStatus: () => true,
  }
);
// status === 202 en primer envío
\`\`\`

## Ejemplo Node.js (fetch nativo)

\`\`\`javascript
import { randomUUID } from "node:crypto";

const res = await fetch("https://api.lebytek.com/api/v1/messages", {
  method: "POST",
  headers: {
    Authorization: \`Bearer \${process.env.LEBYTEK_TOKEN}\`,
    Accept: "application/json",
    "Content-Type": "application/json",
    "Idempotency-Key": randomUUID(),
  },
  body: JSON.stringify({
    recipient: "5215512345678",
    body: "Hola desde Lebytek API",
    instancePublicId: process.env.INSTANCE_PUBLIC_ID,
  }),
});
console.log(res.status, await res.json());
\`\`\`
`
  },
  "cuenta": {
    id: "cuenta",
    title: "Cuenta y cuota",
    markdown: `
# Cuenta y cuota

Estado comercial de tu cuenta, plan y consumo del mes.

> **Validación de token:** \`POST /account/status\` es el método preferido. Si recibes **403** por falta de \`cuenta.ver\`, valida con \`GET /instances\`.

**POST** \`/account/status\`

Permiso: \`cuenta.ver\`.

\`\`\`bash
curl -X POST "https://api.lebytek.com/api/v1/account/status" \\
  -H "Authorization: Bearer {token}" \\
  -H "Accept: application/json"
\`\`\`

> No requiere \`Idempotency-Key\` (aunque es un POST de lectura de estado).

**Respuesta (200):**

\`\`\`json
{
  "requestedAt": "2026-07-08T12:00:00+00:00",
  "commercialStatus": "demo",
  "plan": {
    "slug": "demo",
    "name": "Demo",
    "messagesPerMonthLimit": 100
  },
  "demo": {
    "startedAt": "2026-07-01T00:00:00+00:00",
    "expiresAt": "2026-07-31T23:59:59+00:00",
    "daysRemaining": 23,
    "isExpired": false
  },
  "usage": {
    "messagesSentThisMonth": 0,
    "messagesRemainingThisMonth": 100,
    "messagesLimitThisMonth": 100
  }
}
\`\`\`

## Campos clave

| Campo | Uso |
| :--- | :--- |
| \`commercialStatus\` | Estado comercial del tenant (ej. \`demo\`) |
| \`plan.messagesPerMonthLimit\` | Tope del plan |
| \`demo.expiresAt\` / \`daysRemaining\` / \`isExpired\` | Vigencia de la demo |
| \`usage.messagesRemainingThisMonth\` | Cuánto puedes enviar aún este mes |

## Errores

| Código | Mensaje típico | Causa |
| :--- | :--- | :--- |
| \`403\` | sin permiso | Falta ability \`cuenta.ver\` |
| \`401\` | \`Unauthenticated.\` | Token ausente o inválido |

Cuando \`usage.messagesRemainingThisMonth\` llega a 0, \`POST /messages\` responde **429** \`Monthly message quota exceeded.\`

### Relación con GET /usage

- \`POST /account/status\` → cuota del **mes** + plan + demo.
- \`GET /usage\` → contadores agregados del tenant (enviados/recibidos y por estado).
`
  },
  "uso": {
    id: "uso",
    title: "Uso",
    markdown: `
# Uso

Contadores de mensajes del tenant activo (no sustituye la cuota mensual de **Cuenta y cuota**).

**GET** \`/usage\`

Permiso: \`mensajes.ver\`.

\`\`\`bash
curl -X GET "https://api.lebytek.com/api/v1/usage" \\
  -H "Authorization: Bearer {token}" \\
  -H "Accept: application/json"
\`\`\`

**Respuesta (200):**

\`\`\`json
{
  "messagesSent": 5,
  "messagesReceived": 2,
  "messagesSentByStatus": {
    "sent": 3,
    "queued": 1,
    "failed": 1
  }
}
\`\`\`

## Campos

| Campo | Significado |
| :--- | :--- |
| \`messagesSent\` | Total de mensajes outbound del tenant |
| \`messagesReceived\` | Total inbound registrados |
| \`messagesSentByStatus\` | Desglose por \`queued\` / \`sent\` / \`failed\` |

## Cuándo usarlo

- Dashboards o paneles que muestran volumen enviado.
- Diagnóstico: muchos \`queued\` o \`failed\` antes de escalar envíos.
- Complemento de \`POST /account/status\` (cuota restante del mes vs. totales históricos).

**403** si el token no tiene \`mensajes.ver\`.
`
  },
  "errores": {
    id: "errores",
    title: "Errores comunes",
    markdown: `
# Errores comunes

La API responde JSON en rutas \`/api/*\`. Estructura verificada en middleware, controladores y tests.

## Tabla rápida

| Código | Causa | Qué revisar |
| :--- | :--- | :--- |
| \`400\` | Petición mal formada | JSON, Content-Type |
| \`401\` | Sin autenticación | Header \`Authorization: Bearer\` |
| \`403\` | Sin permiso o rol | Abilities del token; tenant requerido |
| \`404\` | Recurso no encontrado | \`publicId\` correcto; tenant del token |
| \`409\` | Conflicto de estado | Instancia no \`authorized\`; QR no disponible |
| \`422\` | Validación o Idempotency-Key | Campos requeridos; header idempotencia |
| \`429\` | Rate limit o cuota mensual | Frecuencia; plan y \`POST /account/status\` |
| \`500\` | Error interno | Reintentar; contactar soporte |

## Ejemplos de cuerpo real

**401**

\`\`\`json
{
  "message": "Unauthenticated."
}
\`\`\`

**403**

\`\`\`json
{
  "message": "User does not have the right permissions."
}
\`\`\`

**404**

\`\`\`json
{
  "message": "No query results for model [App\\\\Models\\\\Integration\\\\Instancia] ..."
}
\`\`\`

**409 (mensaje)**

\`\`\`json
{
  "message": "Instance not authorized for sending."
}
\`\`\`

**422 (validación)**

\`\`\`json
{
  "message": "The recipient field is required.",
  "errors": {
    "recipient": ["The recipient field is required."]
  }
}
\`\`\`

**422 (idempotencia)**

\`\`\`json
{
  "message": "Idempotency-Key header is required for write operations."
}
\`\`\`

**429 (throttle)**

\`\`\`json
{
  "message": "Too Many Attempts."
}
\`\`\`

**429 (cuota)**

\`\`\`json
{
  "message": "Monthly message quota exceeded."
}
\`\`\`

## Números en México (móvil)

| Síntoma | Causa | Solución |
| :--- | :--- | :--- |
| Mensaje no llega | Formato \`528…\` en lugar de \`521…\` | Usa \`521\` + 10 dígitos (E.164 sin \`+\`) |

Ejemplo correcto: \`5215512345678\` (\`52\` país + \`1\` móvil + 10 dígitos). Ejemplo incorrecto: \`5285512345678\`.

## Estado \`sent\` vs entrega real

\`status: "sent"\` indica que Lebytek procesó el envío hacia WhatsApp. **No** garantiza entrega al teléfono del destinatario ni confirmación de lectura.

## Recomendaciones

- Usa \`Idempotency-Key\` en cada POST de envío.
- Valida \`status: "authorized"\` en la instancia antes de enviar.
- Guarda \`publicId\` del mensaje para consultas posteriores.
- No expongas el token en el navegador.
- En México móvil, verifica el prefijo \`521\`, no \`528\`.
`
  }
};
