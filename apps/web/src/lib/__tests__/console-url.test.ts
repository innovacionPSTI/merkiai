/**
 * @jest-environment node
 *
 * HU-364 — `CONSOLE_URL` es el único nombre; el alias `CONTROL_PLANE_URL` se retiró.
 */
import { consoleUrl } from '../console-url'

describe('consoleUrl', () => {
  const OLD = { ...process.env }
  afterEach(() => { process.env = { ...OLD } })

  it('lee CONSOLE_URL', () => {
    process.env.CONSOLE_URL = 'https://console.example'
    expect(consoleUrl()).toBe('https://console.example')
  })
  it('undefined si no está (el alias viejo ya no se lee)', () => {
    delete process.env.CONSOLE_URL; process.env.CONTROL_PLANE_URL = 'https://old.example'
    expect(consoleUrl()).toBeUndefined()
  })
})
