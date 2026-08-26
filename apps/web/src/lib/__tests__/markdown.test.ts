import { markdownToHtml } from '../markdown'

describe('markdownToHtml · seguridad (HU-203)', () => {
  it('escapa HTML inyectado (no ejecuta scripts)', () => {
    const out = markdownToHtml('<script>alert(1)</script>')
    expect(out).not.toContain('<script>')
    expect(out).toContain('&lt;script&gt;')
  })

  it('neutraliza atributos peligrosos (onerror)', () => {
    const out = markdownToHtml('<img src=x onerror=alert(1)>')
    expect(out).not.toContain('<img')
    expect(out).toContain('&lt;img')
  })

  it('rechaza enlaces javascript:', () => {
    const out = markdownToHtml('[click](javascript:alert(1))')
    expect(out).not.toContain('javascript:')
    expect(out).toContain('href="#"')
  })

  it('rechaza enlaces data:', () => {
    const out = markdownToHtml('[x](data:text/html,<script>alert(1)</script>)')
    expect(out).toContain('href="#"')
  })

  it('permite enlaces http(s) legítimos', () => {
    const out = markdownToHtml('[Merkiai](https://merkiai.com)')
    expect(out).toContain('href="https://merkiai.com"')
    expect(out).toContain('rel="noopener noreferrer"')
  })

  it('conserva el formato markdown básico', () => {
    const out = markdownToHtml('# Título\n\n**negrita** y *itálica*')
    expect(out).toContain('<h1>Título</h1>')
    expect(out).toContain('<strong>negrita</strong>')
    expect(out).toContain('<em>itálica</em>')
  })
})
