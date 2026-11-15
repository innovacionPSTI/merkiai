import { escapeHtml, safeJsonForScript, safeReturnPath, safeFromName, isCrossSiteMutation, sniffImageType } from '../security'

describe('hardening · utilidades de seguridad', () => {
  it('escapeHtml neutraliza etiquetas y atributos', () => {
    expect(escapeHtml('<img src=x onerror="a()">')).toBe('&lt;img src=x onerror=&quot;a()&quot;&gt;')
    expect(escapeHtml(null)).toBe('')
  })
  it('safeJsonForScript no permite cerrar el <script> y sigue siendo JSON válido', () => {
    const out = safeJsonForScript({ name: '</script><script>alert(1)</script>' })
    expect(out).not.toContain('</script>')
    expect(JSON.parse(out).name).toBe('</script><script>alert(1)</script>')
  })
  it('safeReturnPath bloquea open redirects', () => {
    expect(safeReturnPath('/account/orders')).toBe('/account/orders')
    expect(safeReturnPath('//evil.com', '/x')).toBe('/x')
    expect(safeReturnPath('/\\evil.com', '/x')).toBe('/x')
    expect(safeReturnPath('https://evil.com', '/x')).toBe('/x')
    expect(safeReturnPath('javascript:alert(1)', '/x')).toBe('/x')
    expect(safeReturnPath(null, '/x')).toBe('/x')
  })
  it('safeFromName limpia caracteres de cabecera', () => {
    expect(safeFromName('Tienda <x>\r\nBcc: a@b.co')).toBe('Tienda xBcc: a@b.co')
    expect(safeFromName('')).toBe('Mi Tienda')
  })
  it('isCrossSiteMutation: bloquea POST de otro origen; permite mismo origen y server-to-server', () => {
    expect(isCrossSiteMutation('POST', 'https://evil.com', 'admin.merkiai.com')).toBe(true)
    expect(isCrossSiteMutation('POST', 'null', 'admin.merkiai.com')).toBe(true)
    expect(isCrossSiteMutation('POST', 'https://admin.merkiai.com', 'admin.merkiai.com')).toBe(false)
    expect(isCrossSiteMutation('POST', null, 'admin.merkiai.com')).toBe(false)
    expect(isCrossSiteMutation('GET', 'https://evil.com', 'admin.merkiai.com')).toBe(false)
  })
  it('sniffImageType reconoce imágenes reales y rechaza el resto', () => {
    expect(sniffImageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg')
    expect(sniffImageType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe('image/png')
    expect(sniffImageType(new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]))).toBe('image/gif')
    expect(sniffImageType(new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]))).toBe('image/webp')
    expect(sniffImageType(new TextEncoder().encode('<svg onload=alert(1)>'))).toBeNull()
    expect(sniffImageType(new TextEncoder().encode('<html>'))).toBeNull()
  })
})

describe('CSP con nonce', () => {
  it('genera nonces base64 de 128 bits distintos', async () => {
    const { generateNonce } = await import('../security')
    const a = generateNonce(); const b = generateNonce()
    expect(a).toMatch(/^[A-Za-z0-9+/]{22}==$/)
    expect(a).not.toBe(b)
  })
  it('script-src con nonce + strict-dynamic; eval solo en dev', async () => {
    const { nonceScriptSrc } = await import('../security')
    const prod = nonceScriptSrc('abc')
    expect(prod).toContain("'nonce-abc'")
    expect(prod).toContain("'strict-dynamic'")
    expect(prod).not.toContain('unsafe-eval')
    expect(nonceScriptSrc('abc', { dev: true })).toContain("'unsafe-eval'")
  })
})
