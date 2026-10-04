import type { ReactNode } from 'react'
import { resolveSectionStyle } from '@merkiai/database'

/**
 * HU-253 · Envoltorio de estilo compartido por sección. Aplica fondo (token del
 * tema o imagen) y espaciado vertical extra desde `settings.style_*`. Si la
 * sección no define estilo, devuelve el contenido sin envolver (cero regresión).
 */
export default function SectionShell({ settings, children }: { settings: unknown; children: ReactNode }) {
  const style = resolveSectionStyle(settings)
  if (!style.hasStyle) return <>{children}</>

  const cls = [style.bgClass, style.padTopClass, style.padBottomClass].filter(Boolean).join(' ')
  const bgStyle = style.bgImage
    ? { backgroundImage: `url(${style.bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : undefined

  return (
    <div className={cls} style={bgStyle}>
      {children}
    </div>
  )
}
