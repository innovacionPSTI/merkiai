import {
  getRegion, isValidPostalCode, normalizePhone, formatPhone, isValidPhone, isValidDocument, nitCheckDigit,
  documentTypesFor, formatAddress, formatAddressInline, validateAddress, countryName, createTranslator,
} from '..'

describe('AC-1 · formulario por país', () => {
  it('cada país define su división, ciudad y barrio/colonia', () => {
    expect(getRegion('CO')).toMatchObject({ subdivisions: 'divipola', neighborhood: 'none' })
    expect(getRegion('MX').neighborhood).toBe('required')
    expect(getRegion('MX').subdivisions).toContain('Ciudad de México')
    expect(getRegion('ES').subdivisions).toHaveLength(52)
    expect(getRegion('US').subdivisions).toContain('District of Columbia')
    expect(getRegion('BR').country).toBe('CO') // no soportado → comportamiento histórico
  })

  it('las etiquetas salen del catálogo i18n según el país y el idioma de la UI', () => {
    expect(createTranslator('es-CO')(getRegion('MX').regionLabelKey)).toBe('Estado')
    expect(createTranslator('en-US')(getRegion('ES').regionLabelKey)).toBe('Province')
    expect(createTranslator('es-ES')(getRegion('CO').regionLabelKey)).toBe('Departamento')
  })
})

describe('AC-2 · código postal y teléfono E.164', () => {
  it('CP por país (CO opcional de 6 dígitos)', () => {
    expect(isValidPostalCode('CO', '')).toBe(true)
    expect(isValidPostalCode('CO', '110111')).toBe(true)
    expect(isValidPostalCode('CO', '1101')).toBe(false)
    expect(isValidPostalCode('MX', '')).toBe(false)
    expect(isValidPostalCode('MX', '06600')).toBe(true)
    expect(isValidPostalCode('ES', '28013')).toBe(true)
    expect(isValidPostalCode('ES', '60000')).toBe(false)
    expect(isValidPostalCode('US', '10001-1234')).toBe(true)
    expect(isValidPostalCode('US', '1000')).toBe(false)
  })

  it('normaliza a E.164 desde formato nacional o internacional', () => {
    expect(normalizePhone('300 123 4567', 'CO')).toBe('+573001234567')
    expect(normalizePhone('+57 (300) 123-4567', 'CO')).toBe('+573001234567')
    expect(normalizePhone('0057 3001234567', 'CO')).toBe('+573001234567')
    expect(normalizePhone('601 234 5678', 'CO')).toBe('+576012345678')
    expect(normalizePhone('55 1234 5678', 'MX')).toBe('+525512345678')
    expect(normalizePhone('+52 1 55 1234 5678', 'MX')).toBe('+525512345678')
    expect(normalizePhone('612 345 678', 'ES')).toBe('+34612345678')
    expect(normalizePhone('(212) 555-0142', 'US')).toBe('+12125550142')
    expect(normalizePhone('+34 612 345 678', 'CO')).toBeNull()
    expect(normalizePhone('12345', 'CO')).toBeNull()
    expect(isValidPhone('', 'MX')).toBe(false)
  })

  it('presenta E.164 en formato nacional o internacional', () => {
    expect(formatPhone('+573001234567')).toBe('300 123 4567')
    expect(formatPhone('+12125550142', { international: true })).toBe('+1 (212) 555-0142')
    expect(formatPhone('+34612345678')).toBe('612 345 678')
    expect(formatPhone('texto libre')).toBe('texto libre')
  })
})

describe('AC-3 · documento por país', () => {
  it('tipos ofrecidos según el país', () => {
    expect(documentTypesFor('CO').map((d) => d.code)).toEqual(['CC', 'CE', 'NIT', 'PP'])
    expect(documentTypesFor('MX').map((d) => d.code)).toEqual(['RFC', 'CURP', 'PP'])
    expect(documentTypesFor('ES').map((d) => d.code)).toEqual(['NIF', 'NIE', 'PP'])
    expect(documentTypesFor('US')).toEqual([])
  })

  it('NIT con dígito de verificación DIAN', () => {
    expect(nitCheckDigit('900123456')).toBe(8)
    expect(isValidDocument('NIT', '900.123.456-8')).toBe(true)
    expect(isValidDocument('NIT', '900123456-1')).toBe(false)
    expect(isValidDocument('NIT', '900123456')).toBe(true)
    expect(isValidDocument('CC', '1.020.304.050')).toBe(true)
  })

  it('RFC, CURP, DNI/NIF y NIE (con letra de control)', () => {
    expect(isValidDocument('RFC', 'GODE561231GR8')).toBe(true)
    expect(isValidDocument('RFC', 'ABC680524P76')).toBe(true)
    expect(isValidDocument('CURP', 'GODE561231HDFRRN09')).toBe(true)
    expect(isValidDocument('NIF', '12345678Z')).toBe(true)
    expect(isValidDocument('NIF', '12345678A')).toBe(false)
    expect(isValidDocument('NIE', 'X1234567L')).toBe(true)
    expect(isValidDocument('NIE', 'X1234567A')).toBe(false)
    expect(isValidDocument('XX', '123')).toBe(false)
  })
})

describe('AC-4 · dirección en el formato del país', () => {
  it('Colombia conserva el formato histórico', () => {
    expect(formatAddress({ address: 'Calle 1 # 2-3', city: 'Medellín', department: 'Antioquia', postal_code: '050001' }))
      .toEqual(['Calle 1 # 2-3', 'Medellín, Antioquia', 'CP: 050001'])
  })

  it('México, España y EE. UU.', () => {
    expect(formatAddress({ country: 'MX', address: 'Av. Reforma 222', line2: 'Piso 3', neighborhood: 'Juárez', city: 'Cuauhtémoc', department: 'Ciudad de México', postal_code: '06600' }))
      .toEqual(['Av. Reforma 222, Piso 3', 'Col. Juárez', '06600 Cuauhtémoc, Ciudad de México'])
    expect(formatAddress({ country: 'ES', address: 'Calle Mayor 1', city: 'Madrid', department: 'Madrid', postal_code: '28013' }))
      .toEqual(['Calle Mayor 1', '28013 Madrid'])
    expect(formatAddressInline({ country: 'US', address: '350 5th Ave', city: 'New York', department: 'New York', postal_code: '10118' }))
      .toBe('350 5th Ave, New York, New York 10118')
  })

  it('incluye el país cuando se pide', () => {
    expect(formatAddress({ country: 'MX', address: 'X', city: 'Y', department: 'Jalisco', postal_code: '44100' }, { includeCountry: true, locale: 'es-CO' }).at(-1)).toBe(countryName('MX', 'es-CO'))
  })
})

describe('validateAddress (cliente y servidor)', () => {
  it('México exige colonia y CP; estado de la lista', () => {
    const e = validateAddress({ country: 'MX', address: 'Av 1', city: 'Guadalajara', department: 'Jaliscoo', phone: '33 1234 5678' })
    expect(e).toEqual({ department: 'address.error_region', neighborhood: 'address.error_required', postal_code: 'address.error_postal_code' })
  })
  it('dirección válida no devuelve errores', () => {
    expect(validateAddress({ country: 'US', address: '1 Main St', city: 'Austin', department: 'Texas', postal_code: '73301', phone: '512 555 0199' })).toEqual({})
  })
})
