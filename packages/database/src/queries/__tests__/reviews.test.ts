import { reviewStats, validateReview, getApprovedReviewsPage, incrementReviewHelpful } from '../reviews'

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

describe('getApprovedReviewsPage (HU-101 v2)', () => {
  it('filtra aprobadas, pagina con range y devuelve total', async () => {
    const range = jest.fn().mockResolvedValue({ data: [{ id: 1 }], count: 7 })
    const order = jest.fn().mockReturnValue({ range })
    const eq2 = jest.fn().mockReturnValue({ order })
    const eq1 = jest.fn().mockReturnValue({ eq: eq2 })
    const select = jest.fn().mockReturnValue({ eq: eq1 })
    const db = { from: jest.fn(() => ({ select })) } as any

    const res = await getApprovedReviewsPage(db, 9, 5, 10)
    expect(select).toHaveBeenCalledWith('*', { count: 'exact' })
    expect(eq1).toHaveBeenCalledWith('product_id', 9)
    expect(eq2).toHaveBeenCalledWith('status', 'approved')
    expect(range).toHaveBeenCalledWith(10, 14)
    expect(res).toEqual({ reviews: [{ id: 1 }], total: 7 })
  })
})

describe('incrementReviewHelpful (HU-101 v2)', () => {
  it('llama al RPC y devuelve el nuevo total', async () => {
    const rpc = jest.fn().mockResolvedValue({ data: 3, error: null })
    const db = { rpc } as any
    expect(await incrementReviewHelpful(db, 5)).toBe(3)
    expect(rpc).toHaveBeenCalledWith('increment_review_helpful', { p_id: 5 })
  })
  it('devuelve null si el RPC falla o el id es inválido', async () => {
    const db = { rpc: jest.fn().mockResolvedValue({ data: null, error: { message: 'x' } }) } as any
    expect(await incrementReviewHelpful(db, 5)).toBeNull()
    expect(await incrementReviewHelpful(db, 1.5)).toBeNull()
  })
})
