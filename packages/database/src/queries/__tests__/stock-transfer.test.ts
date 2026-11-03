import { planTransferMovements } from '../stock-transfer'

describe('transferencias entre sedes (E18, plan puro)', () => {
  it('genera salida en origen y entrada en destino', () => {
    const legs = planTransferMovements(1, 2)
    expect(legs).toEqual([
      { direction: 'out', location_id: 1 },
      { direction: 'in', location_id: 2 },
    ])
  })
})
