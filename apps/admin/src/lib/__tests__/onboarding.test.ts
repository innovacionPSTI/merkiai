/**
 * @jest-environment node
 *
 * Onboarding (HU-236): resolución de opciones + aplicación del preset con gating.
 */
jest.mock('@merkiai/database', () => ({
  applyPresetToStore: jest.fn(),
  getOnboardingState: jest.fn().mockResolvedValue(null),
  setOnboardingState: jest.fn().mockResolvedValue(undefined),
  getStoreConfig: jest.fn(),
  getThemes: jest.fn().mockResolvedValue([]),
  getProducts: jest.fn().mockResolvedValue([]),
}))
jest.mock('../admin-db', () => ({ getAdminDb: jest.fn(() => ({})) }))

import { applyPresetToStore } from '@merkiai/database'
import { applyOnboardingPreset, getOnboardingOptions, buildOnboardingProgress } from '../onboarding'

const mockApply = applyPresetToStore as unknown as jest.Mock
const T = '00000000-0000-0000-0000-000000000001'

const OPTIONS = {
  plan: 'pro',
  presets: [
    {
      key: 'moda-basico', name: 'Moda', niche: 'moda', description: null,
      theme: { color_primary: '#000' }, template: 'boutique',
      home_sections: [], sample_categories: [{}, {}, {}], sample_products: [{}, {}],
      inventory_model: 'multi_location', available_in_plans: [],
    },
  ],
  limits: { categories: 2, products: 5 },
  allowMultiLocation: true,
}

const OLD_ENV = process.env

beforeEach(() => {
  jest.resetAllMocks()
  process.env = { ...OLD_ENV, CONTROL_PLANE_URL: 'https://console.test', INTERNAL_API_SECRET: 's' }
  mockApply.mockResolvedValue({ tenantId: T, results: { theme: 'ok', categories: 'ok' } })
})

afterAll(() => {
  process.env = OLD_ENV
})

function mockFetchOk() {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => OPTIONS }) as unknown as typeof fetch
}

describe('getOnboardingOptions', () => {
  it('devuelve null si falta el control plane', async () => {
    delete process.env.CONTROL_PLANE_URL
    expect(await getOnboardingOptions(T)).toBeNull()
  })

  it('devuelve las opciones del control plane', async () => {
    mockFetchOk()
    const opts = await getOnboardingOptions(T)
    expect(opts?.plan).toBe('pro')
    expect(opts?.allowMultiLocation).toBe(true)
  })
})

describe('applyOnboardingPreset (gating HU-236)', () => {
  it('aplica el preset elegido pasando límites y multi-ubicación', async () => {
    mockFetchOk()
    const res = await applyOnboardingPreset(T, 'moda-basico', 'multi_location')
    expect(res.ok).toBe(true)
    const [, payload, opts] = mockApply.mock.calls[0]
    expect(payload.inventory_model).toBe('multi_location')
    expect(opts).toMatchObject({ limits: { categories: 2, products: 5 }, allowMultiLocation: true })
  })

  it('rechaza un preset no disponible para el plan', async () => {
    mockFetchOk()
    const res = await applyOnboardingPreset(T, 'inexistente')
    expect(res.ok).toBe(false)
    expect(mockApply).not.toHaveBeenCalled()
  })

  it('falla suave si el control plane no responde', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch
    const res = await applyOnboardingPreset(T, 'moda-basico')
    expect(res.ok).toBe(false)
    expect(res.error).toMatch(/control plane/i)
  })
})

describe('buildOnboardingProgress (HU-236 v2)', () => {
  const ALL_FALSE = { presetApplied: false, hasGeneral: false, hasProducts: false, hasCustomTheme: false }

  it('estado nulo + nada hecho = 0%', () => {
    const p = buildOnboardingProgress(null, ALL_FALSE)
    expect(p.percent).toBe(0)
    expect(p.completedCount).toBe(0)
    expect(p.totalCount).toBe(4)
    expect(p.finished).toBe(false)
  })

  it('todas las señales en true = 100%', () => {
    const p = buildOnboardingProgress(
      { presetApplied: 'moda', appliedAt: 'x', dismissed: false, completedAt: null },
      { presetApplied: true, hasGeneral: true, hasProducts: true, hasCustomTheme: true },
    )
    expect(p.percent).toBe(100)
    expect(p.checklist.every((c) => c.done)).toBe(true)
  })

  it('progreso parcial se redondea (1/4 = 25%)', () => {
    const p = buildOnboardingProgress(null, { ...ALL_FALSE, hasProducts: true })
    expect(p.completedCount).toBe(1)
    expect(p.percent).toBe(25)
    expect(p.checklist.find((c) => c.key === 'products')?.done).toBe(true)
  })

  it('finished=true si completedAt o dismissed', () => {
    expect(buildOnboardingProgress({ presetApplied: null, appliedAt: null, dismissed: true, completedAt: null }, ALL_FALSE).finished).toBe(true)
    expect(buildOnboardingProgress({ presetApplied: null, appliedAt: null, dismissed: false, completedAt: 'x' }, ALL_FALSE).finished).toBe(true)
  })
})
