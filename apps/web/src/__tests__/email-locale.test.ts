/**
 * @jest-environment node
 */
import { sendOrderConfirmation } from '@/lib/email'

const order = {
  order_number: 'ORD-1', customer_email: 'a@b.co', customer_name: 'Ana', items: [{ product_name: 'Camiseta', variant_label: 'M', qty: 1, price: 50000 }],
  subtotal: 50000, shipping_cost: 0, total: 50000, shipping_addr: { address: 'Calle 1', city: 'Medellín', department: 'Antioquia' },
}
const config = { apiKey: 'k', fromEmail: 'no-reply@t.co', storeName: 'Tienda' }

describe('HU-465 · correo de confirmación por idioma', () => {
  const orig = global.fetch
  afterEach(() => { global.fetch = orig })
  function capture() {
    const calls: Array<{ subject: string; html: string }> = []
    global.fetch = (async (_u: string, init: { body: string }) => { calls.push(JSON.parse(init.body)); return { ok: true, text: async () => '' } }) as never
    return calls
  }
  it('sin idioma registrado sale en español (igual que antes)', async () => {
    const calls = capture()
    await sendOrderConfirmation(order as never, config as never)
    expect(calls[0].subject).toBe('Pedido confirmado ORD-1 — Tienda')
    expect(calls[0].html).toContain('¡Gracias por tu pedido!')
    expect(calls[0].html).toContain('lang="es-CO"')
  })
  it('en-US: asunto, textos y formato en inglés', async () => {
    const calls = capture()
    await sendOrderConfirmation({ ...order, locale: 'en-US' } as never, config as never)
    expect(calls[0].subject).toBe('Order confirmed ORD-1 — Tienda')
    expect(calls[0].html).toContain('Thank you for your order!')
    expect(calls[0].html).toMatch(/COP\s?50,000/)
  })
})
