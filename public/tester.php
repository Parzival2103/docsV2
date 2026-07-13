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
// Endpoints de cliente (tenant) — sin rutas internas de administración
// -------------------------------------------------------------------
$ENDPOINTS = [
    'account_status' => [
        'label'  => 'Cuenta · Estado (cuota, plan, expiración)',
        'method' => 'POST',
        'path'   => '/api/v1/account/status',
        'body'   => null,
        'params' => [],
    ],
    'instances_list' => [
        'label'  => 'Instancias · Listar',
        'method' => 'GET',
        'path'   => '/api/v1/instances',
        'body'   => null,
        'params' => [],
    ],
    'instances_show' => [
        'label'  => 'Instancias · Ver estado',
        'method' => 'GET',
        'path'   => '/api/v1/instances/:instancia_public_id',
        'body'   => null,
        'params' => ['instancia_public_id' => ''],
    ],
    'instances_qr' => [
        'label'  => 'Instancias · Obtener QR de vinculación',
        'method' => 'GET',
        'path'   => '/api/v1/instances/:instancia_public_id/qr',
        'body'   => null,
        'params' => ['instancia_public_id' => ''],
    ],
    'messages_send' => [
        'label'  => 'Mensajes · Enviar',
        'method' => 'POST',
        'path'   => '/api/v1/messages',
        // Alternativa grupo: "recipient": "120363012345678901@g.us"
        'body'   => "{\n  \"recipient\": \"5218116642117\",\n  \"body\": \"Hola desde tester.php\",\n  \"instancePublicId\": \"\"\n}",
        'params' => [],
    ],
    'messages_show' => [
        'label'  => 'Mensajes · Consultar',
        'method' => 'GET',
        'path'   => '/api/v1/messages/:mensaje_public_id',
        'body'   => null,
        'params' => ['mensaje_public_id' => ''],
    ],
    'usage' => [
        'label'  => 'Uso · Consumo de la cuenta',
        'method' => 'GET',
        'path'   => '/api/v1/usage',
        'body'   => null,
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

    // POST/PUT/PATCH requieren Idempotency-Key; se inyecta si falta.
    $headers = ensure_idempotency_header($headers, $method);

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
            'ok'              => false,
            'error'           => $error,
            'status'          => null,
            'headers'         => '',
            'body'            => '',
            'elapsed_ms'      => $elapsedMs,
            'request_headers' => $headers,
        ];
    }

    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $status     = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $rawHeaders = substr($response, 0, $headerSize);
    $rawBody    = substr($response, $headerSize);

    curl_close($ch);

    return [
        'ok'              => true,
        'error'           => null,
        'status'          => $status,
        'headers'         => trim($rawHeaders),
        'body'            => $rawBody,
        'elapsed_ms'      => $elapsedMs,
        'request_headers' => $headers,
    ];
}

function ensure_idempotency_header(array $headers, string $method): array
{
    if (! in_array(strtoupper($method), ['POST', 'PUT', 'PATCH'], true)) {
        return $headers;
    }

    foreach ($headers as $h) {
        if (stripos($h, 'Idempotency-Key:') === 0) {
            return $headers;
        }
    }

    $uuid = sprintf(
        '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        random_int(0, 0xffff),
        random_int(0, 0xffff),
        random_int(0, 0xffff),
        random_int(0, 0x0fff) | 0x4000,
        random_int(0, 0x3fff) | 0x8000,
        random_int(0, 0xffff),
        random_int(0, 0xffff),
        random_int(0, 0xffff)
    );

    $headers[] = 'Idempotency-Key: ' . $uuid;

    return $headers;
}

function parse_extra_headers(string $raw): array
{
    $lines = preg_split('/\r\n|\r|\n/', $raw) ?: [];
    $out = [];
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '') {
            continue;
        }
        // Normaliza guiones tipográficos pegados desde docs/Word.
        $line = str_replace(["\u{2011}", "\u{2013}", "\u{2014}"], '-', $line);
        $out[] = $line;
    }

    return $out;
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

function redact_request_headers(array $headers): array
{
    $out = [];
    foreach ($headers as $header) {
        if (stripos($header, 'Authorization:') === 0) {
            $out[] = 'Authorization: Bearer ••••• (presente)';
        } else {
            $out[] = $header;
        }
    }

    return $out;
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
$action = $_POST['action'] ?? 'switch';
$tokenMissing = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $baseUrl = trim($_POST['baseUrl'] ?? $defaultBaseUrl);
    // Los navegadores a veces envían el input password vacío (autofill / iframe)
    // al cambiar de endpoint. No pisar el token bueno de sesión en ese caso.
    $tokenPosted = trim($_POST['token'] ?? '');
    if ($tokenPosted !== '') {
        $_SESSION['token'] = $tokenPosted;
    }
    $_SESSION['baseUrl'] = $baseUrl;

    $token = trim((string) ($_SESSION['token'] ?? ''));
    $defaultToken = $token;
    $defaultBaseUrl = $baseUrl;

    // Solo llama a la API al pulsar "Enviar solicitud" (no al cambiar de endpoint).
    if ($action === 'send' && isset($ENDPOINTS[$selected])) {
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
        $extraHeaders    = parse_extra_headers($extraHeadersRaw);

        $url = build_url($baseUrl, $def['path'], $paramValues);
        $reqUrl    = $url;
        $reqMethod = $def['method'];
        $reqBodySent = $body ?? '';

        if ($token === '') {
            $tokenMissing = true;
            $result = [
                'ok'              => true,
                'error'           => null,
                'status'          => 401,
                'headers'         => '',
                'body'            => json_encode([
                    'message' => 'Unauthenticated.',
                    'hint' => 'El tester no envió Authorization. Vuelve a pegar el Bearer Token y pulsa Enviar (no dejes el campo vacío).',
                ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'elapsed_ms'      => 0,
                'request_headers' => ['Accept: application/json'],
            ];
        } else {
            $result = do_request($def['method'], $url, $token, $body, $extraHeaders);
        }
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
<div class="sub">Tester de cliente Lebytek — endpoints de tenant (instancias, mensajes, cuenta, uso). Sin dependencias.</div>

<form method="post" id="testerForm">
<div class="layout">

  <!-- Panel izquierdo: configuración -->
  <div>
    <div class="panel">
      <label for="baseUrl">Base URL</label>
      <input type="text" id="baseUrl" name="baseUrl" value="<?= h($defaultBaseUrl) ?>">

      <label for="token">Bearer Token</label>
      <input type="text" id="token" name="token" value="<?= h($defaultToken) ?>"
             autocomplete="off" spellcheck="false"
             placeholder="Pega aquí tu token de API (15|…)"
             style="font-family: ui-monospace, SFMono-Regular, Consolas, monospace;">
      <p style="margin:6px 0 0;font-size:11px;color:var(--muted);">
        Si ves puntos grises del navegador pero al enviar falta <code>Authorization</code>, borra el campo y pega el token de nuevo.
      </p>

      <label for="extra_headers">Headers extra (uno por línea). En POST la API exige <code>Idempotency-Key</code>; si lo dejas vacío, el tester lo genera solo.</label>
      <textarea id="extra_headers" name="extra_headers" style="min-height:60px"><?= h($_POST['extra_headers'] ?? '') ?></textarea>
    </div>

    <div class="panel">
      <label for="endpoint">Endpoint</label>
      <select id="endpoint" name="endpoint" onchange="document.getElementById('actionSwitch').click()">
        <?php foreach ($ENDPOINTS as $key => $def): ?>
          <option value="<?= h($key) ?>" <?= $key === $selected ? 'selected' : '' ?>>
            <?= h($def['label']) ?>
          </option>
        <?php endforeach; ?>
      </select>
      <button type="submit" name="action" value="switch" id="actionSwitch" style="display:none" tabindex="-1" aria-hidden="true">Cambiar</button>

      <div class="endpoint-line">
        <span class="method-badge m-<?= h($currentDef['method']) ?>"><?= h($currentDef['method']) ?></span>
        <span><?= h($currentDef['path']) ?></span>
      </div>

      <?php if (!empty($currentDef['params'])): ?>
        <fieldset>
          <legend>Parámetros de ruta</legend>
          <p style="margin:0 0 8px;font-size:12px;color:var(--muted);">
            Usa el <code>publicId</code> real de <strong>Instancias · Listar</strong> (no un ejemplo inventado).
          </p>
          <?php foreach ($currentDef['params'] as $paramKey => $paramDefault): ?>
            <label for="param_<?= h($paramKey) ?>"><?= h($paramKey) ?></label>
            <input type="text" id="param_<?= h($paramKey) ?>" name="param_<?= h($paramKey) ?>"
                   placeholder="pega aquí el publicId de GET /instances"
                   value="<?= h($_POST['param_' . $paramKey] ?? $paramDefault) ?>">
          <?php endforeach; ?>
        </fieldset>
      <?php endif; ?>

      <?php if ($currentDef['body'] !== null): ?>
        <label for="body">Body (JSON)</label>
        <?php if ($selected === 'messages_send'): ?>
          <p style="margin:0 0 6px;font-size:12px;color:var(--muted);">
            Completa <code>instancePublicId</code> con el de tu instancia (<strong>Instancias · Listar</strong>).
          </p>
        <?php endif; ?>
        <textarea id="body" name="body"><?= h($_POST['body'] ?? $currentDef['body']) ?></textarea>
      <?php endif; ?>

      <button type="submit" name="action" value="send">Enviar solicitud</button>
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

      <?php if ($tokenMissing): ?>
        <p style="color:var(--err);font-size:13px;margin:10px 0;">
          No se envió el Bearer Token. Pégalo otra vez en el campo de la izquierda y vuelve a enviar.
        </p>
      <?php endif; ?>

      <label>Request headers enviados</label>
      <pre><?= h(implode("\n", redact_request_headers($result['request_headers'] ?? []))) ?></pre>

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
