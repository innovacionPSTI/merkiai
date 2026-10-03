import type { ReactNode, SVGProps } from 'react'

/**
 * Iconografía única del panel (HU-240). Familia de trazo (stroke), `currentColor`,
 * un solo grosor. Reemplaza los emojis del admin y los SVG ad-hoc. Uso:
 *   <Icon name="product" size={18} />
 * El color se hereda del contexto (CSS `color`/`stroke`).
 */
export type IconName =
  // genéricos / acciones
  | 'dashboard' | 'rocket' | 'search' | 'filter' | 'plus' | 'edit' | 'trash'
  | 'more' | 'bell' | 'external' | 'check' | 'alert' | 'clock' | 'settings'
  // admin · objetos
  | 'catalog' | 'product' | 'category' | 'variant' | 'sales' | 'order'
  | 'customer' | 'users' | 'coupon' | 'content' | 'builder' | 'blog'
  | 'newsletter' | 'appearance' | 'palette' | 'media' | 'system'
  // console · objetos
  | 'tenant' | 'plan' | 'preset' | 'domain' | 'audit'

const P: Record<IconName, ReactNode> = {
  dashboard: (<><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>),
  rocket: (<><path d="M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2" /><path d="M9 13a9 9 0 019-9c1 0 1 0 1 1a9 9 0 01-9 9" /><path d="M9 13l-2-1 1-3M11 15l1 2 3-1" /><circle cx="14.5" cy="8.5" r="1" /></>),
  search: (<><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>),
  filter: (<path d="M3 5h18l-7 8v5l-4 2v-7z" />),
  plus: (<path d="M12 5v14M5 12h14" />),
  edit: (<><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" /></>),
  trash: (<><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></>),
  more: (<><circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /></>),
  bell: (<><path d="M6 8a6 6 0 1112 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10 21a2 2 0 004 0" /></>),
  external: (<><path d="M14 3h7v7" /><path d="M10 14L21 3" /><path d="M21 14v7H3V3h7" /></>),
  check: (<path d="M20 6L9 17l-5-5" />),
  alert: (<><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></>),
  clock: (<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  settings: (<><circle cx="12" cy="12" r="3" /><path d="M19.4 13a7.9 7.9 0 000-2l2-1.5-2-3.5-2.3 1a8 8 0 00-1.7-1L15 2H9l-.4 2.5a8 8 0 00-1.7 1l-2.3-1-2 3.5L4.6 11a7.9 7.9 0 000 2l-2 1.5 2 3.5 2.3-1a8 8 0 001.7 1L9 22h6l.4-2.5a8 8 0 001.7-1l2.3 1 2-3.5z" /></>),
  catalog: (<><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></>),
  product: (<><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8" /></>),
  category: (<path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />),
  variant: (<><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" /><path d="M1 14h6M9 8h6M17 16h6" /></>),
  sales: (<><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 2h3l2.6 13a2 2 0 002 1.6h9.6a2 2 0 002-1.6L22 6H5.5" /></>),
  order: (<><path d="M21 16V8l-9-5-9 5v8l9 5 9-5z" /><path d="M3.3 7L12 12l8.7-5M12 22V12" /></>),
  customer: (<><path d="M17 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" /><circle cx="9.5" cy="7" r="4" /><path d="M22 21v-2a4 4 0 00-3-3.9" /></>),
  users: (<><path d="M17 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" /><circle cx="9.5" cy="7" r="4" /><path d="M22 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8" /></>),
  coupon: (<><path d="M20 10V7a2 2 0 00-2-2H6a2 2 0 00-2 2v3a2 2 0 010 4v3a2 2 0 002 2h12a2 2 0 002-2v-3a2 2 0 010-4z" /><path d="M14 5v14" /></>),
  content: (<><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h5" /></>),
  builder: (<><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>),
  blog: (<><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" /></>),
  newsletter: (<><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7l-10 6L2 7" /></>),
  appearance: (<><circle cx="13.5" cy="6.5" r="1" /><circle cx="17.5" cy="10.5" r="1" /><circle cx="8.5" cy="7.5" r="1" /><circle cx="6.5" cy="12.5" r="1" /><path d="M12 2a10 10 0 100 20c1.4 0 2-1 2-2 0-1.3-1-1.5-1-2.5s.8-1.5 2-1.5h1a4 4 0 004-4c0-5-4-10-10-10z" /></>),
  palette: (<><circle cx="13.5" cy="6.5" r="1" /><circle cx="17.5" cy="10.5" r="1" /><circle cx="8.5" cy="7.5" r="1" /><circle cx="6.5" cy="12.5" r="1" /><path d="M12 2a10 10 0 100 20c1.4 0 2-1 2-2 0-1.3-1-1.5-1-2.5s.8-1.5 2-1.5h1a4 4 0 004-4c0-5-4-10-10-10z" /></>),
  media: (<><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></>),
  system: (<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></>),
  tenant: (<><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" /><path d="M9 9v.01M9 13v.01M9 17v.01" /></>),
  plan: (<><rect x="3" y="4" width="18" height="6" rx="1.5" /><rect x="3" y="14" width="18" height="6" rx="1.5" /></>),
  preset: (<><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>),
  domain: (<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 000 18M12 3a14 14 0 010 18" /></>),
  audit: (<><rect x="4" y="5" width="16" height="16" rx="2" /><path d="M8 3v4M16 3v4M8 12h8M8 16h5" /></>),
}

export function Icon({ name, size = 18, ...rest }: { name: IconName; size?: number } & Omit<SVGProps<SVGSVGElement>, 'name'>) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" focusable="false" {...rest}
    >
      {P[name]}
    </svg>
  )
}
