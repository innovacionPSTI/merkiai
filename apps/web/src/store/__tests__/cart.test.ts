/**
 * @jest-environment jsdom
 *
 * Unit tests for the Merkiai cart store (Zustand + localStorage persist).
 * Each test gets a fresh store to avoid cross-test contamination.
 */
import { act } from '@testing-library/react'
import { useCartStore } from '../cart'
import type { CartItem } from '../cart'

// ─────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────
const makeItem = (overrides: Partial<CartItem> = {}): CartItem => ({
  variantId: 1,
  productSlug: 'producto-ejemplo',
  productName: 'Producto Ejemplo',
  variantLabel: 'Variante A',
  price: 45000,
  qty: 1,
  imageUrl: '/img/producto.jpg',
  weight_kg: 0.5,
  ...overrides,
})

// Reset store state between tests
beforeEach(() => {
  act(() => {
    useCartStore.setState({ items: [] })
  })
  localStorage.clear()
})

afterEach(() => {
  // @ts-expect-error limpiar el mock de fetch entre tests
  delete global.fetch
})

// ─────────────────────────────────────────────
// Topes de stock (HU-099/100)
// ─────────────────────────────────────────────
describe('clamp de stock', () => {
  it('addItem topa la cantidad al stock disponible', () => {
    act(() => { useCartStore.getState().addItem(makeItem({ qty: 5, stock: 3 })) })
    expect(useCartStore.getState().items[0].qty).toBe(3)
  })

  it('addItem sumando sobre un ítem existente no supera el stock', () => {
    act(() => {
      useCartStore.getState().addItem(makeItem({ qty: 2, stock: 3 }))
      useCartStore.getState().addItem(makeItem({ qty: 2, stock: 3 }))
    })
    expect(useCartStore.getState().items[0].qty).toBe(3)
  })

  it('updateQty no permite superar el stock', () => {
    act(() => {
      useCartStore.getState().addItem(makeItem({ qty: 1, stock: 2 }))
      useCartStore.getState().updateQty(1, 9)
    })
    expect(useCartStore.getState().items[0].qty).toBe(2)
  })

  it('con allowBackorder no hay tope', () => {
    act(() => { useCartStore.getState().addItem(makeItem({ qty: 50, stock: 1, allowBackorder: true })) })
    expect(useCartStore.getState().items[0].qty).toBe(50)
  })
})

// ─────────────────────────────────────────────
// addItem
// ─────────────────────────────────────────────
describe('addItem', () => {
  it('agrega un item nuevo al carrito vacío', () => {
    const item = makeItem()
    act(() => { useCartStore.getState().addItem(item) })
    const { items } = useCartStore.getState()
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({ variantId: 1, qty: 1, price: 45000 })
  })

  it('incrementa la cantidad si la variante ya existe', () => {
    const item = makeItem({ qty: 2 })
    act(() => { useCartStore.getState().addItem(item) })
    act(() => { useCartStore.getState().addItem(makeItem({ qty: 3 })) })
    const { items } = useCartStore.getState()
    expect(items).toHaveLength(1)
    expect(items[0].qty).toBe(5) // 2 + 3
  })

  it('agrega variantes distintas como items separados', () => {
    act(() => { useCartStore.getState().addItem(makeItem({ variantId: 1 })) })
    act(() => { useCartStore.getState().addItem(makeItem({ variantId: 2, variantLabel: 'Variante B' })) })
    expect(useCartStore.getState().items).toHaveLength(2)
  })

  it('preserva todos los campos del item al agregar', () => {
    const item = makeItem({ price: 32000, weight_kg: 0.25, imageUrl: '/img/test.jpg' })
    act(() => { useCartStore.getState().addItem(item) })
    expect(useCartStore.getState().items[0]).toMatchObject(item)
  })
})

// ─────────────────────────────────────────────
// removeItem
// ─────────────────────────────────────────────
describe('removeItem', () => {
  it('elimina el item con el variantId indicado', () => {
    act(() => { useCartStore.getState().addItem(makeItem({ variantId: 1 })) })
    act(() => { useCartStore.getState().addItem(makeItem({ variantId: 2 })) })
    act(() => { useCartStore.getState().removeItem(1) })
    const { items } = useCartStore.getState()
    expect(items).toHaveLength(1)
    expect(items[0].variantId).toBe(2)
  })

  it('no falla si el variantId no existe en el carrito', () => {
    act(() => { useCartStore.getState().addItem(makeItem()) })
    expect(() => {
      act(() => { useCartStore.getState().removeItem(999) })
    }).not.toThrow()
    expect(useCartStore.getState().items).toHaveLength(1)
  })

  it('deja el carrito vacío si se elimina el único item', () => {
    act(() => { useCartStore.getState().addItem(makeItem()) })
    act(() => { useCartStore.getState().removeItem(1) })
    expect(useCartStore.getState().items).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────
// updateQty
// ─────────────────────────────────────────────
describe('updateQty', () => {
  it('actualiza la cantidad del item correctamente', () => {
    act(() => { useCartStore.getState().addItem(makeItem({ qty: 1 })) })
    act(() => { useCartStore.getState().updateQty(1, 4) })
    expect(useCartStore.getState().items[0].qty).toBe(4)
  })

  it('elimina el item si la cantidad se actualiza a 0', () => {
    act(() => { useCartStore.getState().addItem(makeItem()) })
    act(() => { useCartStore.getState().updateQty(1, 0) })
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('elimina el item si la cantidad es negativa', () => {
    act(() => { useCartStore.getState().addItem(makeItem()) })
    act(() => { useCartStore.getState().updateQty(1, -5) })
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('no modifica otros items al actualizar uno', () => {
    act(() => { useCartStore.getState().addItem(makeItem({ variantId: 1, qty: 1 })) })
    act(() => { useCartStore.getState().addItem(makeItem({ variantId: 2, qty: 2 })) })
    act(() => { useCartStore.getState().updateQty(1, 10) })
    const { items } = useCartStore.getState()
    expect(items.find((i) => i.variantId === 2)?.qty).toBe(2)
    expect(items.find((i) => i.variantId === 1)?.qty).toBe(10)
  })
})

// ─────────────────────────────────────────────
// clearCart
// ─────────────────────────────────────────────
describe('clearCart', () => {
  it('vacía el carrito completamente', () => {
    act(() => { useCartStore.getState().addItem(makeItem({ variantId: 1 })) })
    act(() => { useCartStore.getState().addItem(makeItem({ variantId: 2 })) })
    act(() => { useCartStore.getState().clearCart() })
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('no falla si el carrito ya está vacío', () => {
    expect(() => {
      act(() => { useCartStore.getState().clearCart() })
    }).not.toThrow()
  })
})

// ─────────────────────────────────────────────
// subtotal / total
// ─────────────────────────────────────────────
describe('subtotal y total', () => {
  it('retorna 0 para carrito vacío', () => {
    expect(useCartStore.getState().subtotal()).toBe(0)
    expect(useCartStore.getState().total()).toBe(0)
  })

  it('calcula subtotal correctamente con un item', () => {
    act(() => { useCartStore.getState().addItem(makeItem({ price: 45000, qty: 2 })) })
    expect(useCartStore.getState().subtotal()).toBe(90000)
  })

  it('suma correctamente múltiples items', () => {
    act(() => { useCartStore.getState().addItem(makeItem({ variantId: 1, price: 45000, qty: 2 })) })
    act(() => { useCartStore.getState().addItem(makeItem({ variantId: 2, price: 32000, qty: 1 })) })
    // 45000 * 2 + 32000 * 1 = 122000
    expect(useCartStore.getState().subtotal()).toBe(122000)
  })

  it('total() es igual a subtotal() (shipping se calcula en checkout)', () => {
    act(() => { useCartStore.getState().addItem(makeItem({ price: 60000, qty: 3 })) })
    const state = useCartStore.getState()
    expect(state.total()).toBe(state.subtotal())
  })

  it('recalcula subtotal después de updateQty', () => {
    act(() => { useCartStore.getState().addItem(makeItem({ price: 45000, qty: 1 })) })
    act(() => { useCartStore.getState().updateQty(1, 3) })
    expect(useCartStore.getState().subtotal()).toBe(135000)
  })

  it('recalcula subtotal después de removeItem', () => {
    act(() => { useCartStore.getState().addItem(makeItem({ variantId: 1, price: 45000, qty: 2 })) })
    act(() => { useCartStore.getState().addItem(makeItem({ variantId: 2, price: 20000, qty: 1 })) })
    act(() => { useCartStore.getState().removeItem(2) })
    expect(useCartStore.getState().subtotal()).toBe(90000)
  })
})

// ─────────────────────────────────────────────
// loadFromServer — fusión invitado→BD + consolidación por variante
// ─────────────────────────────────────────────
function mockServerCart(serverItems: unknown[]) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ items: serverItems }),
  }) as unknown as typeof fetch
}

const serverRow = (variant_id: number, qty: number) => ({
  variant_id,
  product_id: variant_id * 10,
  product_name: `P${variant_id}`,
  variant_label: 'V',
  price: 1000,
  qty,
  image_url: null,
})

describe('loadFromServer y consolidación', () => {
  it('agrega ítems del servidor que no están en local', async () => {
    act(() => { useCartStore.setState({ items: [makeItem({ variantId: 1, qty: 1 })] }) })
    mockServerCart([serverRow(2, 3)])
    await act(async () => { await useCartStore.getState().loadFromServer() })
    const { items } = useCartStore.getState()
    expect(items).toHaveLength(2)
    expect(items.find((i) => i.variantId === 2)?.qty).toBe(3)
  })

  it('no duplica un ítem del servidor que ya existe en local (gana local)', async () => {
    act(() => { useCartStore.setState({ items: [makeItem({ variantId: 1, qty: 2 })] }) })
    mockServerCart([serverRow(1, 9)])
    await act(async () => { await useCartStore.getState().loadFromServer() })
    const { items } = useCartStore.getState()
    expect(items).toHaveLength(1)
    expect(items[0].qty).toBe(2) // se conserva la cantidad local, no se duplica
  })

  it('consolida duplicados legacy por variantId (suma cantidades)', async () => {
    // Estado con duplicados (como podría venir de localStorage legacy)
    act(() => {
      useCartStore.setState({
        items: [makeItem({ variantId: 1, qty: 2 }), makeItem({ variantId: 1, qty: 3 })],
      })
    })
    mockServerCart([serverRow(2, 1)]) // servidor no vacío para disparar la consolidación
    await act(async () => { await useCartStore.getState().loadFromServer() })
    const { items } = useCartStore.getState()
    const v1 = items.filter((i) => i.variantId === 1)
    expect(v1).toHaveLength(1)   // los duplicados se fusionan
    expect(v1[0].qty).toBe(5)    // 2 + 3
    expect(items).toHaveLength(2)
  })

  it('no altera el carrito si el servidor no devuelve ítems', async () => {
    act(() => { useCartStore.setState({ items: [makeItem({ variantId: 1, qty: 1 })] }) })
    mockServerCart([])
    await act(async () => { await useCartStore.getState().loadFromServer() })
    expect(useCartStore.getState().items).toHaveLength(1)
  })
})

// ─────────────────────────────────────────────
// Persistencia en localStorage
// ─────────────────────────────────────────────
describe('persistencia en localStorage', () => {
  it('guarda el carrito en la clave "vps-cart" de localStorage', () => {
    act(() => { useCartStore.getState().addItem(makeItem()) })
    const raw = localStorage.getItem('vps-cart')
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!)
    expect(parsed.state.items).toHaveLength(1)
  })

  it('el estado persiste el variantId y el precio correctamente', () => {
    act(() => { useCartStore.getState().addItem(makeItem({ variantId: 42, price: 99000 })) })
    const raw = localStorage.getItem('vps-cart')
    const parsed = JSON.parse(raw!)
    expect(parsed.state.items[0].variantId).toBe(42)
    expect(parsed.state.items[0].price).toBe(99000)
  })
})
