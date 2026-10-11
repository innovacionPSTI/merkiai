import { reviewStats, validateReview } from '../reviews'

describe('reviewStats', () => {
  it('sin reseñas → 0/0', () => {
    expect(reviewStats([])).toEqual({ count: 0, average: 0 })
  })
  it('promedia y redondea a 1 decimal', () => {
    expect(reviewStats([{ rating: 5 }, { rating: 4 }, { rating: 4 }])).toEqual({ count: 3, average: 4.3 })
    expect(reviewStats([{ rating: 1 }, { rating: 2 }])).toEqual({ count: 2, average: 1.5 })
  })
})

describe('validateReview', () => {
  const ok = { product_id: 1, author_name: 'Ana', rating: 5, body: 'Excelente' }
  it('acepta un payload válido', () => {
    expect(validateReview(ok)).toBeNull()
  })
  it('exige producto, nombre y rating 1–5', () => {
    expect(validateReview({ ...ok, product_id: 0 })).toMatch(/producto/i)
    expect(validateReview({ ...ok, author_name: '  ' })).toMatch(/nombre/i)
    expect(validateReview({ ...ok, rating: 0 })).toMatch(/calificación/i)
    expect(validateReview({ ...ok, rating: 6 })).toMatch(/calificación/i)
  })
  it('rechaza comentario muy largo', () => {
    expect(validateReview({ ...ok, body: 'x'.repeat(2001) })).toMatch(/largo/i)
  })
})
