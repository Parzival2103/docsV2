/**
 * Cliente HTTP seguro para el sandbox docs.lebytek.com.
 * Solo rutas de demo cliente; base URL fija (sin SSRF).
 */

const API_BASE = (import.meta.env.VITE_LEBYTEK_API_URL as string | undefined)?.replace(/\/$/, '')
  ?? 'https://api.lebytek.com/api/v1';

/** Strict allowlist: instances (+id/qr), messages (+id), account/status. */
const ALLOWED_PATH = /^\/(instances(\/[0-9A-HJKMNP-TV-Z]{26})?(\/qr)?|messages(\/[0-9A-HJKMNP-TV-Z]{26})?|account\/status)$/i;

const TOKEN_MIN = 32;
const TOKEN_MAX = 256;
const BODY_MAX = 1000;
const LABEL_MAX = 255;
const PHONE_MIN = 10;
const PHONE_MAX = 15;
const RECIPIENT_MAX = 48;
const GROUP_RECIPIENT = /^\d{10,32}@g\.us$/;

export class LebytekApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message);
    this.name = 'LebytekApiError';
  }
}

export function validateToken(token: string): string {
  const t = token.trim();
  if (t.length < TOKEN_MIN || t.length > TOKEN_MAX) {
    throw new Error(`El token debe tener entre ${TOKEN_MIN} y ${TOKEN_MAX} caracteres.`);
  }
  // Sanctum emite "id|plainText" (correo demo). La API también acepta solo plainText.
  if (!/^(\d+\|)?[A-Za-z0-9._-]+$/.test(t)) {
    throw new Error('Formato de token inválido. Pega el valor completo del correo (incluye el número y | si aparece).');
  }
  return t;
}

export function validateRecipient(recipient: string): string {
  const trimmed = recipient.trim();
  if (trimmed.length < 1 || trimmed.length > RECIPIENT_MAX) {
    throw new Error('Destinatario inválido.');
  }

  if (trimmed.includes('@')) {
    if (!GROUP_RECIPIENT.test(trimmed)) {
      throw new Error('ID de grupo inválido. Usa el formato completo terminado en @g.us.');
    }
    return trimmed;
  }

  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < PHONE_MIN || digits.length > PHONE_MAX) {
    throw new Error('Destinatario inválido. Usa E.164 sin + (10–15 dígitos) o un ID de grupo @g.us.');
  }
  return digits;
}

export function validateMessageBody(body: string): string {
  const b = body.trim();
  if (b.length < 1 || b.length > BODY_MAX) {
    throw new Error(`El mensaje debe tener 1–${BODY_MAX} caracteres.`);
  }
  return b;
}

function assertAllowedPath(path: string): void {
  const normalized = path.split('?')[0];
  if (!ALLOWED_PATH.test(normalized)) {
    throw new Error('Ruta no permitida en el sandbox.');
  }
}

function idempotencyKey(): string {
  return crypto.randomUUID();
}

export async function lebytekFetch<T = unknown>(
  token: string,
  method: 'GET' | 'POST',
  path: string,
  body?: Record<string, string>,
  options?: { idempotent?: boolean },
): Promise<{ status: number; data: T }> {
  assertAllowedPath(path);
  const safeToken = validateToken(token);

  const headers: Record<string, string> = {
    Authorization: `Bearer ${safeToken}`,
    Accept: 'application/json',
  };

  let fetchBody: string | undefined;
  if (method === 'POST') {
    headers['Content-Type'] = 'application/json';
    if (options?.idempotent) {
      headers['Idempotency-Key'] = idempotencyKey();
    }
    fetchBody = JSON.stringify(body ?? {});
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: fetchBody,
    credentials: 'omit',
    mode: 'cors',
  });

  let data: unknown;
  const text = await response.text();
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    const msg = typeof data === 'object' && data !== null && 'message' in data
      ? String((data as { message: string }).message)
      : `HTTP ${response.status}`;
    throw new LebytekApiError(msg, response.status, data);
  }

  return { status: response.status, data: data as T };
}

export interface InstanceResource {
  publicId: string;
  status: string;
  label?: string;
  purpose?: string;
  lastError?: string | null;
  greenState?: string | null;
}

export interface QrResponse {
  qr: string;
  expiresAt?: string;
}

export interface MessageResource {
  publicId: string;
  status: string;
  recipient: string;
  body: string;
  error?: string | null;
  sentAt?: string | null;
}

export interface InstanceQuota {
  used: number;
  limit: number | null;
}

export interface AccountStatus {
  requestedAt?: string;
  commercialStatus?: string;
  plan?: {
    slug?: string;
    name?: string;
    messagesPerMonthLimit?: number | null;
  };
  demo?: {
    startedAt?: string | null;
    expiresAt?: string | null;
    daysRemaining?: number | null;
    isExpired?: boolean;
  };
  usage?: {
    messagesSentThisMonth?: number;
    messagesRemainingThisMonth?: number | null;
    messagesLimitThisMonth?: number | null;
  };
  instances?: InstanceQuota;
}

export type InstancePurpose = 'demo' | 'production';

export interface CreateInstanceInput {
  label: string;
  externalRef?: string;
  purpose?: InstancePurpose;
}

export async function listInstances(token: string): Promise<InstanceResource[]> {
  const { data } = await lebytekFetch<{ data?: InstanceResource[] }>(token, 'GET', '/instances');
  return data?.data ?? (Array.isArray(data) ? data as InstanceResource[] : []);
}

export async function getInstance(token: string, publicId: string): Promise<InstanceResource> {
  const { data } = await lebytekFetch<InstanceResource>(token, 'GET', `/instances/${publicId}`);
  return data;
}

export async function getQr(
  token: string,
  publicId: string,
  options?: { force?: boolean },
): Promise<QrResponse> {
  const query = options?.force ? '?force=1' : '';
  const { data } = await lebytekFetch<QrResponse>(token, 'GET', `/instances/${publicId}/qr${query}`);
  return data;
}

export async function createInstance(
  token: string,
  input: CreateInstanceInput,
): Promise<{ status: number; data: InstanceResource }> {
  const label = input.label.trim();
  if (label.length < 1 || label.length > LABEL_MAX) {
    throw new Error(`La etiqueta debe tener 1–${LABEL_MAX} caracteres.`);
  }

  const body: Record<string, string> = { label };
  const externalRef = input.externalRef?.trim();
  if (externalRef) {
    if (externalRef.length > LABEL_MAX) {
      throw new Error(`externalRef no puede superar ${LABEL_MAX} caracteres.`);
    }
    body.externalRef = externalRef;
  }
  if (input.purpose === 'demo' || input.purpose === 'production') {
    body.purpose = input.purpose;
  }

  return lebytekFetch<InstanceResource>(token, 'POST', '/instances', body, { idempotent: true });
}

export async function getAccountStatus(token: string): Promise<AccountStatus> {
  const { data } = await lebytekFetch<AccountStatus>(token, 'POST', '/account/status');
  return data;
}

export async function sendMessage(
  token: string,
  instancePublicId: string,
  recipient: string,
  body: string,
): Promise<MessageResource> {
  const { data } = await lebytekFetch<MessageResource>(token, 'POST', '/messages', {
    recipient: validateRecipient(recipient),
    body: validateMessageBody(body),
    instancePublicId,
  }, { idempotent: true });
  return data;
}

export async function getMessage(token: string, publicId: string): Promise<MessageResource> {
  const { data } = await lebytekFetch<MessageResource>(token, 'GET', `/messages/${publicId}`);
  return data;
}

/** Exported for unit-style checks of the anti-SSRF allowlist (same regex as fetch). */
export function isAllowedSandboxPath(path: string): boolean {
  return ALLOWED_PATH.test(path.split('?')[0]);
}

export { API_BASE };
