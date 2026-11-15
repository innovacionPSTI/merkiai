import {
  normalizeLines, buildEqualInstallments, validateCustomInstallments, minAdvanceFor, installmentProgress,
  derivePaymentStatus, deriveDeliveryStatus, canDeliver, withinCreditLimit, allocatePayment,
  agingBucket, agingReport, consignmentSummary, consignmentAvailable, shouldEmitInvoice, formatDocumentNumber, isModality,
} from '../receivables-engine'

describe('líneas y totales', () => {
  it('calcula totales por línea y documento; acepta producto, servicio o texto libre', () => {
    const r = normalizeLines([
      { kind: 'item', stock_item_id: 1, description: 'Torta 1 kg', qty: 2, unit_price: 45000 },
      { kind: 'free', description: 'Decoración personalizada', qty: 1, unit_price: 20000 },
    ])
    expect(r.total).toBe(110000)
    expect(r.lines.map((l) => l.total)).toEqual([90000, 20000])
  })
  it('valida con mensajes claros', () => {
    expect(() => normalizeLines([])).toThrow(/al menos una línea/)
    expect(() => normalizeLines([{ kind: 'free', description: ' ', qty: 1, unit_price: 1 }])).toThrow(/descripción/)
    expect(() => normalizeLines([{ kind: 'free', description: 'x', qty: 0, unit_price: 1 }])).toThrow(/cantidad/)
    expect(() => normalizeLines([{ kind: 'item', description: 'x', qty: 1, unit_price: 1 }])).toThrow(/producto o servicio/)
  })
})

describe('plan de pago', () => {
  it('cuotas iguales mensuales; la última absorbe el redondeo', () => {
    const c = buildEqualInstallments(100000, 3, '2026-12-15')
    expect(c.map((i) => i.amount)).toEqual([33333, 33333, 33334])
    expect(c.map((i) => i.due_date)).toEqual(['2026-12-15', '2027-01-15', '2027-02-15'])
  })
  it('cuotas cada N días', () => {
    expect(buildEqualInstallments(1000, 2, '2026-12-01', { step: 15, unit: 'days' }).map((i) => i.due_date)).toEqual(['2026-12-01', '2026-12-16'])
  })
  it('cuotas personalizadas deben sumar lo financiado y estar en orden', () => {
    expect(validateCustomInstallments(1000, [{ due_date: '2026-12-01', amount: 400 }, { due_date: '2027-01-01', amount: 600 }])).toHaveLength(2)
    expect(() => validateCustomInstallments(1000, [{ due_date: '2026-12-01', amount: 400 }])).toThrow(/deben sumar 1000/)
    expect(() => validateCustomInstallments(1000, [{ due_date: '2027-01-01', amount: 500 }, { due_date: '2026-12-01', amount: 500 }])).toThrow(/orden/)
  })
  it('anticipo mínimo por valor o porcentaje', () => {
    expect(minAdvanceFor(200000, { percent: 30 })).toBe(60000)
    expect(minAdvanceFor(200000, { amount: 50000 })).toBe(50000)
    expect(minAdvanceFor(200000, {})).toBe(0)
  })
  it('progreso de cuotas: aplica lo pagado en orden y marca vencidas', () => {
    const p = installmentProgress([{ seq: 1, due_date: '2026-11-01', amount: 500 }, { seq: 2, due_date: '2026-12-01', amount: 500 }], 300, '2026-11-14')
    expect(p.map((i) => [i.paid, i.pending, i.overdue])).toEqual([[300, 200, true], [0, 500, false]])
  })
})

describe('estados', () => {
  const base = { current: 'open' as const, today: '2026-11-14' }
  it('pago: abierto, parcial, pagado, vencido; respeta anulado/castigado', () => {
    expect(derivePaymentStatus({ ...base, charged: 1000, balance: 1000 })).toBe('open')
    expect(derivePaymentStatus({ ...base, charged: 1000, balance: 400 })).toBe('partial')
    expect(derivePaymentStatus({ ...base, charged: 1000, balance: 0 })).toBe('paid')
    expect(derivePaymentStatus({ ...base, charged: 1000, balance: 400, dueDate: '2026-11-01' })).toBe('overdue')
    expect(derivePaymentStatus({ ...base, current: 'void', charged: 1000, balance: 0 })).toBe('void')
    expect(derivePaymentStatus({ ...base, current: 'written_off', charged: 1000, balance: 0 })).toBe('written_off')
  })
  it('mora por cuota aunque el vencimiento final sea futuro', () => {
    expect(derivePaymentStatus({ ...base, charged: 1000, balance: 900, dueDate: '2027-01-01',
      installments: [{ seq: 1, due_date: '2026-11-01', amount: 500 }, { seq: 2, due_date: '2027-01-01', amount: 500 }], paidTowardsInstallments: 100 })).toBe('overdue')
  })
  it('entrega: pendiente, parcial, entregado, devuelto', () => {
    expect(deriveDeliveryStatus([{ qty: 2, qty_delivered: 0 }])).toBe('pending')
    expect(deriveDeliveryStatus([{ qty: 2, qty_delivered: 1 }])).toBe('partial')
    expect(deriveDeliveryStatus([{ qty: 2, qty_delivered: 2 }, { qty: 1, qty_delivered: 1 }])).toBe('delivered')
    expect(deriveDeliveryStatus([{ qty: 2, qty_delivered: 2, qty_returned: 2 }])).toBe('returned')
  })
})

describe('política de entrega y cupo', () => {
  it('exigir pago completo bloquea con saldo; permitir saldo lo pasa a crédito', () => {
    expect(canDeliver({ policy: 'require_full_payment', documentBalance: 0, partyBalance: 0 })).toEqual({ ok: true })
    expect(canDeliver({ policy: 'require_full_payment', documentBalance: 100, partyBalance: 100 }).ok).toBe(false)
    expect(canDeliver({ policy: 'allow_balance_on_delivery', documentBalance: 100, partyBalance: 100 })).toEqual({ ok: true, becomesCredit: 100 })
  })
  it('respeta el cupo de la contraparte', () => {
    expect(canDeliver({ policy: 'allow_balance_on_delivery', documentBalance: 100, partyBalance: 600, creditLimit: 500 }).ok).toBe(false)
    expect(withinCreditLimit(400, 100, 500)).toBe(true)
    expect(withinCreditLimit(450, 100, 500)).toBe(false)
    expect(withinCreditLimit(1e9, 1, null)).toBe(true)
  })
})

describe('aplicación de abonos', () => {
  const open = [
    { document_id: 2, balance: 300, created_at: '2026-11-02' },
    { document_id: 1, balance: 500, created_at: '2026-11-01' },
    { document_id: 3, balance: 0, created_at: '2026-10-01' },
  ]
  it('al más antiguo primero; excedente como saldo a favor', () => {
    expect(allocatePayment(600, open)).toEqual({ allocations: [{ document_id: 1, amount: 500, line_id: null }, { document_id: 2, amount: 100, line_id: null }], surplus: 0 })
    expect(allocatePayment(1000, open).surplus).toBe(200)
  })
  it('primero el documento preferido (y su línea)', () => {
    const r = allocatePayment(200, [{ ...open[0], line_id: 9 }, open[1]], 2)
    expect(r.allocations).toEqual([{ document_id: 2, amount: 200, line_id: 9 }])
  })
  it('rechaza abonos no positivos', () => {
    expect(() => allocatePayment(0, open)).toThrow(/mayor a cero/)
  })
})

describe('reportes', () => {
  it('edades de cartera por tramo', () => {
    expect(agingBucket(null, '2026-11-14')).toBe('current')
    expect(agingBucket('2026-11-20', '2026-11-14')).toBe('current')
    expect(agingBucket('2026-11-01', '2026-11-14')).toBe('d1_30')
    expect(agingBucket('2026-09-01', '2026-11-14')).toBe('d61_90')
    expect(agingBucket('2026-01-01', '2026-11-14')).toBe('d90_plus')
    const r = agingReport([{ balance: 100, due_date: null }, { balance: 50, due_date: '2026-11-01' }, { balance: 0, due_date: '2020-01-01' }], '2026-11-14')
    expect(r).toMatchObject({ current: 100, d1_30: 50, total: 150 })
  })
  it('consignación: en poder del aliado = entregado − vendido − devuelto', () => {
    const [l] = consignmentSummary([{ description: 'Bolso', qty: 10, qty_sold: 4, qty_returned: 2, unit_price: 50000 }])
    expect(l).toMatchObject({ onHand: 4, soldValue: 200000, onHandValue: 200000 })
    expect(consignmentAvailable({ qty: 10, qty_sold: 4, qty_returned: 2 })).toBe(4)
  })
})

describe('facturación y utilidades', () => {
  it('evento configurable por modalidad (con valores por defecto)', () => {
    expect(shouldEmitInvoice(null, 'special_order', 'on_delivery')).toBe(true)
    expect(shouldEmitInvoice(null, 'consignment', 'on_settlement')).toBe(true)
    expect(shouldEmitInvoice({ special_order: 'on_payment' }, 'special_order', 'on_delivery')).toBe(false)
    expect(shouldEmitInvoice({ special_order: 'on_payment' }, 'special_order', 'on_payment')).toBe(true)
    expect(shouldEmitInvoice({ credit_sale: 'none' }, 'credit_sale', 'on_delivery')).toBe(false)
  })
  it('numeración y modalidades', () => {
    expect(formatDocumentNumber(7)).toBe('CXC-00007')
    expect(isModality('consignment')).toBe(true)
    expect(isModality('otra')).toBe(false)
  })
})
