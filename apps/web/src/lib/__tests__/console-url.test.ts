/**
 * @jest-environment node
 *
 * HU-364 — `CONSOLE_URL` es el nombre canónico; `CONTROL_PLANE_URL` es alias en retiro.
 */
import { consoleUrl } from '../console-url'

describe('consoleUrl', () => {
  const OLD = { ...process.env }
  afterEach(() => { process.env = { ...OLD } })

  it('undefined si no hay ninguna de las dos', () => {
    delete process.env.CONSOLE_URL; delete process.env.CONTROL_PLANE_URL
    expect(consoleUrl()).toBeUndefined()
  })
  it('acepta el alias antiguo CONTROL_PLANE_URL y avisa una sola vez', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    delete process.env.CONSOLE_URL; process.env.CONTROL_PLANE_URL = 'https://old.example'
    expect(consoleUrl()).toBe('https://old.example')
    expect(consoleUrl()).toBe('https://old.example')
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toMatch(/CONSOLE_URL/)
    warn.mockRestore()
  })
  it('CONSOLE_URL tiene precedencia sobre el alias', () => {
    process.env.CONSOLE_URL = 'https://new.example'; process.env.CONTROL_PLANE_URL = 'https://old.example'
    expect(consoleUrl()).toBe('https://new.example')
  })
})
