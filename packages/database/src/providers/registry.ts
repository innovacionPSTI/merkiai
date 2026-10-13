/**
 * Registry declarativo de proveedores (ADR-004 · HU-276).
 *
 * Cada proveedor describe: etiqueta, descripción, campos de credenciales (para
 * render del wizard en el admin), detección de entorno y claves requeridas para
 * poder activarse. Agregar un proveedor nuevo = una entrada aquí (la UI y la
 * resolución lo toman sin cambios de código). Server-safe (sin React).
 *
 * Las CLAVES de `credentials` son genéricas y estables (p. ej. 'public_key').
 * El mapeo a cada Gateway concreto vive en providers/payment/index.ts.
 */
import type { IntegrationEnv } from '../queries/integration-instances'

export interface ProviderField {
  key: string
  label: string
  type: 'text' | 'secret'
  placeholder?: string
  hint?: string
  /** Requerido para poder ACTIVAR (no solo guardar). */
  required?: boolean
}

export interface ProviderDef {
  kind: 'payment' | 'shipping' | 'email'
  provider: string
  label: string
  description: string
  fields: ProviderField[]
  /** Detecta el entorno a partir de las credenciales/ajustes ya ingresados. */
  detectEnv: (creds: Record<string, string | undefined>, settings?: Record<string, unknown>) => IntegrationEnv | 'unknown'
  /** Claves de credenciales requeridas para activar. */
  requiredKeys: string[]
}

const byPrefix = (v: string | undefined, prodPrefixes: string[], testPrefixes: string[]): IntegrationEnv | 'unknown' => {
  if (!v) return 'unknown'
  if (prodPrefixes.some((p) => v.startsWith(p))) return 'production'
  if (testPrefixes.some((p) => v.startsWith(p))) return 'test'
  return 'unknown'
}

export const PAYMENT_PROVIDERS: ProviderDef[] = [
  {
    kind: 'payment',
    provider: 'wompi',
    label: 'Wompi',
    description: 'Tarjeta débito/crédito, PSE, Bancolombia Button',
    fields: [
      { key: 'public_key',       label: 'Llave pública (pub_…)',       type: 'text',   placeholder: 'pub_test_… o pub_prod_…', hint: 'Visible en el frontend.', required: true },
      { key: 'private_key',      label: 'Llave privada (prv_…)',       type: 'secret', placeholder: 'prv_test_… o prv_prod_…', hint: 'Re-consulta de transacciones. Nunca se expone.' },
      { key: 'integrity_secret', label: 'Llave de integridad',          type: 'secret', placeholder: 'test_integrity_… o prod_integrity_…', hint: 'Firma del checkout. Panel Wompi → Integridad (no es la de eventos).', required: true },
      { key: 'events_secret',    label: 'Llave de eventos (webhooks)',  type: 'secret', placeholder: 'test_events_… o prod_events_…', hint: 'Verifica el webhook. Panel Wompi → Webhooks.' },
    ],
    detectEnv: (c) => byPrefix(c.public_key, ['pub_prod'], ['pub_test']),
    requiredKeys: ['public_key', 'integrity_secret'],
  },
  {
    kind: 'payment',
    provider: 'mercadopago',
    label: 'MercadoPago',
    description: 'Tarjeta, efectivo, Nequi, Daviplata',
    fields: [
      { key: 'public_key',     label: 'Public Key',     type: 'text',   placeholder: 'TEST-… o APP_USR-…', hint: 'Checkout Brick. Panel MP → Credenciales.' },
      { key: 'access_token',   label: 'Access Token',   type: 'secret', placeholder: 'TEST-… o APP_USR-…', hint: 'Credencial privada de servidor.', required: true },
      { key: 'webhook_secret', label: 'Clave del webhook (x-signature)', type: 'secret', placeholder: 'Clave secreta de la firma', hint: 'Opcional (el estado se re-consulta a la API).' },
    ],
    detectEnv: (c) => byPrefix(c.public_key || c.access_token, ['APP_USR'], ['TEST']),
    requiredKeys: ['access_token'],
  },
  {
    kind: 'payment',
    provider: 'tucompra',
    label: 'Tu Compra',
    description: 'Tarjeta, efectivo, Nequi, PSE',
    fields: [
      { key: 'user',           label: 'Usuario',                 type: 'text',   placeholder: 'Usuario de autenticación', required: true },
      { key: 'password',       label: 'Contraseña (clave)',      type: 'secret', placeholder: 'Clave de autenticación', required: true },
      { key: 'terminal',       label: 'Terminal (Id Sistema)',   type: 'text',   placeholder: 'Terminal / Id Sistema', required: true },
      { key: 'encryption_key', label: 'Llave de encriptación',   type: 'secret', placeholder: 'Llave de encriptación (MD5)', hint: 'Verifica la firma de la URL de Confirmación.' },
    ],
    // El entorno de Tu Compra se define por la URL del API (en settings).
    detectEnv: (_c, s) => {
      const url = (s?.api_url as string | undefined) ?? ''
      if (/ws2\.tucompra\.com\.co/.test(url)) return 'production'
      if (url) return 'test'
      return 'unknown'
    },
    requiredKeys: ['user', 'password', 'terminal'],
  },
  {
    kind: 'payment',
    provider: 'bold',
    label: 'Bold',
    description: 'Tarjeta, PSE, Nequi, Botón Bancolombia',
    fields: [
      { key: 'api_key',    label: 'Llave de identidad (API key)', type: 'secret', placeholder: 'Llave de identidad Bold', hint: 'x-api-key al crear links.', required: true },
      { key: 'secret_key', label: 'Llave secreta (webhook)',      type: 'secret', placeholder: 'Llave secreta Bold', hint: 'Firma HMAC del webhook. En sandbox va vacía.' },
    ],
    detectEnv: (_c, s) => ((s?.sandbox ?? true) ? 'test' : 'production'),
    requiredKeys: ['api_key'],
  },
]

export function getProviderDef(kind: ProviderDef['kind'], provider: string): ProviderDef | undefined {
  const list = kind === 'payment' ? PAYMENT_PROVIDERS : []
  return list.find((p) => p.provider === provider)
}

/** ¿Las credenciales cumplen los requeridos para activar? Devuelve las faltantes. */
export function missingRequired(def: ProviderDef, creds: Record<string, string | undefined>): string[] {
  return def.requiredKeys.filter((k) => !creds[k] || !String(creds[k]).trim())
}
