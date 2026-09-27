/**
 * @jest-environment node
 *
 * Onboarding (HU-236): resolución de opciones + aplicación del preset con gating.
 */
jest.mock('@merkiai/database', () => ({ applyPresetToStore: jest.fn() }))
jest.mock('../admin-db', () => ({ getAdminDb: jest.fn(() => ({})) }))

import { applyPresetToStore } from '@merkiai/database'
import { applyOnboardingPreset, getOnboardingOptions } from '../onboarding'

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
