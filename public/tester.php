<?php
/**
 * tester.php — Standalone tester para WhatsApiLebytek API
 * -----------------------------------------------------------
 * Uso:
 *   1) Sube este archivo a cualquier servidor con PHP (PHP-FPM, Apache, `php -S`, etc.)
 *      o ejecútalo localmente con:  php -S localhost:8000 tester.php
 *   2) Abre en el navegador: http://localhost:8000/tester.php
 *   3) Configura Base URL + Bearer Token, elige el endpoint y envía.
 *
 * Todo el código vive en este único archivo, sin dependencias externas
 * (solo cURL, incluido por defecto en la mayoría de instalaciones de PHP).
 */

error_reporting(E_ALL & ~E_DEPRECATED);
ini_set('display_errors', '1');

// Descarga del código fuente: /tester.php?download=1
if (isset($_GET['download'])) {
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="tester.php"');
    header('Content-Length: ' . (string) filesize(__FILE__));
    readfile(__FILE__);
    exit;
}

session_start();

// -------------------------------------------------------------------
// Definición de endpoints (basado en la colección Postman provista)
// -------------------------------------------------------------------
$ENDPOINTS = [
    'account_status' => [
        'label'  => 'Account · Estado de cuenta (quota demo, plan, expiración)',
        'method' => 'POST',
        'path'   => '/api/v1/account/status',
        'body'   => null,
        'params' => [],
    ],
    'credentials_green_api' => [
        'label'  => 'Credentials · Actualizar credenciales Green API (solo platform)',
        'method' => 'PUT',
        'path'   => '/api/v1/credentials/green-api',
        'body'   => '{}',
        'params' => [],
    ],
    'instances_list' => [
        'label'  => 'Instances · Listar instancias del tenant',
        'method' => 'GET',
        'path'   => '/api/v1/instances',
        'body'   => null,
        'params' => [],
    ],
    'instances_create' => [
        'label'  => 'Instances · Crear instancia (provisioning async)',
        'method' => 'POST',
        'path'   => '/api/v1/instances',
        'body'   => "{\n  \"label\": \"mi-instancia\",\n  \"externalRef\": \"ref-123\",\n  \"purpose\": \"production\"\n}",
        'params' => [],
    ],
    'instances_show' => [
        'label'  => 'Instances · Ver estado de una instancia',
        'method' => 'GET',
        'path'   => '/api/v1/instances/:instancia_public_id',
        'body'   => null,
        'params' => ['instancia_public_id' => '01KWM4S9B07K9H042CDBV8MJXF'],
    ],
    'instances_qr' => [
        'label'  => 'Instances · Obtener QR de vinculación',
        'method' => 'GET',
        'path'   => '/api/v1/instances/:instancia_public_id/qr',
        'body'   => null,
        'params' => ['instancia_public_id' => '01KWM4S9B07K9H042CDBV8MJXF'],
    ],
    'instances_delete' => [
        'label'  => 'Instances · Eliminar instancia (teardown async)',
        'method' => 'DELETE',
        'path'   => '/api/v1/instances/:instancia_public_id',
        'body'   => null,
        'params' => ['instancia_public_id' => '01KWM4S9B07K9H042CDBV8MJXF'],
    ],
    'messages_send' => [
        'label'  => 'Messages · Enviar mensaje',
        'method' => 'POST',
        'path'   => '/api/v1/messages',
        'body'   => "{\n  \"recipient\": \"5215512345678\",\n  \"body\": \"Hola desde tester.php\",\n  \"instancePublicId\": \"01KWM4S9B07K9H042CDBV8MJXF\"\n}",
        'params' => [],
    ],
    'messages_show' => [
        'label'  => 'Messages · Ver un mensaje',
        'method' => 'GET',
        'path'   => '/api/v1/messages/:mensaje_public_id',
        'body'   => null,
        'params' => ['mensaje_public_id' => '01KWWKR6BD4WPCDZ2A5H9JVXRF'],
    ],
    'platform_health' => [
        'label'  => 'Platform · Health check',
        'method' => 'GET',
        'path'   => '/api/v1/health',
        'body'   => null,
        'params' => [],
    ],
    'tenants_list' => [
        'label'  => 'Tenants · Listar tenants (solo platform)',
        'method' => 'GET',
        'path'   => '/api/v1/tenants',
        'body'   => null,
        'params' => [],
    ],
    'tenants_create' => [
        'label'  => 'Tenants · Crear tenant',
        'method' => 'POST',
        'path'   => '/api/v1/tenants',
        'body'   => "{\n  \"name\": \"Mi Empresa\",\n  \"slug\": \"mi-empresa\",\n  \"externalRef\": \"erp-001\"\n}",
        'params' => [],
    ],
    'tenants_show' => [
        'label'  => 'Tenants · Ver tenant',
        'method' => 'GET',
        'path'   => '/api/v1/tenants/:public_id',
        'body'   => null,
        'params' => ['public_id' => '01KWB1WP1XV138BHF68QGK0J6R'],
    ],
    'tenants_update' => [
        'label'  => 'Tenants · Actualizar tenant',
        'method' => 'PATCH',
        'path'   => '/api/v1/tenants/:public_id',
        'body'   => "{\n  \"name\": \"Mi Empresa SA\",\n  \"isActive\": true,\n  \"commercialStatus\": \"demo\",\n  \"planSlug\": \"pro\",\n  \"planName\": \"Pro\",\n  \"demoStartedAt\": \"" . date('Y-m-d\TH:i:s') . "\",\n  \"demoExpiresAt\": \"" . date('Y-m-d\TH:i:s', strtotime('+15 days')) . "\",\n  \"messagesMonthlyLimit\": 1000\n}",
        'params' => ['public_id' => '01KWB1WP1XV138BHF68QGK0J6R'],
    ],
    'tenants_issue_token' => [
        'label'  => 'Tenants · Emitir token de API (solo platform)',
        'method' => 'POST',
        'path'   => '/api/v1/tenants/:tenant_public_id/tokens',
        'body'   => "{\n  \"name\": \"token-desde-tester\",\n  \"abilities\": [\"mensajes.enviar\"]\n}",
        'params' => ['tenant_public_id' => '01KWB1WP1XV138BHF68QGK0J6R'],
    ],
    'usage' => [
        'label'  => 'Usage · Consumo del tenant',
        'method' => 'GET',
        'path'   => '/api/v1/usage',
        'body'   => null,
        'params' => [],
    ],
    'webhooks_incoming' => [
        'label'  => 'Webhooks · Simular webhook entrante',
        'method' => 'POST',
        'path'   => '/api/v1/webhooks/incoming',
        'body'   => "{\n  \"event\": \"message.received\",\n  \"idempotencyKey\": \"demo-key-1\",\n  \"payload\": {}\n}",
        'params' => [],
    ],
];

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------

function build_url(string $baseUrl, string $path, array $paramValues): string
{
    $baseUrl = rtrim($baseUrl, '/');
    foreach ($paramValues as $key => $value) {
        $path = str_replace(':' . $key, rawurlencode($value), $path);
    }
    return $baseUrl . $path;
}

function do_request(string $method, string $url, ?string $token, ?string $body, array $extraHeaders = []): array
{
    $ch = curl_init();

    $headers = [
        'Accept: application/json',
    ];
    if ($body !== null && $body !== '') {
        $headers[] = 'Content-Type: application/json';
    }
    if ($token) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }
    foreach ($extraHeaders as $h) {
        if (trim($h) !== '') {
            $headers[] = $h;
        }
    }

    curl_setopt_array($ch, [
        CURLOPT_URL            => $url,
        CURLOPT_CUSTOMREQUEST  => strtoupper($method),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HEADER         => true,
        CURLOPT_HTTPHEADER     => $headers,
        CURLOPT_TIMEOUT        => 30,
        CURLOPT_SSL_VERIFYPEER => true,
    ]);

    if ($body !== null && $body !== '' && in_array(strtoupper($method), ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }

    $startTime = microtime(true);
    $response  = curl_exec($ch);
    $elapsedMs = round((microtime(true) - $startTime) * 1000, 2);

    if ($response === false) {
        $error = curl_error($ch);
        curl_close($ch);
        return [
            'ok'          => false,
            'error'       => $error,
            'status'      => null,
            'headers'     => '',
            'body'        => '',
            'elapsed_ms'  => $elapsedMs,
        ];
    }

    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $status     = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $rawHeaders = substr($response, 0, $headerSize);
    $rawBody    = substr($response, $headerSize);

    curl_close($ch);

    return [
        'ok'         => true,
        'error'      => null,
        'status'     => $status,
        'headers'    => trim($rawHeaders),
        'body'       => $rawBody,
        'elapsed_ms' => $elapsedMs,
    ];
}

function pretty_json(string $raw): string
{
    $decoded = json_decode($raw);
    if (json_last_error() === JSON_ERROR_NONE) {
        return json_encode($decoded, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }
    return $raw;
}

function h(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
}

// -------------------------------------------------------------------
// Persistencia simple en sesión (para no reescribir base URL/token)
// -------------------------------------------------------------------
$defaultBaseUrl = $_SESSION['baseUrl'] ?? 'https://api.lebytek.com';
$defaultToken   = $_SESSION['token'] ?? '';

$result   = null;
$selected = $_POST['endpoint'] ?? array_key_first($ENDPOINTS);
$reqUrl   = '';
$reqMethod = '';
$reqBodySent = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $baseUrl = trim($_POST['baseUrl'] ?? $defaultBaseUrl);
    $token   = trim($_POST['token'] ?? '');
    $_SESSION['baseUrl'] = $baseUrl;
    $_SESSION['token']   = $token;

    if (isset($ENDPOINTS[$selected])) {
        $def = $ENDPOINTS[$selected];

        $paramValues = [];
        foreach ($def['params'] as $paramKey => $paramDefault) {
            $paramValues[$paramKey] = trim($_POST['param_' . $paramKey] ?? $paramDefault);
        }

        $body = null;
        if ($def['body'] !== null) {
            $body = $_POST['body'] ?? $def['body'];
        }

        $extraHeadersRaw = $_POST['extra_headers'] ?? '';
        $extraHeaders    = array_filter(array_map('trim', explode("\n", $extraHeadersRaw)));

        $url = build_url($baseUrl, $def['path'], $paramValues);
        $reqUrl    = $url;
        $reqMethod = $def['method'];
        $reqBodySent = $body ?? '';

        $result = do_request($def['method'], $url, $token !== '' ? $token : null, $body, $extraHeaders);
    }
}

$currentDef = $ENDPOINTS[$selected] ?? reset($ENDPOINTS);
?>
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>WhatsApiLebytek · API Tester</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  :root {
    --bg: #0f1115;
    --panel: #161923;
    --panel-2: #1c202c;
    --border: #2a2f3d;
    --text: #e6e8ee;
    --muted: #9aa1b2;
    --accent: #6ea8fe;
    --get: #3fb950;
    --post: #58a6ff;
    --put: #d29922;
    --patch: #d29922;
    --delete: #f85149;
    --ok: #3fb950;
    --err: #f85149;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    padding: 24px;
  }
  h1 {
    font-size: 20px;
    margin: 0 0 4px;
  }
  .sub { color: var(--muted); font-size: 13px; margin-bottom: 20px; }
  .layout {
    display: grid;
    grid-template-columns: 340px 1fr;
    gap: 20px;
    align-items: start;
  }
  @media (max-width: 900px) {
    .layout { grid-template-columns: 1fr; }
  }
  .panel {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 16px;
  }
  .panel + .panel { margin-top: 16px; }
  label {
    display: block;
    font-size: 12px;
    color: var(--muted);
    margin: 10px 0 4px;
  }
  input[type=text], input[type=password], select, textarea {
    width: 100%;
    background: var(--panel-2);
    border: 1px solid var(--border);
    color: var(--text);
    padding: 8px 10px;
    border-radius: 6px;
    font-size: 13px;
    font-family: inherit;
  }
  textarea {
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    font-size: 12.5px;
    min-height: 140px;
    resize: vertical;
  }
  .row { display: flex; gap: 10px; }
  .row > div { flex: 1; }
  button {
    margin-top: 16px;
    width: 100%;
    background: var(--accent);
    color: #0b0d12;
    border: none;
    padding: 10px 14px;
    border-radius: 6px;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
  }
  button:hover { filter: brightness(1.08); }
  .method-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 700;
    color: #0b0d12;
  }
  .m-GET { background: var(--get); }
  .m-POST { background: var(--post); }
  .m-PUT { background: var(--put); }
  .m-PATCH { background: var(--patch); }
  .m-DELETE { background: var(--delete); }
  .endpoint-line {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 6px;
    font-size: 12.5px;
    color: var(--muted);
    word-break: break-all;
  }
  .status-badge {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 6px;
    font-weight: 700;
    font-size: 13px;
  }
  .status-2xx { background: rgba(63,185,80,.15); color: var(--ok); border: 1px solid rgba(63,185,80,.4); }
  .status-4xx, .status-5xx { background: rgba(248,81,73,.15); color: var(--err); border: 1px solid rgba(248,81,73,.4); }
  .status-err { background: rgba(248,81,73,.15); color: var(--err); border: 1px solid rgba(248,81,73,.4); }
  pre {
    background: var(--panel-2);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 12px;
    overflow-x: auto;
    font-size: 12.5px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .meta { display: flex; gap: 16px; flex-wrap: wrap; margin: 10px 0; font-size: 12.5px; color: var(--muted); }
  .meta b { color: var(--text); }
  .empty { color: var(--muted); font-size: 13px; padding: 20px 0; text-align: center; }
  fieldset { border: 1px solid var(--border); border-radius: 8px; margin-top: 10px; padding: 10px 12px; }
  legend { color: var(--muted); font-size: 12px; padding: 0 6px; }
</style>
</head>
<body>

<h1>WhatsApiLebytek · API Tester</h1>
<div class="sub">Standalone PHP tester — sin dependencias. Endpoints tomados de la colección Postman v1.</div>

<form method="post" id="testerForm">
<div class="layout">

  <!-- Panel izquierdo: configuración -->
  <div>
    <div class="panel">
      <label for="baseUrl">Base URL</label>
      <input type="text" id="baseUrl" name="baseUrl" value="<?= h($defaultBaseUrl) ?>">

      <label for="token">Bearer Token</label>
      <input type="password" id="token" name="token" value="<?= h($defaultToken) ?>" placeholder="Pega aquí tu token de API">

      <label for="extra_headers">Headers extra (uno por línea, "Nombre: valor")</label>
      <textarea id="extra_headers" name="extra_headers" style="min-height:60px" placeholder="Idempotency-Key: 123e4567-e89b-12d3-a456-426614174000&#10;X-Tenant-Id: 01KWB1WP1XV138BHF68QGK0J6R"><?= h($_POST['extra_headers'] ?? '') ?></textarea>
    </div>

    <div class="panel">
      <label for="endpoint">Endpoint</label>
      <select id="endpoint" name="endpoint" onchange="document.getElementById('testerForm').submit()">
        <?php foreach ($ENDPOINTS as $key => $def): ?>
          <option value="<?= h($key) ?>" <?= $key === $selected ? 'selected' : '' ?>>
            <?= h($def['label']) ?>
          </option>
        <?php endforeach; ?>
      </select>

      <div class="endpoint-line">
        <span class="method-badge m-<?= h($currentDef['method']) ?>"><?= h($currentDef['method']) ?></span>
        <span><?= h($currentDef['path']) ?></span>
      </div>

      <?php if (!empty($currentDef['params'])): ?>
        <fieldset>
          <legend>Parámetros de ruta</legend>
          <?php foreach ($currentDef['params'] as $paramKey => $paramDefault): ?>
            <label for="param_<?= h($paramKey) ?>"><?= h($paramKey) ?></label>
            <input type="text" id="param_<?= h($paramKey) ?>" name="param_<?= h($paramKey) ?>"
                   value="<?= h($_POST['param_' . $paramKey] ?? $paramDefault) ?>">
          <?php endforeach; ?>
        </fieldset>
      <?php endif; ?>

      <?php if ($currentDef['body'] !== null): ?>
        <label for="body">Body (JSON)</label>
        <textarea id="body" name="body"><?= h($_POST['body'] ?? $currentDef['body']) ?></textarea>
      <?php endif; ?>

      <button type="submit">Enviar solicitud</button>
    </div>
  </div>

  <!-- Panel derecho: resultado -->
  <div class="panel">
    <?php if ($result === null): ?>
      <div class="empty">Configura la solicitud a la izquierda y presiona "Enviar solicitud".</div>
    <?php elseif (!$result['ok']): ?>
      <span class="status-badge status-err">ERROR DE CONEXIÓN</span>
      <div class="meta"><b>URL:</b> <?= h($reqUrl) ?></div>
      <pre><?= h($result['error']) ?></pre>
    <?php else:
      $status = (int) $result['status'];
      $cls = $status >= 500 ? 'status-5xx' : ($status >= 400 ? 'status-4xx' : 'status-2xx');
    ?>
      <span class="status-badge <?= $cls ?>"><?= h((string)$status) ?></span>
      <span class="method-badge m-<?= h($reqMethod) ?>" style="margin-left:8px;"><?= h($reqMethod) ?></span>

      <div class="meta">
        <div><b>URL:</b> <?= h($reqUrl) ?></div>
        <div><b>Tiempo:</b> <?= h((string)$result['elapsed_ms']) ?> ms</div>
      </div>

      <?php if ($reqBodySent !== ''): ?>
        <label>Body enviado</label>
        <pre><?= h(pretty_json($reqBodySent)) ?></pre>
      <?php endif; ?>

      <label>Response headers</label>
      <pre><?= h($result['headers']) ?></pre>

      <label>Response body</label>
      <pre><?= h(pretty_json($result['body'])) ?></pre>
    <?php endif; ?>
  </div>

</div>
</form>

</body>
</html>
