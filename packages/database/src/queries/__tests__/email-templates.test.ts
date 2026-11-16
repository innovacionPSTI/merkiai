import { renderTemplateString, resolveTemplate, emailTemplateDef, EMAIL_TEMPLATES } from '../email-templates'

describe('email templates (HU-160)', () => {
  describe('renderTemplateString', () => {
    it('interpola variables y deja vacías las faltantes', () => {
      expect(renderTemplateString('Hola {{name}}, pedido {{order}}', { name: 'Ana', order: 'ORD-1' })).toBe('Hola Ana, pedido ORD-1')
      expect(renderTemplateString('x {{missing}} y', {})).toBe('x  y')
      expect(renderTemplateString('n={{n}}', { n: 0 })).toBe('n=0')
    })
    it('tolera espacios dentro de las llaves', () => {
      expect(renderTemplateString('{{ a }}-{{b}}', { a: '1', b: '2' })).toBe('1-2')
    })
  })

  describe('resolveTemplate', () => {
    it('usa el default de sistema si no hay override', () => {
      const r = resolveTemplate('payment.confirmed', { customer_name: 'Ana', order_number: 'ORD-9' })
      expect(r?.subject).toContain('ORD-9')
      expect(r?.body).toContain('Ana')
      expect(r?.enabled).toBe(true)
    })
    it('el override gana sobre el default y respeta enabled', () => {
      const r = resolveTemplate('order.shipped', { order_number: 'ORD-5' },
        { subject: 'Enviado {{order_number}}', body: 'cuerpo', enabled: false })
      expect(r?.subject).toBe('Enviado ORD-5')
      expect(r?.body).toBe('cuerpo')
      expect(r?.enabled).toBe(false)
    })
    it('tipo desconocido → null', () => {
      expect(resolveTemplate('no.existe', {})).toBeNull()
    })
  })

  describe('catálogo', () => {
    it('cada tipo tiene asunto y cuerpo por defecto', () => {
      for (const t of EMAIL_TEMPLATES) {
        expect(t.subject.length).toBeGreaterThan(0)
        expect(t.body.length).toBeGreaterThan(0)
      }
      expect(emailTemplateDef('order.delivered')).toBeDefined()
    })
  })
})

describe('E28 · HU-465 · plantillas por idioma', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { emailTemplateLanguage, emailTemplatesFor } = require('../email-templates')

  it('el idioma de plantilla es el idioma base del locale (desconocido → es)', () => {
    expect(emailTemplateLanguage('es-MX')).toBe('es')
    expect(emailTemplateLanguage('en-US')).toBe('en')
    expect(emailTemplateLanguage('pt-BR')).toBe('es')
    expect(emailTemplateLanguage(null)).toBe('es')
  })

  it('sin override usa el default del idioma del pedido; las variables no cambian', () => {
    const en = resolveTemplate('order.shipped', { customer_name: 'Sam', order_number: 'ORD-7', carrier_name: 'X', tracking_url: 'u' }, null, 'en-US')
    expect(en?.subject).toBe('Your order ORD-7 is on its way')
    expect(en?.body).toContain('Hi Sam')
    const es = resolveTemplate('order.shipped', { order_number: 'ORD-7' }, null, 'es-CO')
    expect(es?.subject).toBe('Tu pedido ORD-7 va en camino')
  })

  it('el catálogo en inglés cubre todos los tipos con las mismas variables', () => {
    const en = emailTemplatesFor('en')
    expect(en).toHaveLength(EMAIL_TEMPLATES.length)
    for (const t of en) {
      const base = emailTemplateDef(t.type)!
      expect(t.vars).toEqual(base.vars)
      expect(t.subject).not.toBe(base.subject)
    }
  })
})
