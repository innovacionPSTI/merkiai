import { parseInfraForm } from '../tenant-infra'

const raw = (over: Partial<Parameters<typeof parseInfraForm>[0]> = {}) => ({
  tenant_id: 't-1',
  db_ref: 'cliente-acme',
  db_url: 'https://acme.supabase.co',
  base_url: '',
  sentry_dsn: '',
  region: '',
  status: 'draft',
  ...over,
})

describe('parseInfraForm', () => {
  it('acepta una config válida y normaliza opcionales vacíos a null', () => {
    const r = parseInfraForm(raw())
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value).toEqual({
        tenant_id: 't-1', db_ref: 'cliente-acme', db_url: 'https://acme.supabase.co',
        base_url: null, sentry_dsn: null, region: null, status: 'draft',
      })
    }
  })

  it('normaliza db_ref a minúsculas', () => {
    const r = parseInfraForm(raw({ db_ref: 'Cliente-ACME' }))
    expect(r.ok && r.value.db_ref).toBe('cliente-acme')
  })

  it('exige cliente', () => {
    expect(parseInfraForm(raw({ tenant_id: '' }))).toMatchObject({ ok: false })
  })

  it('rechaza db_ref "shared" y claves inválidas', () => {
    expect(parseInfraForm(raw({ db_ref: 'shared' }))).toMatchObject({ ok: false })
    expect(parseInfraForm(raw({ db_ref: 'a' }))).toMatchObject({ ok: false })        // muy corto
    expect(parseInfraForm(raw({ db_ref: 'con espacio' }))).toMatchObject({ ok: false })
  })

  it('exige endpoint con forma de URL', () => {
    expect(parseInfraForm(raw({ db_url: 'acme.supabase.co' }))).toMatchObject({ ok: false })
    expect(parseInfraForm(raw({ db_url: '' }))).toMatchObject({ ok: false })
  })

  it('rechaza estado inválido', () => {
    expect(parseInfraForm(raw({ status: 'live' }))).toMatchObject({ ok: false })
  })

  it('conserva los opcionales cuando vienen', () => {
    const r = parseInfraForm(raw({ base_url: 'https://acme.co', region: 'us-east-1', status: 'active' }))
    expect(r.ok && r.value).toMatchObject({ base_url: 'https://acme.co', region: 'us-east-1', status: 'active' })
  })
})
