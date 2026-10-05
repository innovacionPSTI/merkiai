import { parseCustomersCsv, CUSTOMER_IMPORT_TEMPLATE } from '../customer-import'

describe('parseCustomersCsv', () => {
  it('parsea clientes y normaliza email a minúsculas', () => {
    const csv = ['email,name,phone', 'Ana@Example.com,Ana Pérez,3001234567'].join('\n')
    const { customers, errors } = parseCustomersCsv(csv)
    expect(errors).toHaveLength(0)
    expect(customers[0]).toMatchObject({ email: 'ana@example.com', name: 'Ana Pérez', phone: '3001234567' })
  })

  it('acepta sinónimos ES', () => {
    const csv = ['correo,nombre,celular', 'b@x.com,Beto,300'].join('\n')
    const { customers, errors } = parseCustomersCsv(csv)
    expect(errors).toHaveLength(0)
    expect(customers[0]).toMatchObject({ email: 'b@x.com', name: 'Beto', phone: '300' })
  })

  it('rechaza email inválido y reporta duplicados', () => {
    const csv = ['email', 'noesmail', 'c@x.com', 'c@x.com'].join('\n')
    const { customers, errors } = parseCustomersCsv(csv)
    expect(customers).toHaveLength(1)
    expect(errors.some((e) => /inválido/i.test(e.message))).toBe(true)
    expect(errors.some((e) => /duplicado/i.test(e.message))).toBe(true)
  })

  it('falla sin columna email', () => {
    expect(parseCustomersCsv('name\nAna').errors[0].message).toMatch(/email/i)
  })

  it('la plantilla se parsea sin errores', () => {
    const { customers, errors } = parseCustomersCsv(CUSTOMER_IMPORT_TEMPLATE)
    expect(errors).toHaveLength(0)
    expect(customers).toHaveLength(2)
  })
})
