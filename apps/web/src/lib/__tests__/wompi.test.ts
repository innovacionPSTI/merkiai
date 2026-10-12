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
describe('verifyWompiWebhook', () => {
  const payload = '{"event":"transaction.updated","data":{"transaction":{"id":"txn-1"}}}'
  const timestamp = '1720000000000'
  const secret = 'test_events_secret'

  function computeChecksum(p: string, ts: string, s: string) {
    return createHash('sha256').update(`${p}${ts}${s}`).digest('hex')
  }

  it('retorna true con firma válida', () => {
    const checksum = computeChecksum(payload, timestamp, secret)
    expect(verifyWompiWebhook(payload, timestamp, checksum, secret)).toBe(true)
  })

  it('retorna false con firma incorrecta', () => {
    expect(verifyWompiWebhook(payload, timestamp, 'firma_incorrecta', secret)).toBe(false)
  })

  it('retorna false si el payload fue alterado', () => {
    const checksum = computeChecksum(payload, timestamp, secret)
    const alteredPayload = payload.replace('txn-1', 'txn-2')
    expect(verifyWompiWebhook(alteredPayload, timestamp, checksum, secret)).toBe(false)
  })

  it('retorna false (fail-closed) cuando eventsSecret está vacío', () => {
    // Endurecimiento: sin secret NO se puede verificar → se rechaza (antes hacía
    // bypass, lo que permitía forjar un evento "APPROVED" y validar un pago falso).
    expect(verifyWompiWebhook(payload, timestamp, 'cualquier_cosa', '')).toBe(false)
    const checksum = computeChecksum(payload, timestamp, secret)
    expect(verifyWompiWebhook(payload, timestamp, checksum, '')).toBe(false)
  })

  it('retorna false cuando falta el checksum', () => {
    expect(verifyWompiWebhook(payload, timestamp, '', secret)).toBe(false)
  })
})

describe('isWompiTimestampFresh', () => {
  it('acepta un timestamp reciente', () => {
    expect(isWompiTimestampFresh(String(Date.now()))).toBe(true)
  })
  it('rechaza un timestamp antiguo (replay)', () => {
    expect(isWompiTimestampFresh(String(Date.now() - 10 * 60_000))).toBe(false)
  })
  it('rechaza un timestamp inválido', () => {
    expect(isWompiTimestampFresh('')).toBe(false)
    expect(isWompiTimestampFresh('abc')).toBe(false)
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
