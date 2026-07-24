/**
 * tester.js — Lógica del API Tester Lebytek
 * -----------------------------------------------------------
 * Uso con la UI:
 *   1) Sirve tester.html + tester.js desde el mismo directorio
 *   2) Abre tester.html, pega Base URL + Bearer Token y envía.
 *
 * Uso programático (sin UI) — ejemplos al final del archivo.
 *
 */
(function (global) {
  'use strict';

  var STORAGE_BASE = 'lebytek_tester_baseUrl';
  var STORAGE_TOKEN = 'lebytek_tester_token';

  // -------------------------------------------------------------------
  // Endpoints de cliente (tenant) — paridad con tester.php
  // -------------------------------------------------------------------
  var ENDPOINTS = {
    account_status: {
      label: 'Cuenta · Estado (cuota, plan, expiración)',
      method: 'POST',
      path: '/api/v1/account/status',
      body: null,
      params: {},
    },
    instances_list: {
      label: 'Instancias · Listar',
      method: 'GET',
      path: '/api/v1/instances',
      body: null,
      params: {},
    },
    instances_show: {
      label: 'Instancias · Ver estado',
      method: 'GET',
      path: '/api/v1/instances/:instancia_public_id',
      body: null,
      params: { instancia_public_id: '' },
    },
    instances_qr: {
      label: 'Instancias · Obtener QR de vinculación',
      method: 'GET',
      path: '/api/v1/instances/:instancia_public_id/qr',
      body: null,
      params: { instancia_public_id: '' },
    },
    messages_send: {
      label: 'Mensajes · Enviar',
      method: 'POST',
      path: '/api/v1/messages',
      // Alternativa grupo: "recipient": "120363012345678901@g.us"
      body:
        '{\n  "recipient": "5218116642117",\n  "body": "Hola desde tester.html",\n  "instancePublicId": ""\n}',
      params: {},
    },
    messages_show: {
      label: 'Mensajes · Consultar',
      method: 'GET',
      path: '/api/v1/messages/:mensaje_public_id',
      body: null,
      params: { mensaje_public_id: '' },
    },
    usage: {
      label: 'Uso · Consumo de la cuenta',
      method: 'GET',
      path: '/api/v1/usage',
      body: null,
      params: {},
    },
  };

  function uuid() {
    if (global.crypto && typeof global.crypto.randomUUID === 'function') {
      return global.crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function buildUrl(baseUrl, path, paramValues) {
    var url = String(baseUrl || '').replace(/\/+$/, '');
    var resolved = path;
    var params = paramValues || {};
    Object.keys(params).forEach(function (key) {
      resolved = resolved.replace(':' + key, encodeURIComponent(params[key] || ''));
    });
    return url + resolved;
  }

  function parseExtraHeaders(raw) {
    var lines = String(raw || '').split(/\r\n|\r|\n/);
    var out = [];
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line) continue;
      // Normaliza guiones tipográficos pegados desde docs/Word.
      line = line.replace(/[\u2011\u2013\u2014]/g, '-');
      out.push(line);
    }
    return out;
  }

  function ensureIdempotencyKey(headers, method) {
    var m = String(method || '').toUpperCase();
    if (['POST', 'PUT', 'PATCH'].indexOf(m) === -1) {
      return headers;
    }
    for (var i = 0; i < headers.length; i++) {
      if (headers[i].toLowerCase().indexOf('idempotency-key:') === 0) {
        return headers;
      }
    }
    headers.push('Idempotency-Key: ' + uuid());
    return headers;
  }

  function headersToObject(headerLines) {
    var obj = {};
    for (var i = 0; i < headerLines.length; i++) {
      var line = headerLines[i];
      var idx = line.indexOf(':');
      if (idx === -1) continue;
      var name = line.slice(0, idx).trim();
      var value = line.slice(idx + 1).trim();
      if (!name) continue;
      if (obj[name]) {
        obj[name] += ', ' + value;
      } else {
        obj[name] = value;
      }
    }
    return obj;
  }

  /**
   * @returns {Promise<{
   *   ok: boolean,
   *   error: string|null,
   *   status: number|null,
   *   headers: string,
   *   body: string,
   *   elapsed_ms: number,
   *   request_headers: string[]
   * }>}
   */
  function doRequest(method, url, token, body, extraHeaders) {
    var headersList = ['Accept: application/json'];
    if (body != null && body !== '') {
      headersList.push('Content-Type: application/json');
    }
    if (token) {
      headersList.push('Authorization: Bearer ' + token);
    }
    var extras = extraHeaders || [];
    for (var i = 0; i < extras.length; i++) {
      if (String(extras[i]).trim() !== '') {
        headersList.push(extras[i]);
      }
    }
    headersList = ensureIdempotencyKey(headersList, method);

    var fetchHeaders = headersToObject(headersList);
    var upper = String(method || 'GET').toUpperCase();
    var init = {
      method: upper,
      headers: fetchHeaders,
    };
    if (body != null && body !== '' && ['POST', 'PUT', 'PATCH', 'DELETE'].indexOf(upper) !== -1) {
      init.body = body;
    }

    var start = performance.now();
    return fetch(url, init)
      .then(function (res) {
        var elapsed = Math.round((performance.now() - start) * 100) / 100;
        var rawHeaderLines = [];
        if (res.headers && typeof res.headers.forEach === 'function') {
          res.headers.forEach(function (value, key) {
            rawHeaderLines.push(key + ': ' + value);
          });
        }
        return res.text().then(function (text) {
          return {
            ok: true,
            error: null,
            status: res.status,
            headers: rawHeaderLines.join('\n'),
            body: text,
            elapsed_ms: elapsed,
            request_headers: headersList,
          };
        });
      })
      .catch(function (err) {
        var elapsed = Math.round((performance.now() - start) * 100) / 100;
        return {
          ok: false,
          error: (err && err.message) || String(err),
          status: null,
          headers: '',
          body: '',
          elapsed_ms: elapsed,
          request_headers: headersList,
        };
      });
  }

  function prettyJson(raw) {
    try {
      return JSON.stringify(JSON.parse(raw), null, 2);
    } catch (e) {
      return raw;
    }
  }

  function redactRequestHeaders(headers) {
    var out = [];
    for (var i = 0; i < headers.length; i++) {
      if (headers[i].toLowerCase().indexOf('authorization:') === 0) {
        out.push('Authorization: Bearer ••••• (presente)');
      } else {
        out.push(headers[i]);
      }
    }
    return out;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function loadStored() {
    var baseUrl = 'https://api.lebytek.com';
    var token = '';
    try {
      baseUrl = localStorage.getItem(STORAGE_BASE) || baseUrl;
      token = localStorage.getItem(STORAGE_TOKEN) || '';
    } catch (e) {
      /* private mode */
    }
    return { baseUrl: baseUrl, token: token };
  }

  function saveStored(baseUrl, token) {
    try {
      if (baseUrl != null) localStorage.setItem(STORAGE_BASE, baseUrl);
      if (token != null && token !== '') localStorage.setItem(STORAGE_TOKEN, token);
    } catch (e) {
      /* private mode */
    }
  }

  /**
   * Ejemplos de uso programático (sin UI):
   *
   *   // Listar instancias
   *   LebytekTester.doRequest(
   *     'GET',
   *     LebytekTester.buildUrl('https://api.lebytek.com', '/api/v1/instances', {}),
   *     'TU_TOKEN',
   *     null,
   *     []
   *   ).then(console.log);
   *
   *   // Enviar mensaje
   *   LebytekTester.doRequest(
   *     'POST',
   *     LebytekTester.buildUrl('https://api.lebytek.com', '/api/v1/messages', {}),
   *     'TU_TOKEN',
   *     JSON.stringify({
   *       recipient: '5218116642117',
   *       body: 'Hola desde tester.js',
   *       instancePublicId: 'inst_xxx'
   *     }),
   *     []
   *   ).then(console.log);
   *
   *   // Atajos:
   *   LebytekTester.listInstances('https://api.lebytek.com', 'TU_TOKEN');
   *   LebytekTester.sendMessage('https://api.lebytek.com', 'TU_TOKEN', {
   *     recipient: '5218116642117',
   *     body: 'Hola',
   *     instancePublicId: 'inst_xxx'
   *   });
   */
  function listInstances(baseUrl, token) {
    return doRequest('GET', buildUrl(baseUrl, '/api/v1/instances', {}), token, null, []);
  }

  function sendMessage(baseUrl, token, payload) {
    return doRequest(
      'POST',
      buildUrl(baseUrl, '/api/v1/messages', {}),
      token,
      JSON.stringify(payload || {}),
      []
    );
  }

  function getAccountStatus(baseUrl, token) {
    return doRequest('POST', buildUrl(baseUrl, '/api/v1/account/status', {}), token, null, []);
  }

  // -------------------------------------------------------------------
  // Mount UI (#testerForm)
  // -------------------------------------------------------------------
  function statusClass(status) {
    if (status >= 500) return 'status-5xx';
    if (status >= 400) return 'status-4xx';
    return 'status-2xx';
  }

  function renderEndpointOptions(selectEl, selectedKey) {
    selectEl.innerHTML = '';
    Object.keys(ENDPOINTS).forEach(function (key) {
      var opt = document.createElement('option');
      opt.value = key;
      opt.textContent = ENDPOINTS[key].label;
      if (key === selectedKey) opt.selected = true;
      selectEl.appendChild(opt);
    });
  }

  function renderParamsAndBody(selectedKey) {
    var def = ENDPOINTS[selectedKey];
    var paramsBox = document.getElementById('paramsBox');
    var bodyBox = document.getElementById('bodyBox');
    var bodyHint = document.getElementById('bodyHint');
    var methodBadge = document.getElementById('methodBadge');
    var pathLabel = document.getElementById('pathLabel');

    if (methodBadge) {
      methodBadge.textContent = def.method;
      methodBadge.className = 'method-badge m-' + def.method;
    }
    if (pathLabel) pathLabel.textContent = def.path;

    if (paramsBox) {
      var paramKeys = Object.keys(def.params || {});
      if (paramKeys.length === 0) {
        paramsBox.hidden = true;
        paramsBox.innerHTML = '';
      } else {
        paramsBox.hidden = false;
        var isMessageParam = paramKeys.indexOf('mensaje_public_id') !== -1;
        var hint = isMessageParam
          ? 'Usa el <code>publicId</code> del <strong>mensaje</strong> (respuesta de <code>POST /messages</code> o consulta previa), no el de instancia.'
          : 'Usa el <code>publicId</code> real de <strong>Instancias · Listar</strong> (no un ejemplo inventado).';
        var placeholder = isMessageParam
          ? 'pega el publicId del mensaje (POST /messages)'
          : 'pega aquí el publicId de GET /instances';
        var html =
          '<legend>Parámetros de ruta</legend>' +
          '<p style="margin:0 0 8px;font-size:12px;color:var(--muted);">' +
          hint +
          '</p>';
        paramKeys.forEach(function (paramKey) {
          html +=
            '<label for="param_' +
            escapeHtml(paramKey) +
            '">' +
            escapeHtml(paramKey) +
            '</label>' +
            '<input type="text" id="param_' +
            escapeHtml(paramKey) +
            '" name="param_' +
            escapeHtml(paramKey) +
            '" placeholder="' +
            escapeHtml(placeholder) +
            '" value="">';
        });
        paramsBox.innerHTML = html;
      }
    }

    if (bodyBox && bodyHint) {
      var bodyEl = document.getElementById('body');
      if (def.body != null) {
        bodyBox.hidden = false;
        if (bodyEl) bodyEl.value = def.body;
        bodyHint.hidden = selectedKey !== 'messages_send';
      } else {
        bodyBox.hidden = true;
        if (bodyEl) bodyEl.value = '';
        bodyHint.hidden = true;
      }
    }
  }

  function renderResult(result, meta) {
    var panel = document.getElementById('resultPanel');
    if (!panel) return;

    if (!result) {
      panel.innerHTML =
        '<div class="empty">Configura la solicitud a la izquierda y presiona "Enviar solicitud".</div>';
      return;
    }

    if (!result.ok) {
      panel.innerHTML =
        '<span class="status-badge status-err">ERROR DE CONEXIÓN</span>' +
        '<div class="meta"><b>URL:</b> ' +
        escapeHtml(meta.reqUrl || '') +
        '</div>' +
        '<pre>' +
        escapeHtml(result.error || '') +
        '</pre>';
      return;
    }

    var status = result.status | 0;
    var html =
      '<span class="status-badge ' +
      statusClass(status) +
      '">' +
      escapeHtml(String(status)) +
      '</span>' +
      '<span class="method-badge m-' +
      escapeHtml(meta.reqMethod || '') +
      '" style="margin-left:8px;">' +
      escapeHtml(meta.reqMethod || '') +
      '</span>' +
      '<div class="meta">' +
      '<div><b>URL:</b> ' +
      escapeHtml(meta.reqUrl || '') +
      '</div>' +
      '<div><b>Tiempo:</b> ' +
      escapeHtml(String(result.elapsed_ms)) +
      ' ms</div>' +
      '</div>';

    if (meta.tokenMissing) {
      html +=
        '<p style="color:var(--err);font-size:13px;margin:10px 0;">' +
        'No se envió el Bearer Token. Pégalo otra vez en el campo de la izquierda y vuelve a enviar.' +
        '</p>';
    }

    html +=
      '<label>Request headers enviados</label>' +
      '<pre>' +
      escapeHtml(redactRequestHeaders(result.request_headers || []).join('\n')) +
      '</pre>';

    if (meta.reqBodySent) {
      html +=
        '<label>Body enviado</label>' +
        '<pre>' +
        escapeHtml(prettyJson(meta.reqBodySent)) +
        '</pre>';
    }

    html +=
      '<label>Response headers</label>' +
      '<pre>' +
      escapeHtml(result.headers || '') +
      '</pre>' +
      '<label>Response body</label>' +
      '<pre>' +
      escapeHtml(prettyJson(result.body || '')) +
      '</pre>';

    panel.innerHTML = html;
  }

  function mount() {
    var form = document.getElementById('testerForm');
    if (!form) return;

    var stored = loadStored();
    var baseUrlEl = document.getElementById('baseUrl');
    var tokenEl = document.getElementById('token');
    var endpointEl = document.getElementById('endpoint');
    var sendBtn = document.getElementById('sendBtn');

    if (baseUrlEl) baseUrlEl.value = stored.baseUrl;
    if (tokenEl) tokenEl.value = stored.token;

    var selected = Object.keys(ENDPOINTS)[0];
    if (endpointEl) {
      renderEndpointOptions(endpointEl, selected);
      endpointEl.addEventListener('change', function () {
        selected = endpointEl.value;
        renderParamsAndBody(selected);
        renderResult(null, {});
      });
    }
    renderParamsAndBody(selected);
    renderResult(null, {});

    form.addEventListener('submit', function (e) {
      e.preventDefault();
    });

    if (sendBtn) {
      sendBtn.addEventListener('click', function () {
        selected = (endpointEl && endpointEl.value) || selected;
        var def = ENDPOINTS[selected];
        if (!def) return;

        var baseUrl = (baseUrlEl && baseUrlEl.value.trim()) || stored.baseUrl;
        var tokenPosted = (tokenEl && tokenEl.value.trim()) || '';
        if (tokenPosted) {
          saveStored(baseUrl, tokenPosted);
        } else {
          saveStored(baseUrl, null);
        }
        var token = tokenPosted || loadStored().token;

        var paramValues = {};
        Object.keys(def.params || {}).forEach(function (paramKey) {
          var input = document.getElementById('param_' + paramKey);
          paramValues[paramKey] = input ? input.value.trim() : '';
        });

        var body = null;
        if (def.body != null) {
          var bodyEl = document.getElementById('body');
          body = bodyEl ? bodyEl.value : def.body;
        }

        var extraRaw = document.getElementById('extra_headers');
        var extraHeaders = parseExtraHeaders(extraRaw ? extraRaw.value : '');
        var url = buildUrl(baseUrl, def.path, paramValues);
        var meta = {
          reqUrl: url,
          reqMethod: def.method,
          reqBodySent: body || '',
          tokenMissing: false,
        };

        if (!token) {
          meta.tokenMissing = true;
          renderResult(
            {
              ok: true,
              error: null,
              status: 401,
              headers: '',
              body: JSON.stringify({
                message: 'Unauthenticated.',
                hint: 'El tester no envió Authorization. Vuelve a pegar el Bearer Token y pulsa Enviar (no dejes el campo vacío).',
              }),
              elapsed_ms: 0,
              request_headers: ['Accept: application/json'],
            },
            meta
          );
          return;
        }

        sendBtn.disabled = true;
        sendBtn.textContent = 'Enviando…';
        doRequest(def.method, url, token, body, extraHeaders).then(function (result) {
          renderResult(result, meta);
          sendBtn.disabled = false;
          sendBtn.textContent = 'Enviar solicitud';
        });
      });
    }
  }

  var api = {
    ENDPOINTS: ENDPOINTS,
    buildUrl: buildUrl,
    doRequest: doRequest,
    ensureIdempotencyKey: ensureIdempotencyKey,
    parseExtraHeaders: parseExtraHeaders,
    prettyJson: prettyJson,
    redactRequestHeaders: redactRequestHeaders,
    uuid: uuid,
    listInstances: listInstances,
    sendMessage: sendMessage,
    getAccountStatus: getAccountStatus,
    mount: mount,
  };

  global.LebytekTester = api;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})(typeof window !== 'undefined' ? window : this);
