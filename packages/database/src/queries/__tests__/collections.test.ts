// @jest-environment node
import {
  slugifyCollection, normalizeFields, validateItemData, deriveItemTitle,
  COLLECTION_FIELD_TYPES, type CollectionField,
} from '../collections'

describe('slugifyCollection (HU-353)', () => {
  it('normaliza acentos, espacios y mayúsculas', () => {
    expect(slugifyCollection('Café Especial 2024')).toBe('cafe-especial-2024')
    expect(slugifyCollection('  Hólá  ')).toBe('hola')
    expect(slugifyCollection('a/b_c')).toBe('a-b-c')
  })
})

describe('normalizeFields (HU-353)', () => {
  it('descarta entradas inválidas y claves duplicadas', () => {
    const fields = normalizeFields([
      { key: 'titulo', label: 'Título', type: 'text', required: true },
      { label: 'Resumen', type: 'textarea' },            // key derivada del label
      { key: 'titulo', label: 'Dup', type: 'text' },     // duplicado → descartado
      { key: 'x', type: 'tipo-invalido' },               // tipo inválido → descartado
      'basura',                                          // no-objeto → descartado
    ])
    expect(fields.map((f) => f.key)).toEqual(['titulo', 'resumen'])
    expect(fields[0].required).toBe(true)
  })

  it('conserva opciones de select y relationTo', () => {
    const [sel, rel] = normalizeFields([
      { key: 'estado', label: 'Estado', type: 'select', options: [{ value: 'a', label: 'A' }, { value: 'b' }] },
      { key: 'autor', label: 'Autor', type: 'relation', relationTo: 'personas' },
    ])
    expect(sel.options).toEqual([{ value: 'a', label: 'A' }, { value: 'b', label: 'b' }])
    expect(rel.relationTo).toBe('personas')
  })

  it('soporta todos los tipos declarados', () => {
    expect(COLLECTION_FIELD_TYPES).toContain('date')
    expect(COLLECTION_FIELD_TYPES).toContain('relation')
  })
})

describe('validateItemData (HU-353)', () => {
  const fields: CollectionField[] = [
    { key: 'titulo', label: 'Título', type: 'text', required: true },
    { key: 'precio', label: 'Precio', type: 'number' },
    { key: 'activo', label: 'Activo', type: 'boolean' },
    { key: 'fecha', label: 'Fecha', type: 'date' },
    { key: 'estado', label: 'Estado', type: 'select', options: [{ value: 'open', label: 'Abierto' }] },
  ]

  it('exige los campos required', () => {
    const r = validateItemData(fields, { precio: 10 })
    expect(r.ok).toBe(false)
    expect(r.errors[0]).toMatch(/Título/)
  })

  it('coacciona number/boolean y valida date/select', () => {
    const r = validateItemData(fields, { titulo: 'Hola', precio: '12.5', activo: 'true', fecha: '2026-01-15', estado: 'open' })
    expect(r.ok).toBe(true)
    expect(r.value).toEqual({ titulo: 'Hola', precio: 12.5, activo: true, fecha: '2026-01-15', estado: 'open' })
  })

  it('rechaza number no numérico, fecha inválida y select fuera de opciones', () => {
    expect(validateItemData(fields, { titulo: 'x', precio: 'abc' }).ok).toBe(false)
    expect(validateItemData(fields, { titulo: 'x', fecha: 'no-fecha' }).ok).toBe(false)
    expect(validateItemData(fields, { titulo: 'x', estado: 'cerrado' }).ok).toBe(false)
  })

  it('ignora claves desconocidas (solo saneado por esquema)', () => {
    const r = validateItemData(fields, { titulo: 'x', hacker: 'drop table' })
    expect(r.ok).toBe(true)
    expect(r.value).not.toHaveProperty('hacker')
  })
})

describe('deriveItemTitle (HU-353)', () => {
  const fields: CollectionField[] = [
    { key: 'nombre', label: 'Nombre', type: 'text' },
  ]
  it('usa data.title si existe, si no el primer texto con valor', () => {
    expect(deriveItemTitle(fields, { title: 'Explícito', nombre: 'x' })).toBe('Explícito')
    expect(deriveItemTitle(fields, { nombre: 'Derivado' })).toBe('Derivado')
    expect(deriveItemTitle(fields, {})).toBeNull()
  })
})
