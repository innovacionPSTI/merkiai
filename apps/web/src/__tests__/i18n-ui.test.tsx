import React from 'react'
import { render, screen } from '@testing-library/react'
import { I18nProvider, useT, useFormat } from '@/components/i18n/I18nProvider'

function Probe() {
  const t = useT('web.cart')
  const { money } = useFormat()
  return <p>{t('title')} · {money(120000)}</p>
}

describe('HU-465 · interfaz por idioma', () => {
  it('sin proveedor usa es-CO (comportamiento histórico)', () => {
    render(<Probe />)
    expect(screen.getByText(/Mi carrito · \$\s?120\.000/)).toBeTruthy()
  })
  it('es-ES usa "cesta" y en-US traduce la interfaz y el formato (la moneda sigue siendo COP)', () => {
    const { unmount } = render(<I18nProvider locale="es-ES"><Probe /></I18nProvider>)
    expect(screen.getByText(/Mi cesta/)).toBeTruthy()
    unmount()
    render(<I18nProvider locale="en-US"><Probe /></I18nProvider>)
    expect(screen.getByText(/My cart · COP\s?120,000/)).toBeTruthy()
  })
})
