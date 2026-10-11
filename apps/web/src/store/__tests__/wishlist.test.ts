import { useWishlistStore } from '../wishlist'

const item = (id: number) => ({ id, slug: `p${id}`, name: `P${id}`, imageUrl: null, price: 1000 * id })

beforeEach(() => { useWishlistStore.setState({ items: [] }) })

describe('useWishlistStore', () => {
  it('toggle agrega y quita', () => {
    const { toggle } = useWishlistStore.getState()
    toggle(item(1))
    expect(useWishlistStore.getState().has(1)).toBe(true)
    expect(useWishlistStore.getState().count()).toBe(1)
    toggle(item(1))
    expect(useWishlistStore.getState().has(1)).toBe(false)
    expect(useWishlistStore.getState().count()).toBe(0)
  })

  it('add no duplica; nuevos van al frente', () => {
    const { add } = useWishlistStore.getState()
    add(item(1)); add(item(2)); add(item(1))
    const items = useWishlistStore.getState().items
    expect(items.map((i) => i.id)).toEqual([2, 1])
  })

  it('remove y clear', () => {
    const { add, remove, clear } = useWishlistStore.getState()
    add(item(1)); add(item(2))
    remove(1)
    expect(useWishlistStore.getState().items.map((i) => i.id)).toEqual([2])
    clear()
    expect(useWishlistStore.getState().count()).toBe(0)
  })
})
