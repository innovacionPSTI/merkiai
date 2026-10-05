import { buildCategoryTree } from '../products'

const cat = (id: number, parent_id: number | null = null, name = `c${id}`) =>
  ({ id, name, slug: name, parent_id, description: null, image_url: null, meta_title: null, meta_description: null, order_index: id, active: true, tenant_id: 't', created_at: 'x' }) as any

describe('buildCategoryTree (HU-263)', () => {
  it('arma raíces e hijos por parent_id', () => {
    const tree = buildCategoryTree([cat(1), cat(2, 1), cat(3, 1), cat(4)])
    expect(tree.map((t) => t.id)).toEqual([1, 4])
    expect(tree[0].children.map((c) => c.id)).toEqual([2, 3])
    expect(tree[1].children).toEqual([])
  })

  it('padre inexistente → tratado como raíz (defensivo)', () => {
    const tree = buildCategoryTree([cat(5, 99)])
    expect(tree.map((t) => t.id)).toEqual([5])
  })

  it('conserva el orden de entrada', () => {
    const tree = buildCategoryTree([cat(10), cat(2), cat(7)])
    expect(tree.map((t) => t.id)).toEqual([10, 2, 7])
  })
})
