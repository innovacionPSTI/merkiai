/**
 * Localización regional por PAÍS (E28 · HU-468 · ADR-011 §2.4).
 *
 * Lo que cambia según el país de la dirección (no según el idioma de la UI):
 * divisiones administrativas, código postal, teléfono (E.164), tipos de
 * documento y el orden en que se imprime la dirección.
 *
 * Colombia conserva el comportamiento histórico: departamento + municipio
 * (lista DIVIPOLA en `@merkiai/ui`), código postal opcional de 6 dígitos.
 */

export const SUPPORTED_COUNTRIES = ['CO', 'MX', 'ES', 'US'] as const
export type CountryCode = (typeof SUPPORTED_COUNTRIES)[number]

/** País por defecto (comportamiento histórico). */
export const DEFAULT_COUNTRY: CountryCode = 'CO'

export interface DocumentTypeDef {
  code: string
  /** Nombre corto visible (es igual en todos los idiomas: son siglas oficiales). */
  label: string
  /** Para personas, empresas o ambas. */
  holder: 'person' | 'company' | 'any'
}

export interface RegionDef {
  country: CountryCode
  /** Prefijo telefónico internacional, sin "+". */
  callingCode: string
  /** Patrón del número nacional (solo dígitos, sin prefijo de país). */
  phonePattern: RegExp
  /** Ejemplo de número nacional para el placeholder. */
  phoneExample: string
  postalCode: { required: boolean; pattern: RegExp; example: string; maxLength: number }
  /** Clave i18n del nombre de la división de primer nivel (Departamento, Estado, Provincia). */
  regionLabelKey: string
  cityLabelKey: string
  /** Si el formulario pide barrio/colonia como campo propio. */
  neighborhood: 'none' | 'optional' | 'required'
  /** Divisiones de primer nivel. CO usa la lista DIVIPOLA de `@merkiai/ui` (con municipios). */
  subdivisions: readonly string[] | 'divipola'
  documents: readonly DocumentTypeDef[]
}

const MX_STATES = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua',
  'Ciudad de México', 'Coahuila', 'Colima', 'Durango', 'Estado de México', 'Guanajuato', 'Guerrero',
  'Hidalgo', 'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla',
  'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas',
  'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas',
] as const

const ES_PROVINCES = [
  'A Coruña', 'Álava', 'Albacete', 'Alicante', 'Almería', 'Asturias', 'Ávila', 'Badajoz', 'Barcelona',
  'Bizkaia', 'Burgos', 'Cáceres', 'Cádiz', 'Cantabria', 'Castellón', 'Ceuta', 'Ciudad Real', 'Córdoba',
  'Cuenca', 'Gipuzkoa', 'Girona', 'Granada', 'Guadalajara', 'Huelva', 'Huesca', 'Illes Balears', 'Jaén',
  'La Rioja', 'Las Palmas', 'León', 'Lleida', 'Lugo', 'Madrid', 'Málaga', 'Melilla', 'Murcia', 'Navarra',
  'Ourense', 'Palencia', 'Pontevedra', 'Salamanca', 'Santa Cruz de Tenerife', 'Segovia', 'Sevilla',
  'Soria', 'Tarragona', 'Teruel', 'Toledo', 'Valencia', 'Valladolid', 'Zamora', 'Zaragoza',
] as const

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'District of Columbia', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas',
  'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
  'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Puerto Rico',
  'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia',
  'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
] as const

export const REGIONS: Record<CountryCode, RegionDef> = {
  CO: {
    country: 'CO',
    callingCode: '57',
    // Móvil (3xx) o fijo nacional (60x) — 10 dígitos.
    phonePattern: /^(3\d{9}|60\d{8})$/,
    phoneExample: '300 123 4567',
    postalCode: { required: false, pattern: /^\d{6}$/, example: '110111', maxLength: 6 },
    regionLabelKey: 'address.region_co',
    cityLabelKey: 'address.city_co',
    neighborhood: 'none',
    subdivisions: 'divipola',
    documents: [
      { code: 'CC', label: 'CC', holder: 'person' },
      { code: 'CE', label: 'CE', holder: 'person' },
      { code: 'NIT', label: 'NIT', holder: 'any' },
      { code: 'PP', label: 'Pasaporte', holder: 'person' },
    ],
  },
  MX: {
    country: 'MX',
    callingCode: '52',
    phonePattern: /^\d{10}$/,
    phoneExample: '55 1234 5678',
    postalCode: { required: true, pattern: /^\d{5}$/, example: '06600', maxLength: 5 },
    regionLabelKey: 'address.region_mx',
    cityLabelKey: 'address.city_mx',
    neighborhood: 'required',
    subdivisions: MX_STATES,
    documents: [
      { code: 'RFC', label: 'RFC', holder: 'any' },
      { code: 'CURP', label: 'CURP', holder: 'person' },
      { code: 'PP', label: 'Pasaporte', holder: 'person' },
    ],
  },
  ES: {
    country: 'ES',
    callingCode: '34',
    phonePattern: /^[6789]\d{8}$/,
    phoneExample: '612 345 678',
    postalCode: { required: true, pattern: /^(0[1-9]|[1-4]\d|5[0-2])\d{3}$/, example: '28013', maxLength: 5 },
    regionLabelKey: 'address.region_es',
    cityLabelKey: 'address.city_es',
    neighborhood: 'none',
    subdivisions: ES_PROVINCES,
    documents: [
      { code: 'NIF', label: 'NIF/DNI', holder: 'any' },
      { code: 'NIE', label: 'NIE', holder: 'person' },
      { code: 'PP', label: 'Pasaporte', holder: 'person' },
    ],
  },
  US: {
    country: 'US',
    callingCode: '1',
    // NANP: área y central no empiezan por 0/1.
    phonePattern: /^[2-9]\d{2}[2-9]\d{6}$/,
    phoneExample: '(212) 555-0142',
    postalCode: { required: true, pattern: /^\d{5}(-\d{4})?$/, example: '10001', maxLength: 10 },
    regionLabelKey: 'address.region_us',
    cityLabelKey: 'address.city_us',
    neighborhood: 'none',
    subdivisions: US_STATES,
    // Sin documento de identidad en el checkout (no se pide SSN).
    documents: [],
  },
}

export function isSupportedCountry(v: unknown): v is CountryCode {
  return typeof v === 'string' && (SUPPORTED_COUNTRIES as readonly string[]).includes(v)
}

/** Definición regional del país (o la de Colombia si no es soportado). */
export function getRegion(country: string | null | undefined): RegionDef {
  const c = String(country ?? '').toUpperCase()
  return isSupportedCountry(c) ? REGIONS[c] : REGIONS[DEFAULT_COUNTRY]
}

/** Nombre del país en el idioma indicado (Intl.DisplayNames). */
export function countryName(country: string, locale = 'es-CO'): string {
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(country.toUpperCase()) ?? country
  } catch {
    return country
  }
}

// ── Código postal ─────────────────────────────────────────────────────────────

export function normalizePostalCode(country: string, raw: string | null | undefined): string {
  const v = String(raw ?? '').trim().toUpperCase()
  return getRegion(country).country === 'US' ? v.replace(/[^\d-]/g, '') : v.replace(/\D/g, '')
}

/** `true` si el CP es válido para el país (vacío vale solo donde es opcional). */
export function isValidPostalCode(country: string, raw: string | null | undefined): boolean {
  const r = getRegion(country)
  const v = normalizePostalCode(r.country, raw)
  if (!v) return !r.postalCode.required
  return r.postalCode.pattern.test(v)
}

// ── Teléfono (E.164) ──────────────────────────────────────────────────────────

/**
 * Normaliza a E.164 (`+573001234567`). Acepta el número nacional, con prefijo
 * internacional (`+57`, `0057`) o con espacios/guiones/paréntesis. `null` si no
 * es un número válido del país.
 */
export function normalizePhone(raw: string | null | undefined, country: string): string | null {
  const r = getRegion(country)
  let digits = String(raw ?? '').trim()
  if (!digits) return null
  const international = digits.startsWith('+') || digits.startsWith('00')
  digits = digits.replace(/\D/g, '')
  if (digits.startsWith('00')) digits = digits.slice(2)
  if (international || (digits.startsWith(r.callingCode) && !r.phonePattern.test(digits))) {
    if (!digits.startsWith(r.callingCode)) return null
    digits = digits.slice(r.callingCode.length)
  }
  // México: el "1" histórico de celulares tras el +52 ya no se usa.
  if (r.country === 'MX' && digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1)
  return r.phonePattern.test(digits) ? `+${r.callingCode}${digits}` : null
}

export function isValidPhone(raw: string | null | undefined, country: string): boolean {
  return normalizePhone(raw, country) !== null
}

/**
 * Presentación de un número E.164. Nacional por defecto (`300 123 4567`);
 * `international: true` antepone el prefijo (`+57 300 123 4567`).
 */
export function formatPhone(e164: string | null | undefined, opts: { international?: boolean } = {}): string {
  const v = String(e164 ?? '')
  const m = /^\+(\d+)$/.exec(v)
  if (!m) return v
  const region = SUPPORTED_COUNTRIES.map((c) => REGIONS[c]).find((r) => m[1].startsWith(r.callingCode) && r.phonePattern.test(m[1].slice(r.callingCode.length)))
  if (!region) return v
  const n = m[1].slice(region.callingCode.length)
  let national: string
  switch (region.country) {
    case 'US': national = `(${n.slice(0, 3)}) ${n.slice(3, 6)}-${n.slice(6)}`; break
    case 'ES': national = `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`; break
    case 'MX': national = `${n.slice(0, 2)} ${n.slice(2, 6)} ${n.slice(6)}`; break
    default: national = `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`
  }
  return opts.international ? `+${region.callingCode} ${national}` : national
}

// ── Documentos ────────────────────────────────────────────────────────────────

/** Dígito de verificación del NIT colombiano (DIAN, módulo 11). */
export function nitCheckDigit(base: string): number {
  const weights = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71]
  const digits = base.replace(/\D/g, '').split('').reverse()
  const sum = digits.reduce((acc, d, i) => acc + Number(d) * weights[i], 0)
  const r = sum % 11
  return r > 1 ? 11 - r : r
}

const DNI_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE'

/** Letra de control del DNI/NIE español. */
function spanishLetter(num: string): string {
  return DNI_LETTERS[Number(num) % 23]
}

export function normalizeDocument(value: string | null | undefined): string {
  return String(value ?? '').trim().toUpperCase().replace(/[\s.]/g, '')
}

/**
 * Valida un documento según su tipo (formato y, cuando existe, dígito de control):
 * NIT (CO, con o sin DV), CC/CE (CO), RFC/CURP (MX), NIF/DNI y NIE (ES), pasaporte.
 */
export function isValidDocument(type: string, raw: string | null | undefined): boolean {
  const v = normalizeDocument(raw)
  if (!v) return false
  switch (type.toUpperCase()) {
    case 'CC': return /^\d{5,10}$/.test(v)
    case 'CE': return /^[A-Z0-9]{6,12}$/.test(v)
    case 'NIT': {
      const m = /^(\d{6,15})(?:-?(\d))?$/.exec(v)
      if (!m) return false
      return m[2] === undefined || nitCheckDigit(m[1]) === Number(m[2])
    }
    case 'RFC': return /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(v)
    case 'CURP': return /^[A-Z][AEIOUX][A-Z]{2}\d{6}[HM][A-Z]{2}[B-DF-HJ-NP-TV-Z]{3}[A-Z0-9]\d$/.test(v)
    case 'NIF': {
      // DNI (8 dígitos + letra) o CIF de empresa (letra + 7 dígitos + control).
      const dni = /^(\d{8})([A-Z])$/.exec(v)
      if (dni) return spanishLetter(dni[1]) === dni[2]
      return /^[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J]$/.test(v)
    }
    case 'NIE': {
      const m = /^([XYZ])(\d{7})([A-Z])$/.exec(v)
      if (!m) return false
      return spanishLetter(`${'XYZ'.indexOf(m[1])}${m[2]}`) === m[3]
    }
    case 'PP': return /^[A-Z0-9]{5,20}$/.test(v)
    default: return false
  }
}

/** Tipos de documento ofrecidos para un país (AC-3). */
export function documentTypesFor(country: string): readonly DocumentTypeDef[] {
  return getRegion(country).documents
}

// ── Dirección ─────────────────────────────────────────────────────────────────

export interface PostalAddress {
  address: string
  line2?: string | null
  neighborhood?: string | null
  city: string
  /** Departamento / estado / provincia (se mantiene el nombre histórico del campo). */
  department?: string | null
  postal_code?: string | null
  country?: string | null
}

/**
 * Líneas de la dirección en el orden del país (AC-4). Para Colombia reproduce
 * el formato histórico (`dirección` · `ciudad, departamento` · `CP: …`).
 * `includeCountry` añade el nombre del país (útil si difiere del de la tienda).
 */
export function formatAddress(addr: PostalAddress, opts: { locale?: string; includeCountry?: boolean } = {}): string[] {
  const country = getRegion(addr.country).country
  const clean = (s: string | null | undefined) => String(s ?? '').trim()
  const a = clean(addr.address), l2 = clean(addr.line2), nb = clean(addr.neighborhood)
  const city = clean(addr.city), region = clean(addr.department), cp = clean(addr.postal_code)
  const join = (...parts: string[]) => parts.filter(Boolean).join(', ')
  let lines: string[]
  switch (country) {
    case 'MX':
      lines = [join(a, l2), nb ? `Col. ${nb}` : '', [cp, join(city, region)].filter(Boolean).join(' ')]
      break
    case 'ES':
      lines = [join(a, l2), [cp, city].filter(Boolean).join(' '), region !== city ? region : '']
      break
    case 'US':
      lines = [a, l2, [join(city, region), cp].filter(Boolean).join(' ')]
      break
    default:
      lines = [a, l2, nb, join(city, region), cp ? `CP: ${cp}` : '']
  }
  if (opts.includeCountry) lines.push(countryName(country, opts.locale))
  return lines.filter(Boolean)
}

/** La dirección en una sola línea (correos, guías). */
export function formatAddressInline(addr: PostalAddress, opts: { locale?: string; includeCountry?: boolean } = {}): string {
  return formatAddress(addr, opts).join(', ')
}

export interface AddressValidationInput {
  country?: string | null
  address?: string | null
  city?: string | null
  department?: string | null
  neighborhood?: string | null
  postal_code?: string | null
  phone?: string | null
}

/**
 * Valida una dirección según el país. Devuelve un mapa campo → clave i18n del
 * error (vacío = válida). El servidor aplica la misma función que el cliente.
 */
export function validateAddress(input: AddressValidationInput): Record<string, string> {
  const r = getRegion(input.country)
  const errors: Record<string, string> = {}
  if (!String(input.address ?? '').trim()) errors.address = 'address.error_required'
  if (!String(input.city ?? '').trim()) errors.city = 'address.error_required'
  if (!String(input.department ?? '').trim()) errors.department = 'address.error_required'
  else if (Array.isArray(r.subdivisions) && !r.subdivisions.includes(String(input.department).trim())) errors.department = 'address.error_region'
  if (r.neighborhood === 'required' && !String(input.neighborhood ?? '').trim()) errors.neighborhood = 'address.error_required'
  if (!isValidPostalCode(r.country, input.postal_code)) errors.postal_code = 'address.error_postal_code'
  if (input.phone !== undefined && !isValidPhone(input.phone, r.country)) errors.phone = 'address.error_phone'
  return errors
}
