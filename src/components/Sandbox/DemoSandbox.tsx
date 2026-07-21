import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MessageSquare,
  QrCode,
  Shield,
  Smartphone,
} from 'lucide-react';
import {
  getInstance,
  getMessage,
  getQr,
  LebytekApiError,
  listInstances,
  sendMessage,
  validateToken,
  type InstanceResource,
  type MessageResource,
} from '../../lib/lebytekApi';
import TokenPasteField from './TokenPasteField';

const STORAGE_KEY = 'lebytek_sandbox_token_v1';
const QR_COOLDOWN_MS = 5000;
const DEFAULT_MESSAGE = '¡Hola! Mi primera prueba con Lebytek API 🚀';

type Step = 'token' | 'link' | 'send' | 'done';

function StepBadge({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className={`flex items-center gap-2 text-sm ${active ? 'text-indigo-600 font-medium' : done ? 'text-emerald-600' : 'text-slate-400'}`}>
      <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold border ${
        done ? 'bg-emerald-100 border-emerald-300' : active ? 'bg-indigo-100 border-indigo-300' : 'bg-slate-100 border-slate-200'
      }`}>{done ? '✓' : n}</span>
      <span className="hidden sm:inline">{label}</span>
    </div>
  );
}

export default function DemoSandbox() {
  const [step, setStep] = useState<Step>('token');
  const [token, setToken] = useState(() => sessionStorage.getItem(STORAGE_KEY) ?? '');
  const [instance, setInstance] = useState<InstanceResource | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [recipient, setRecipient] = useState('');
  const [messageBody, setMessageBody] = useState(DEFAULT_MESSAGE);
  const [sentMessage, setSentMessage] = useState<MessageResource | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrEpoch, setQrEpoch] = useState(0);
  const lastQrFetch = useRef(0);
  const qrRequestId = useRef(0);
  const qrInflight = useRef(0);
  const instanceRef = useRef<InstanceResource | null>(null);
  const tokenRef = useRef(token);
  const hasQrRef = useRef(false);

  instanceRef.current = instance;
  tokenRef.current = token;
  hasQrRef.current = qrDataUrl !== null;

  const clearError = () => setError(null);

  const connectWithToken = useCallback(async (rawToken: string) => {
    clearError();
    setLoading(true);
    try {
      const safe = validateToken(rawToken);
      sessionStorage.setItem(STORAGE_KEY, safe);
      setToken(safe);

      const instances = await listInstances(safe);
      if (instances.length === 0) {
        throw new Error('No hay instancias en tu demo. Revisa el correo o contacta soporte.');
      }

      const inst = instances[0];
      const fresh = await getInstance(safe, inst.publicId);
      setInstance(fresh);
      setStep('link');

      if (fresh.status === 'failed') {
        setError(
          fresh.lastError
            ? `La instancia demo falló al provisionarse en Green API: ${fresh.lastError}`
            : 'La instancia demo falló al provisionarse. Contacta soporte o reintenta más tarde.',
        );
        return;
      }

      if (fresh.status === 'authorized') {
        setQrDataUrl(null);
        hasQrRef.current = false;
      }
    } catch (e) {
      sessionStorage.removeItem(STORAGE_KEY);
      setError(e instanceof LebytekApiError ? e.message : (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshQr = useCallback(async (force = false) => {
    const currentToken = tokenRef.current;
    const currentInstance = instanceRef.current;
    if (!currentToken || !currentInstance) return;

    const now = Date.now();
    if (!force && now - lastQrFetch.current < QR_COOLDOWN_MS) return;

    const requestId = ++qrRequestId.current;
    qrInflight.current += 1;
    setQrLoading(true);
    if (force) clearError();

    try {
      const fresh = await getInstance(currentToken, currentInstance.publicId);
      if (requestId !== qrRequestId.current) return;

      setInstance(fresh);

      if (fresh.status === 'authorized') {
        setQrDataUrl(null);
        hasQrRef.current = false;
        clearError();
        return;
      }

      // force=true pide un QR nuevo a Green (evita devolver el PNG cacheado ~20s).
      const qr = await getQr(currentToken, currentInstance.publicId, { force });
      if (requestId !== qrRequestId.current) return;

      lastQrFetch.current = Date.now();
      if (!qr.qr) {
        setError('La API devolvió un QR vacío. Intenta refrescar en unos segundos.');
        return;
      }
      setQrDataUrl(`data:image/png;base64,${qr.qr}`);
      hasQrRef.current = true;
      setQrEpoch((n) => n + 1);
      clearError();
    } catch (e) {
      if (requestId !== qrRequestId.current) return;

      if (e instanceof LebytekApiError && e.status === 409) {
        const fresh = await getInstance(currentToken, currentInstance.publicId);
        if (requestId !== qrRequestId.current) return;
        setInstance(fresh);
        if (fresh.status === 'authorized') {
          setQrDataUrl(null);
          hasQrRef.current = false;
          clearError();
        } else if (!hasQrRef.current) {
          setError('Instancia no lista para QR. Espera unos segundos e intenta de nuevo.');
        }
      } else if (!hasQrRef.current) {
        setError(e instanceof LebytekApiError ? e.message : (e as Error).message);
      }
    } finally {
      qrInflight.current = Math.max(0, qrInflight.current - 1);
      if (qrInflight.current === 0) {
        setQrLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (step !== 'link' || !instance || instance.status === 'authorized') return;
    if (instance.status === 'failed' || instance.status === 'deleted') return;

    let cancelled = false;

    void refreshQr(true);

    const statusInterval = window.setInterval(() => {
      const currentToken = tokenRef.current;
      const currentInstance = instanceRef.current;
      if (!currentToken || !currentInstance) return;

      void getInstance(currentToken, currentInstance.publicId)
        .then((fresh) => {
          if (cancelled) return;
          setInstance(fresh);
          if (fresh.status === 'authorized') {
            setQrDataUrl(null);
            hasQrRef.current = false;
            clearError();
          }
        })
        .catch(() => undefined);
    }, 8000);

    // Green QR ~20s: forzar nuevo código antes de que expire el cacheado.
    const qrInterval = window.setInterval(() => {
      if (!cancelled) void refreshQr(true);
    }, 18000);

    return () => {
      cancelled = true;
      qrRequestId.current += 1;
      clearInterval(statusInterval);
      clearInterval(qrInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, instance?.publicId, instance?.status, token]);

  const handleSend = async () => {
    if (!token || !instance) return;
    clearError();
    setLoading(true);
    try {
      // Revalidar estado real antes de enviar (evita authorized obsoleto en BD).
      const fresh = await getInstance(token, instance.publicId);
      setInstance(fresh);
      if (fresh.status !== 'authorized') {
        setStep('link');
        setError('La instancia ya no está autorizada. Escanea el QR de nuevo.');
        return;
      }

      const msg = await sendMessage(token, instance.publicId, recipient, messageBody);
      setSentMessage(msg);
      setStep('done');

      const poll = window.setInterval(async () => {
        try {
          const updated = await getMessage(token, msg.publicId);
          setSentMessage(updated);
          if (updated.status === 'sent' || updated.status === 'failed') {
            clearInterval(poll);
          }
        } catch {
          clearInterval(poll);
        }
      }, 3000);
    } catch (e) {
      setError(e instanceof LebytekApiError ? e.message : (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const resetSandbox = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    qrRequestId.current += 1;
    setToken('');
    setInstance(null);
    setQrDataUrl(null);
    setSentMessage(null);
    setError(null);
    setStep('token');
  };

  return (
    <div className="max-w-2xl mx-auto w-full pb-16">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 text-indigo-700 px-3 py-1 text-xs font-semibold mb-4">
          <Shield className="w-3.5 h-3.5" />
          Sandbox seguro — solo token demo
        </div>
        <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">
          Prueba tu demo en 5 minutos
        </h1>
        <p className="mt-2 text-slate-600">
          Pega el token del <strong>segundo correo</strong> (formato <code className="font-mono text-sm">15|…</code>),
          vincula WhatsApp y envía tu primer mensaje. El token queda en esta pestaña (sessionStorage).
        </p>
      </div>

      <div className="flex flex-wrap gap-4 mb-8 pb-6 border-b border-slate-200">
        <StepBadge n={1} label="Token" active={step === 'token'} done={step !== 'token'} />
        <StepBadge n={2} label="Vincular WhatsApp" active={step === 'link'} done={step === 'send' || step === 'done'} />
        <StepBadge n={3} label="Enviar mensaje" active={step === 'send'} done={step === 'done'} />
        <StepBadge n={4} label="¡Listo!" active={step === 'done'} done={false} />
      </div>

      {error && (
        <div className="mb-6 flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {step === 'token' && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <TokenPasteField
            id="demo-token"
            value={token}
            onChange={setToken}
            disabled={loading}
          />
          <p className="text-xs text-slate-500">
            Permisos incluidos: instancias.ver, mensajes.enviar, mensajes.ver. No compartas este token.
          </p>
          <button
            type="button"
            disabled={loading || token.trim().length < 32}
            onClick={() => void connectWithToken(token)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Continuar
          </button>
        </div>
      )}

      {step === 'link' && instance && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">Instancia demo</p>
              <p className="font-mono text-sm">{instance.publicId}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
              instance.status === 'authorized'
                ? 'bg-emerald-100 text-emerald-800'
                : instance.status === 'failed'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-amber-100 text-amber-800'
            }`}>
              {instance.status}
            </span>
          </div>

          {instance.status === 'failed' ? (
            <div className="flex gap-3 items-start rounded-lg bg-red-50 border border-red-200 p-4">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <p className="font-medium text-red-900">No se pudo crear la instancia en Green API</p>
                <p className="text-sm text-red-800 mt-1">
                  {instance.lastError
                    ?? 'El proveedor devolvió un error al crear la instancia. Revisa con soporte o intenta más tarde.'}
                </p>
              </div>
            </div>
          ) : instance.status === 'authorized' ? (
            <div className="flex gap-3 items-start rounded-lg bg-emerald-50 border border-emerald-200 p-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-medium text-emerald-900">WhatsApp vinculado</p>
                <p className="text-sm text-emerald-800 mt-1">Ya puedes enviar tu mensaje de prueba.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center space-y-3">
                <p className="text-sm text-slate-600 flex items-center justify-center gap-2">
                  <QrCode className="w-4 h-4" />
                  WhatsApp → Dispositivos vinculados → Vincular dispositivo
                </p>
                {qrDataUrl ? (
                  <img
                    key={qrEpoch}
                    src={qrDataUrl}
                    alt="QR WhatsApp"
                    className="mx-auto max-w-[240px] rounded-lg border border-slate-200 bg-white p-2"
                  />
                ) : (
                  <div className="py-12 text-slate-400 flex justify-center">
                    {qrLoading ? <Loader2 className="w-8 h-8 animate-spin" /> : 'Generando QR…'}
                  </div>
                )}
                <button
                  type="button"
                  disabled={qrLoading}
                  onClick={() => void refreshQr(true)}
                  className="text-sm text-indigo-600 hover:underline disabled:opacity-50"
                >
                  {qrLoading ? 'Actualizando…' : 'Refrescar QR'}
                </button>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              disabled={instance.status !== 'authorized'}
              onClick={() => setStep('send')}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40"
            >
              <MessageSquare className="w-4 h-4" />
              Enviar mensaje de prueba
            </button>
            <button type="button" onClick={resetSandbox} className="text-sm text-slate-500 hover:text-slate-800">
              Cambiar token
            </button>
          </div>
        </div>
      )}

      {step === 'send' && instance && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <label className="block text-sm font-medium text-slate-700" htmlFor="recipient">
            Destinatario (teléfono E.164 o ID de grupo @g.us)
          </label>
          <input
            id="recipient"
            type="text"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
            placeholder="5215512345678 o 120363…@g.us"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />
          <label className="block text-sm font-medium text-slate-700" htmlFor="body">
            Mensaje
          </label>
          <textarea
            id="body"
            maxLength={1000}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[80px]"
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
          />
          <div className="flex gap-3">
            <button
              type="button"
              disabled={loading || recipient.trim().length < 10}
              onClick={() => void handleSend()}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
              Enviar a WhatsApp
            </button>
            <button type="button" onClick={() => setStep('link')} className="text-sm text-slate-500 hover:text-slate-800">
              Volver
            </button>
          </div>
        </div>
      )}

      {step === 'done' && sentMessage && (
        <div className={`rounded-xl border p-6 shadow-sm space-y-4 ${
          sentMessage.status === 'failed'
            ? 'border-red-200 bg-red-50'
            : 'border-emerald-200 bg-emerald-50'
        }`}>
          <div className="flex gap-3">
            {sentMessage.status === 'failed' ? (
              <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            )}
            <div>
              <h2 className={`text-lg font-semibold ${
                sentMessage.status === 'failed' ? 'text-red-900' : 'text-emerald-900'
              }`}>
                {sentMessage.status === 'failed'
                  ? 'El mensaje no se pudo entregar'
                  : sentMessage.status === 'sent'
                    ? '¡Mensaje enviado!'
                    : '¡Mensaje encolado!'}
              </h2>
              <p className={`text-sm mt-1 ${
                sentMessage.status === 'failed' ? 'text-red-800' : 'text-emerald-800'
              }`}>
                {sentMessage.status === 'failed' && sentMessage.error
                  ? sentMessage.error
                  : (
                    <>
                      {sentMessage.recipient.includes('@g.us')
                        ? <>Revisa el grupo <strong>{sentMessage.recipient}</strong>.</>
                        : <>Revisa WhatsApp en <strong>{sentMessage.recipient}</strong>.</>}
                      {' '}Estado: <strong>{sentMessage.status}</strong>
                      {sentMessage.status === 'queued' && ' (procesando en segundos…)'}
                    </>
                  )}
              </p>
            </div>
          </div>
          <pre className={`text-xs font-mono bg-white/80 rounded-lg p-3 overflow-auto border ${
            sentMessage.status === 'failed' ? 'border-red-100' : 'border-emerald-100'
          }`}>
            {JSON.stringify(sentMessage, null, 2)}
          </pre>
          <button type="button" onClick={resetSandbox} className="text-sm font-medium text-indigo-600 hover:underline">
            Probar de nuevo con otro token
          </button>
        </div>
      )}

      <div className="mt-10 rounded-lg bg-slate-100 p-4 text-xs text-slate-600 space-y-1">
        <p><strong>Seguridad:</strong> llamadas directas a api.lebytek.com desde tu navegador (CORS). Rate limit 60 req/min y 10 envíos/min por demo.</p>
        <p><strong>Privacidad:</strong> el token no se envía a docs.lebytek.com; solo se guarda en sessionStorage de tu navegador.</p>
        <p>
          <strong>Tester PHP:</strong>{' '}
          <a href="#tester" className="text-indigo-600 font-medium hover:underline">
            Abrir API Tester
          </a>
          {' · '}
          <a
            href="/tester.php?download=1"
            className="text-indigo-600 font-medium hover:underline"
          >
            Descargar tester.php
          </a>
          {' '}para tu propio servidor (PHP + cURL).
        </p>
      </div>
    </div>
  );
}
