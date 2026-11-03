/**
 * Unit tests — control de inventario (Épica 9 · HU-098).
 * Verifica idempotencia del descuento/reposición y el mapeo de getStockForVariants.
 */

import { applyStockForOrder, restoreStockForOrder, getStockForVariants, isLedgerSaleEnabled, mergeLedgerAvailability, type VariantStock } from '../stock'
import { createServerClient } from '../../client'

jest.mock('../../client')
const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>

const mockMaybeSingle = jest.fn()
const mockIn = jest.fn()
const mockRpc = jest.fn().mockResolvedValue({ data: true, error: null })

// Cadena flexible: soporta update().eq()…().select().maybeSingle() y select().in()
function buildClient() {
  const chain: Record<string, unknown> = {}
  chain.update = () => chain
  chain.eq = () => chain
  chain.select = () => chain
  chain.in = (...args: unknown[]) => mockIn(...args)
  chain.maybeSingle = () => mockMaybeSingle()
  return { from: () => chain, rpc: mockRpc }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockCreateServerClient.mockReturnValue(buildClient() as never)
})

describe('applyStockForOrder', () => {
  it('descuenta el stock de cada ítem cuando reclama el pedido (stock_applied false→true)', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: { items: [
      { variant_id: 10, qty: 2 },
      { variant_id: 11, qty: 1 },
    ] } })

    await applyStockForOrder('ORD-0001')

    expect(mockRpc).toHaveBeenCalledWith('decrement_variant_stock', { p_variant_id: 10, p_qty: 2 })
    expect(mockRpc).toHaveBeenCalledWith('decrement_variant_stock', { p_variant_id: 11, p_qty: 1 })
  })

  it('es idempotente: si el pedido ya estaba descontado no llama al RPC', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null }) // no reclamó (ya aplicado)
    await applyStockForOrder('ORD-0001')
    expect(mockRpc).not.toHaveBeenCalled()
  })
})

describe('restoreStockForOrder', () => {
  it('repone el stock de cada ítem cuando reclama el pedido', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: { items: [{ variant_id: 10, qty: 2 }] } })
    await restoreStockForOrder('ORD-0002')
    expect(mockRpc).toHaveBeenCalledWith('restore_variant_stock', { p_variant_id: 10, p_qty: 2 })
  })

  it('no hace nada si no reclama (ya repuesto o nunca descontado)', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null })
    await restoreStockForOrder('ORD-0002')
    expect(mockRpc).not.toHaveBeenCalled()
  })
})

describe('isLedgerSaleEnabled (E18·HU-178 flag)', () => {
  it('off por defecto / valores no verdaderos', () => {
    expect(isLedgerSaleEnabled({})).toBe(false)
    expect(isLedgerSaleEnabled({ MERKIAI_LEDGER_SALE: '0' })).toBe(false)
    expect(isLedgerSaleEnabled({ MERKIAI_LEDGER_SALE: 'no' })).toBe(false)
  })
  it('on con 1/true/on', () => {
    expect(isLedgerSaleEnabled({ MERKIAI_LEDGER_SALE: '1' })).toBe(true)
    expect(isLedgerSaleEnabled({ MERKIAI_LEDGER_SALE: 'true' })).toBe(true)
    expect(isLedgerSaleEnabled({ MERKIAI_LEDGER_SALE: 'ON' })).toBe(true)
  })
})

describe('mergeLedgerAvailability (E18·HU-178 F3b)', () => {
  const base: VariantStock[] = [
    { variant_id: 1, stock: 99, allow_backorder: false }, // enlazada directa → usa ledger
    { variant_id: 2, stock: 7, allow_backorder: true },   // no enlazada → legacy
  ]
  it('sobrescribe stock de enlazadas directas con el disponible del ledger', () => {
    const finished = new Map([[1, 500]])
    const out = mergeLedgerAvailability(base, finished, { 500: 12 })
    expect(out.find((r) => r.variant_id === 1)!.stock).toBe(12)
    expect(out.find((r) => r.variant_id === 2)!.stock).toBe(7) // intacta
  })
  it('sin disponible en el ledger → 0 para la enlazada', () => {
    const out = mergeLedgerAvailability(base, new Map([[1, 500]]), {})
    expect(out.find((r) => r.variant_id === 1)!.stock).toBe(0)
  })
})

describe('getStockForVariants', () => {
  it('mapea stock y allow_backorder (products como objeto)', async () => {
    mockIn.mockResolvedValueOnce({ data: [
      { id: 10, stock: 5, products: { allow_backorder: true } },
      { id: 11, stock: 0, products: { allow_backorder: false } },
    ], error: null })

    const out = await getStockForVariants([10, 11])
    expect(out).toEqual([
      { variant_id: 10, stock: 5, allow_backorder: true },
      { variant_id: 11, stock: 0, allow_backorder: false },
    ])
  })

  it('devuelve [] si no hay variantes', async () => {
    expect(await getStockForVariants([])).toEqual([])
    expect(mockIn).not.toHaveBeenCalled()
  })
})
