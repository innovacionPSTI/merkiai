import { yieldRatio, producedLotUnitCost } from '../production'

describe('producción (HU-405, puros)', () => {
  it('yieldRatio = obtenido / planificado', () => {
    expect(yieldRatio(100, 95)).toBe(0.95)   // 5% de merma
    expect(yieldRatio(10, 10)).toBe(1)
    expect(yieldRatio(0, 5)).toBe(0)
  })

  it('producedLotUnitCost = costo total / base obtenida', () => {
    // 100 kg de materia a costo total 2.300.000, producidos 400 paquetes (base)
    expect(producedLotUnitCost(2300000, 400)).toBe(5750)
    expect(producedLotUnitCost(1000, 0)).toBe(0)
  })
})
