import {
  applyDraft,
  applySectionDraft,
  applyItemDraft,
  pickDraftable,
  DRAFTABLE_SECTION_COLS,
  DRAFTABLE_ITEM_COLS,
} from '../content-draft'

describe('applyDraft (overlay puro — HU-128 v2)', () => {
  it('sin draft devuelve la fila intacta y has_draft=false', () => {
    const row = { id: 1, title: 'Vivo', draft: null }
    const out = applyDraft(row, ['title'])
    expect(out.title).toBe('Vivo')
    expect(out.has_draft).toBe(false)
  })

  it('fusiona solo las columnas permitidas', () => {
    const row = { id: 1, title: 'Vivo', body: 'B', draft: { title: 'Borrador', body: 'X', id: 999 } }
    const out = applyDraft(row, ['title']) // body NO permitido aquí
    expect(out.title).toBe('Borrador')
    expect(out.body).toBe('B')
    expect(out.id).toBe(1) // id nunca se sobreescribe
    expect(out.has_draft).toBe(true)
  })

  it('draft vacío → has_draft=false', () => {
    expect(applyDraft({ id: 1, draft: {} }, ['title']).has_draft).toBe(false)
  })

  it('applySectionDraft respeta el allowlist de sección', () => {
    const s = { id: 1, title: 'A', enabled: false, draft: { title: 'B', enabled: true, section_type: 'hack' } } as any
    const out = applySectionDraft(s)
    expect(out.title).toBe('B')
    expect(out.enabled).toBe(true)
    expect((out as any).section_type).toBeUndefined()
    expect(DRAFTABLE_SECTION_COLS).toContain('settings')
  })

  it('applyItemDraft respeta el allowlist de ítem', () => {
    const i = { id: 1, description: 'A', draft: { description: 'B', section_id: 999 } } as any
    const out = applyItemDraft(i)
    expect(out.description).toBe('B')
    expect(out.section_id).not.toBe(999)
    expect(DRAFTABLE_ITEM_COLS).toContain('metadata')
  })
})

describe('pickDraftable', () => {
  it('filtra claves no permitidas', () => {
    expect(pickDraftable({ title: 'T', hack: 1, id: 5 }, ['title'])).toEqual({ title: 'T' })
  })
})
