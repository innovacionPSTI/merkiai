/**
 * Unit tests — lib/wompi.ts (helpers puros del webhook)
 *
 * Covers:
 *   verifyWompiWebhook     — firma válida, inválida, sin secret (fail-closed)
 *   isWompiTimestampFresh  — ventana de replay
 *   mapWompiStatus         — todos los estados de Wompi
 *
 * La construcción de la URL de pago y la re-consulta por API se prueban en
 * WompiGateway (@merkiai/database), que es la fuente única del checkout/reconcile.
 */

import { createHash } from 'crypto'
import {
  verifyWompiWebhook,
  isWompiTimestampFresh,
  mapWompiStatus,
} from '../wompi'

// ─────────────────────────────────────────────
// verifyWompiWebhook
// ─────────────────────────────────────────────
describe('verifyWompiWebhook (esquema Wompi Colombia)', () => {
  const secret = 'test_events_secret'
  const timestamp = 1720000000 // segundos
  // properties resueltas contra `data`.
  const props = ['transaction.id', 'transaction.status', 'transaction.amount_in_cents']
  const data = { transaction: { id: 'txn-1', status: 'APPROVED', amount_in_cents: 5000 } }

  function build(checksumSecret = secret) {
    const concat = `${data.transaction.id}${data.transaction.status}${data.transaction.amount_in_cents}`
    const checksum = createHash('sha256').update(`${concat}${timestamp}${checksumSecret}`).digest('hex')
    return { event: { event: 'transaction.updated', data, timestamp, signature: { properties: props, checksum } }, checksum }
  }

  it('retorna true con firma válida (checksum en el body)', () => {
    const { event } = build()
    expect(verifyWompiWebhook(event, secret)).toBe(true)
  })

  it('acepta el checksum del header X-Event-Checksum (mayúsculas)', () => {
    const { event, checksum } = build()
    const ev = { ...event, signature: { properties: props } } // sin checksum en body
    expect(verifyWompiWebhook(ev, secret, checksum.toUpperCase())).toBe(true)
  })

  it('retorna false con firma incorrecta', () => {
    const { event } = build()
    expect(verifyWompiWebhook({ ...event, signature: { properties: props, checksum: 'mal' } }, secret)).toBe(false)
  })

  it('retorna false si los datos firmados fueron alterados', () => {
    const { event } = build()
    const tampered = { ...event, data: { transaction: { ...data.transaction, amount_in_cents: 1 } } }
    expect(verifyWompiWebhook(tampered, secret)).toBe(false)
  })

  it('retorna false (fail-closed) sin secret, sin checksum o sin properties', () => {
    const { event, checksum } = build()
    expect(verifyWompiWebhook(event, '')).toBe(false)
    expect(verifyWompiWebhook({ ...event, signature: { properties: props } }, secret)).toBe(false)
    expect(verifyWompiWebhook({ ...event, signature: { checksum } }, secret)).toBe(false)
  })
})

describe('isWompiTimestampFresh', () => {
  it('acepta un timestamp reciente (ms o segundos)', () => {
    expect(isWompiTimestampFresh(Date.now())).toBe(true)
    expect(isWompiTimestampFresh(Math.floor(Date.now() / 1000))).toBe(true)
  })
  it('rechaza un timestamp antiguo (replay)', () => {
    expect(isWompiTimestampFresh(Math.floor((Date.now() - 10 * 60_000) / 1000))).toBe(false)
  })
  it('rechaza un timestamp inválido', () => {
    expect(isWompiTimestampFresh('')).toBe(false)
    expect(isWompiTimestampFresh('abc')).toBe(false)
    expect(isWompiTimestampFresh(undefined)).toBe(false)
  })
})

// ─────────────────────────────────────────────
// mapWompiStatus
// ─────────────────────────────────────────────
describe('mapWompiStatus', () => {
  it('mapea APPROVED → approved', () => {
    expect(mapWompiStatus('APPROVED')).toBe('approved')
  })

  it('mapea DECLINED → rejected', () => {
    expect(mapWompiStatus('DECLINED')).toBe('rejected')
  })

  it('mapea ERROR → rejected', () => {
    expect(mapWompiStatus('ERROR')).toBe('rejected')
  })

  it('mapea VOIDED → rejected', () => {
    expect(mapWompiStatus('VOIDED')).toBe('rejected')
  })

  it('mapea PENDING → pending', () => {
    expect(mapWompiStatus('PENDING')).toBe('pending')
  })

  it('usa pending como fallback para estados desconocidos', () => {
    expect(mapWompiStatus('UNKNOWN_STATUS')).toBe('pending')
    expect(mapWompiStatus('')).toBe('pending')
  })
})
