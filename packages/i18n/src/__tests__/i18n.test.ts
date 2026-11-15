import {
  createTranslator, resolveMessage, messagesFor, flattenMessages, CATALOGS,
  normalizeLocale, localeChain, matchAcceptLanguage, localeToPathSegment, pathSegmentToLocale,
  formatMessage, parseMessage, MessageSyntaxError, REFERENCE_LANGUAGE,
} from '..'

const nb = (s: string) => s.replace(/[  ]/g, ' ')

describe('locales', () => {
  it('normaliza escrituras a la forma canónica', () => {
    expect(normalizeLocale('es-mx')).toBe('es-MX')
    expect(normalizeLocale('ES_es')).toBe('es-ES')
    expect(normalizeLocale('pt-BR')).toBeNull()
    expect(localeToPathSegment('en-US')).toBe('en-us')
    expect(pathSegmentToLocale('es-co')).toBe('es-CO')
  })

  it('cadena de resolución: locale → idioma base → referencia', () => {
    expect(localeChain('es-MX')).toEqual(['es-MX', 'es'])
    expect(localeChain('en-US')).toEqual(['en-US', 'en', 'es'])
  })

  it('Accept-Language: exacto primero, luego por idioma base; solo locales permitidos', () => {
    expect(matchAcceptLanguage('es-MX,es;q=0.9')).toBe('es-MX')
    expect(matchAcceptLanguage('es-AR,es;q=0.9,en;q=0.5', ['en-US', 'es-ES'])).toBe('es-ES')
    expect(matchAcceptLanguage('fr-FR,en;q=0.4', ['es-CO', 'en-US'])).toBe('en-US')
    expect(matchAcceptLanguage('fr-FR', ['es-CO'])).toBeNull()
    expect(matchAcceptLanguage(null)).toBeNull()
  })
})

describe('AC-1 · resolución en cascada', () => {
  it('es-MX usa su sobrescritura y cae a es para el resto', () => {
    const t = createTranslator('es-MX')
    expect(t('address.neighborhood')).toBe('Colonia')
    expect(t('shop.cart')).toBe('Carrito')
  })

  it('una clave inexistente devuelve la clave (nunca vacío ni excepción)', () => {
    expect(createTranslator('es-CO')('shop.no_existe')).toBe('shop.no_existe')
  })

  it('en-US sobrescribe y cae a en; si en no la tiene, cae a la referencia es', () => {
    const custom = { es: { a: { x: 'equis', y: 'ye' } }, en: { a: { x: 'ex' } }, 'en-US': {} }
    expect(resolveMessage('a.x', 'en-US', custom)).toBe('ex')
    expect(resolveMessage('a.y', 'en-US', custom)).toBe('ye')
    expect(createTranslator('en-US')('address.postal_code')).toBe('ZIP code')
    expect(createTranslator('en-US')('shop.cart')).toBe('Cart')
  })

  it('un texto vacío en el regional no tapa al idioma base', () => {
    const custom = { es: { a: { x: 'base' } }, 'es-MX': { a: { x: '' } } }
    expect(resolveMessage('a.x', 'es-MX', custom)).toBe('base')
  })
})

describe('AC-2 · sobrescritura regional', () => {
  it('cesta en España, carrito en Colombia y México, con una sola clave', () => {
    expect(createTranslator('es-ES', 'shop')('cart')).toBe('Cesta')
    expect(createTranslator('es-CO', 'shop')('cart')).toBe('Carrito')
    expect(createTranslator('es-MX', 'shop')('cart')).toBe('Carrito')
    expect(createTranslator('es-ES', 'common')('phone')).toBe('Móvil')
  })

  it('messagesFor aplica la cascada completa (útil para enviar al cliente)', () => {
    const m = messagesFor('es-ES')
    expect(m['shop.cart']).toBe('Cesta')
    expect(m['shop.subtotal']).toBe('Subtotal')
  })
})

describe('AC-3 · ICU: plurales, select, interpolación', () => {
  it('plural con =0, one y other en español e inglés', () => {
    const es = createTranslator('es-CO', 'shop')
    const en = createTranslator('en-US', 'shop')
    expect(es('items_count', { count: 0 })).toBe('Sin productos')
    expect(es('items_count', { count: 1 })).toBe('1 producto')
    expect(es('items_count', { count: 1200 })).toBe('1.200 productos')
    expect(en('items_count', { count: 3 })).toBe('3 items')
    expect(en('items_count', { count: 1200 })).toBe('1,200 items')
  })

  it('select e interpolación', () => {
    const t = createTranslator('es-CO', 'account')
    expect(t('welcome', { gender: 'female', name: 'Ana' })).toBe('Bienvenida, Ana')
    expect(t('welcome', { name: 'Alex' })).toBe('Te damos la bienvenida, Alex')
  })

  it('argumento faltante queda visible; comillas escapan llaves', () => {
    expect(formatMessage('Hola, {name}')).toBe('Hola, {name}')
    expect(formatMessage("Usa '{'llaves'}' y l''apostrofo")).toBe('Usa {llaves} y l\'apostrofo')
    expect(formatMessage('{n, number} unidades', { n: 1234.5 })).toBe('1.234,5 unidades')
  })

  it('sintaxis inválida lanza MessageSyntaxError (lo detecta el guard)', () => {
    expect(() => parseMessage('{count, plural, one {x}}')).toThrow(MessageSyntaxError)
    expect(() => parseMessage('texto }')).toThrow(MessageSyntaxError)
    expect(() => parseMessage('{a, date}')).toThrow(MessageSyntaxError)
  })
})

describe('catálogos', () => {
  const ref = flattenMessages(CATALOGS[REFERENCE_LANGUAGE])

  it('todo mensaje de todos los catálogos tiene sintaxis ICU válida', () => {
    for (const [tag, tree] of Object.entries(CATALOGS)) {
      for (const [key, msg] of flattenMessages(tree)) {
        expect(() => parseMessage(msg)).not.toThrow(`${tag}:${key}`)
      }
    }
  })

  it('ningún catálogo tiene claves que no existan en la referencia (es)', () => {
    for (const [tag, tree] of Object.entries(CATALOGS)) {
      const orphans = [...flattenMessages(tree).keys()].filter((k) => !ref.has(k))
      expect({ tag, orphans }).toEqual({ tag, orphans: [] })
    }
  })

  it('en (idioma base) cubre el 100 % de la referencia', () => {
    const en = flattenMessages(CATALOGS.en)
    expect([...ref.keys()].filter((k) => !en.has(k))).toEqual([])
  })

  it('el traductor no rompe con sintaxis inválida en runtime (muestra el texto crudo)', () => {
    const t = createTranslator('es', undefined, { es: { bad: '{x, plural, one {y}}' } })
    expect(nb(t('bad'))).toBe('{x, plural, one {y}}')
  })
})

describe('HU-466 · frases con clave = texto original', () => {
  it('español devuelve el texto; inglés usa el diccionario; sin entrada → original', async () => {
    const { translatePhrase } = await import('..')
    expect(translatePhrase('Guardado correctamente', 'es-MX')).toBe('Guardado correctamente')
    expect(translatePhrase('Guardado  correctamente', 'en-US')).toBe('Saved successfully')
    expect(translatePhrase('Texto sin traducir', 'en-US')).toBe('Texto sin traducir')
  })
})

describe('HU-466 F6 · mensajes de servidor', () => {
  it('patrones con huecos {0} traducen mensajes armados en runtime', async () => {
    const { translatePhrase } = await import('..')
    expect(translatePhrase('Documento F-12 creado.', 'en-US')).toBe('Document F-12 created.')
    expect(translatePhrase('Recurso desconocido: banners', 'en-US')).toBe('Unknown resource: banners')
    expect(translatePhrase('Documento F-12 creado.', 'es-CO')).toBe('Documento F-12 creado.')
  })

  it('localizeMessages traduce solo los campos de mensaje', async () => {
    const { localizeMessages, hasMessages } = await import('..')
    const body = { ok: false, error: 'No autorizado', errors: ['Sin permiso', { field: 'x', message: 'No autorizado' }], data: { error: 'No autorizado' } }
    const out = localizeMessages(body, 'en-US')
    expect(out.error).toBe('Unauthorized')
    expect(out.errors).toEqual(['No permission', { field: 'x', message: 'Unauthorized' }])
    expect(out.data).toBe(body.data)
    expect(localizeMessages(body, 'es-MX')).toBe(body)
    expect(hasMessages({ products: [] })).toBe(false)
  })

  it('frases con valores y plurales ICU en ambos idiomas', async () => {
    const { translatePhrase } = await import('..')
    const k = '{count, plural, one {# tema configurado} other {# temas configurados}}'
    expect(translatePhrase(k, 'es-CO', { count: 1 })).toBe('1 tema configurado')
    expect(translatePhrase(k, 'en-US', { count: 3 })).toBe('3 themes configured')
    expect(translatePhrase('Prueba enviada a {to}', 'en-US', { to: 'a@b.co' })).toBe('Test sent to a@b.co')
  })
})
