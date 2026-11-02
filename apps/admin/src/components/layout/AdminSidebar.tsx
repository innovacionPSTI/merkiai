'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useMemo, type ReactNode } from 'react'
import { useStackApp } from '@stackframe/stack'
import { Icon } from '@merkiai/ui'
import type { AdminRole, AdminSection } from '@/lib/roles'
import { ROLE_CONFIG } from '@/lib/roles'
import { FEATURES } from '@/lib/features'

// ── Tipos ────────────────────────────────────────────────────────────────────

/** Ítem hoja: un link directo */
interface NavLeaf {
  kind: 'leaf'
  href: string
  icon: ReactNode
  label: string
  section: AdminSection
}

/** Sub-ítem dentro de un ítem expandible */
interface NavSubLeaf {
  href: string
  label: string
  fullAccessOnly?: boolean
}

/**
 * Ítem que enlaza a una ruta y despliega sub-rutas al estar activo.
 * Puede usarse tanto como hijo de un NavGroup como a nivel raíz.
 */
interface NavLeafWithSubs {
  kind: 'leaf-group'
  href: string
  icon: ReactNode
  label: string
  section: AdminSection
  children: NavSubLeaf[]
}

/** Grupo contenedor (no navega, solo agrupa) */
interface NavGroup {
  kind: 'group'
  icon: ReactNode
  label: string
  /** Sections que pertenecen al grupo — se muestra si el usuario tiene acceso a ALGUNA */
  sections: AdminSection[]
  children: (NavLeaf | NavLeafWithSubs)[]
}

/** Un nodo a nivel raíz puede ser hoja, grupo, o hoja expandible */
type NavNode = NavLeaf | NavGroup | NavLeafWithSubs

// ── Estructura de navegación ─────────────────────────────────────────────────

const NAV: NavNode[] = [
  {
    kind: 'leaf',
    href: '/dashboard',
    icon: <Icon name="dashboard" />,
    label: 'Dashboard',
    section: 'dashboard',
  },
  {
    kind: 'leaf',
    href: '/onboarding',
    icon: <Icon name="rocket" />,
    label: 'Configura tu tienda',
    section: 'configuracion',
  },
  {
    kind: 'group',
    icon: <Icon name="catalog" />,
    label: 'Catálogo',
    sections: ['productos', 'categorias', 'variantes'],
    children: [
      { kind: 'leaf', href: '/productos',  icon: <Icon name="product" />,  label: 'Productos',   section: 'productos' },
      { kind: 'leaf', href: '/categorias', icon: <Icon name="category" />, label: 'Categorías',  section: 'categorias' },
      { kind: 'leaf', href: '/variantes',  icon: <Icon name="variant" />,  label: 'Variantes',   section: 'variantes' },
      { kind: 'leaf', href: '/bundles',    icon: <Icon name="grid" />,     label: 'Bundles',     section: 'productos' },
      { kind: 'leaf', href: '/resenas',    icon: <Icon name="star" />,     label: 'Reseñas',     section: 'productos' },
    ],
  },
  {
    kind: 'group',
    icon: <Icon name="sales" />,
    label: 'Ventas',
    sections: ['pedidos', 'clientes', 'cupones', 'ventas_vip'],
    children: [
      { kind: 'leaf', href: '/pedidos',  icon: <Icon name="order" />,    label: 'Pedidos',  section: 'pedidos' },
      { kind: 'leaf', href: '/reportes', icon: <Icon name="chart" />,    label: 'Reportes', section: 'pedidos' },
      { kind: 'leaf', href: '/clientes', icon: <Icon name="customer" />, label: 'Clientes', section: 'clientes' },
      { kind: 'leaf', href: '/cupones',     icon: <Icon name="coupon" />, label: 'Cupones',     section: 'cupones' },
      { kind: 'leaf', href: '/promociones', icon: <Icon name="money" />,  label: 'Promociones', section: 'cupones' },
      { kind: 'leaf', href: '/gift-cards',  icon: <Icon name="star" />,   label: 'Gift cards',  section: 'cupones' },
      { kind: 'leaf', href: '/ventas-vip',  icon: <Icon name="star" />,   label: 'Ventas VIP',  section: 'ventas_vip' },
    ],
  },
  {
    // E24 · "Operaciones" se filtra en runtime según `inventory` (flag/entitlement).
    kind: 'group',
    icon: <Icon name="grid" />,
    label: 'Operaciones',
    sections: ['productos'],
    children: [
      { kind: 'leaf', href: '/inventario', icon: <Icon name="grid" />,    label: 'Inventario', section: 'productos' },
      { kind: 'leaf', href: '/compras',    icon: <Icon name="money" />,   label: 'Compras',    section: 'productos' },
      { kind: 'leaf', href: '/produccion', icon: <Icon name="product" />, label: 'Producción', section: 'productos' },
      { kind: 'leaf', href: '/modificadores', icon: <Icon name="product" />, label: 'Modificadores', section: 'productos' },
      { kind: 'leaf', href: '/listas-precio', icon: <Icon name="money" />, label: 'Listas de precio', section: 'productos' },
    ],
  },
  {
    kind: 'group',
    icon: <Icon name="content" />,
    label: 'Contenido',
    sections: ['contenido', 'blog', 'newsletter'],
    children: [
      { kind: 'leaf', href: '/contenido',  icon: <Icon name="content" />, label: 'Páginas',    section: 'contenido' },
      // HU-350/HU-359 · "Constructor" se filtra en runtime según `pageBuilder`
      // (flag legacy o entitlement page_builder); ver `navFor()` abajo.
      { kind: 'leaf', href: '/constructor', icon: <Icon name="builder" />, label: 'Constructor', section: 'contenido' },
      // HU-353 · "Colecciones" se filtra en runtime según `collections` (flag/entitlement).
      { kind: 'leaf', href: '/colecciones', icon: <Icon name="grid" />, label: 'Colecciones', section: 'contenido' },
      { kind: 'leaf', href: '/blog',       icon: <Icon name="blog" />,       label: 'Blog',       section: 'blog' },
      { kind: 'leaf', href: '/newsletter', icon: <Icon name="newsletter" />, label: 'Newsletter', section: 'newsletter' },
    ],
  },
  {
    kind: 'group',
    icon: <Icon name="appearance" />,
    label: 'Apariencia',
    sections: ['apariencia', 'media'],
    children: [
      { kind: 'leaf', href: '/plantillas',          icon: <Icon name="grid" />,    label: 'Plantillas', section: 'apariencia' },
      { kind: 'leaf', href: '/configuracion/temas', icon: <Icon name="palette" />, label: 'Temas',    section: 'apariencia' },
      { kind: 'leaf', href: '/media',               icon: <Icon name="media" />,   label: 'Archivos', section: 'media' },
    ],
  },
  // Configuración como nodo raíz expandible — evita el doble nivel "Configuración > Configuración"
  {
    kind: 'leaf-group',
    href: '/configuracion',
    icon: <Icon name="settings" />,
    label: 'Configuración',
    section: 'configuracion',
    children: [
      { href: '/configuracion/general', label: 'General' },
      { href: '/configuracion/dominio', label: 'Dominio' },
      { href: '/configuracion/envios',  label: 'Envíos',  fullAccessOnly: true },
      { href: '/configuracion/pagos',   label: 'Pagos',   fullAccessOnly: true },
      { href: '/configuracion/emails',  label: 'Emails',  fullAccessOnly: true },
      { href: '/configuracion/plantillas-correo', label: 'Plantillas de correo' },
      { href: '/redirects',             label: 'Redirecciones' },
      { href: '/configuracion/legal',   label: 'Legal' },
    ],
  },
  {
    kind: 'group',
    icon: <Icon name="system" />,
    label: 'Sistema',
    sections: ['usuarios', 'sistema'],
    children: [
      { kind: 'leaf', href: '/usuarios',          icon: <Icon name="users" />,    label: 'Usuarios',   section: 'usuarios' },
      { kind: 'leaf', href: '/auditoria',         icon: <Icon name="audit" />,    label: 'Auditoría',  section: 'sistema' },
      { kind: 'leaf', href: '/emails',            icon: <Icon name="bell" />,     label: 'Correos',    section: 'sistema' },
      { kind: 'leaf', href: '/sistema/apariencia', icon: <Icon name="settings" />, label: 'Apariencia', section: 'sistema' },
    ],
  },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

/** HU-350/HU-359 · aplica el gating runtime del Constructor sobre el NAV estático
 *  (filtra el leaf `/constructor` cuando el plan/flag no lo habilita). */
function navFor(pageBuilder: boolean, collections: boolean, inventory: boolean, priceLists: boolean): NavNode[] {
  const hidden = new Set<string>()
  // HU-368 · con el Constructor disponible, "Páginas" (/contenido) se retira; sin
  // él, se conserva "Páginas" como editor de respaldo (cero regresión por plan).
  // HU-370 · ídem "Configuración → Legal" (se edita como páginas en el Constructor).
  if (pageBuilder) { hidden.add('/contenido'); hidden.add('/configuracion/legal') }
  else hidden.add('/constructor')
  if (!collections) hidden.add('/colecciones')
  // E24 · sin el módulo de inventario, se oculta "Operaciones" (sus leaves).
  if (!inventory) { hidden.add('/inventario'); hidden.add('/compras'); hidden.add('/produccion'); hidden.add('/modificadores') }
  // E24 · HU-407 · "Listas de precio" se gatea por su propia feature `price_lists`.
  if (!priceLists) hidden.add('/listas-precio')
  if (hidden.size === 0) return NAV
  return NAV.map((node) => {
    if (node.kind === 'group') {
      return { ...node, children: node.children.filter((c) => !('href' in c && hidden.has(c.href as string))) }
    }
    if (node.kind === 'leaf-group') {
      return { ...node, children: node.children.filter((c) => !hidden.has(c.href)) }
    }
    return node
  // Oculta grupos que quedaron sin hijos (p. ej. "Operaciones" sin el módulo).
  }).filter((node) => node.kind !== 'group' || node.children.length > 0)
}

/** Devuelve el label del grupo/leaf-group activo si el pathname pertenece a él */
function getActiveGroupId(nodes: NavNode[], pathname: string): string | null {
  for (const node of nodes) {
    if (node.kind === 'group') {
      const hasActive = node.children.some(
        (child) => pathname === child.href || pathname.startsWith(child.href + '/')
      )
      if (hasActive) return node.label
    } else if (node.kind === 'leaf-group') {
      if (pathname === node.href || pathname.startsWith(node.href + '/')) return node.label
    }
  }
  return null
}

// ── Componente principal ─────────────────────────────────────────────────────

interface Props { role: AdminRole; allowedSections?: AdminSection[]; pageBuilder?: boolean; collections?: boolean; inventory?: boolean; priceLists?: boolean }

export default function AdminSidebar({ role, allowedSections: allowedSectionsProp, pageBuilder, collections, inventory, priceLists }: Props) {
  const pathname = usePathname()
  const app = useStackApp()

  // HU-281: usa las secciones efectivas (rol + matriz del plan); fallback al rol.
  const allowedSections = allowedSectionsProp ?? ROLE_CONFIG[role].sections
  const fullAccess = role === 'super_admin' || role === 'admin'

  // HU-350/HU-359 · NAV con el Constructor gated. Prop ausente → flag legacy.
  const pbEnabled = pageBuilder ?? FEATURES.pageBuilder
  const collEnabled = collections ?? FEATURES.collections
  const invEnabled = inventory ?? FEATURES.inventory
  const plEnabled = priceLists ?? false
  const nav = useMemo(() => navFor(pbEnabled, collEnabled, invEnabled, plEnabled), [pbEnabled, collEnabled, invEnabled, plEnabled])

  // Drawer móvil
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Grupos abiertos: se inicializan con el grupo activo actual
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const active = getActiveGroupId(nav, pathname)
    return active ? new Set([active]) : new Set()
  })

  // Si el pathname cambia (navegación), abrir el grupo correspondiente y cerrar drawer
  useEffect(() => {
    const active = getActiveGroupId(nav, pathname)
    if (active) setOpenGroups((prev) => new Set([...prev, active]))
    setDrawerOpen(false)
  }, [pathname, nav])

  function toggleGroup(label: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      next.has(label) ? next.delete(label) : next.add(label)
      return next
    })
  }

  async function handleSignOut() { await app.signOut() }

  // Filtra los nodos visibles según el rol
  const visibleNodes = nav.filter((node) => {
    if (node.kind === 'leaf') return allowedSections.includes(node.section)
    if (node.kind === 'leaf-group') return allowedSections.includes(node.section)
    // Grupo: visible si el usuario tiene acceso a al menos un hijo
    return node.sections.some((s) => allowedSections.includes(s))
  })

  return (
    <>
      {/* Hamburger — solo móvil */}
      <button
        aria-label="Abrir menú"
        onClick={() => setDrawerOpen(true)}
        className="md:hidden fixed top-0 left-0 z-50 h-14 w-14 flex items-center justify-center text-brand-sidebar"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Overlay backdrop — solo móvil */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setDrawerOpen(false)}
        />
      )}

    <aside className={[
      'w-56 flex-shrink-0 bg-brand-sidebar flex flex-col',
      // Móvil: drawer fijo fuera de pantalla; desktop: elemento de flujo normal
      'fixed inset-y-0 left-0 z-50 transition-transform duration-300',
      'md:relative md:z-auto md:translate-x-0 md:min-h-screen',
      drawerOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
    ].join(' ')}>
      {/* Logo */}
      <div className="p-5 border-b border-brand-cream/10">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand-cream flex items-center justify-center">
            <span className="font-display text-brand-primary text-xs font-bold">▲</span>
          </div>
          <span className="font-display text-brand-cream text-base">Admin</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {visibleNodes.map((node) => {

          // ── Hoja simple ─────────────────────────────────────────────────────
          if (node.kind === 'leaf') {
            const isActive = pathname === node.href || pathname.startsWith(node.href + '/')
            return (
              <Link
                key={node.href}
                href={node.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-brand text-sm transition-colors ${
                  isActive
                    ? 'bg-brand-dark text-brand-cream font-semibold'
                    : 'text-brand-cream/60 hover:text-brand-cream hover:bg-brand-cream/10'
                }`}
              >
                <span className="text-base leading-none">{node.icon}</span>
                {node.label}
              </Link>
            )
          }

          // ── Hoja expandible a nivel raíz (ej. Configuración) ───────────────
          if (node.kind === 'leaf-group') {
            const isActive = pathname === node.href || pathname.startsWith(node.href + '/')
            // La expansión la controla el estado (no la ruta): así se puede
            // colapsar aunque estés dentro de una subpágina. La navegación la
            // hace el Link; el chevron es un botón de toggle independiente.
            const isOpen = openGroups.has(node.label)
            return (
              <div key={node.href}>
                <div
                  className={`flex items-center rounded-xl font-brand text-sm transition-colors ${
                    isActive
                      ? 'bg-brand-dark text-brand-cream font-semibold'
                      : 'text-brand-cream/60 hover:text-brand-cream hover:bg-brand-cream/10'
                  }`}
                >
                  <Link href={node.href} className="flex items-center gap-3 px-3 py-2.5 flex-1 min-w-0">
                    <span className="text-base leading-none">{node.icon}</span>
                    <span className="flex-1">{node.label}</span>
                  </Link>
                  <button
                    type="button"
                    aria-label={isOpen ? `Colapsar ${node.label}` : `Expandir ${node.label}`}
                    aria-expanded={isOpen}
                    onClick={() => toggleGroup(node.label)}
                    className="shrink-0 px-3 py-2.5 text-current/70 hover:text-current"
                  >
                    <svg
                      className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {isOpen && (
                  <div className="mt-0.5 ml-3 pl-3 border-l border-brand-cream/15 space-y-0.5">
                    {node.children
                      .filter((sub) => !sub.fullAccessOnly || fullAccess)
                      .map((sub) => {
                        const subActive = pathname === sub.href
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className={`flex items-center px-2 py-1.5 rounded-md font-brand text-xs transition-colors ${
                              subActive
                                ? 'text-brand-cream font-semibold'
                                : 'text-brand-cream/40 hover:text-brand-cream'
                            }`}
                          >
                            {sub.label}
                          </Link>
                        )
                      })}
                  </div>
                )}
              </div>
            )
          }

          // ── Grupo contenedor ────────────────────────────────────────────────
          const isOpen = openGroups.has(node.label)
          const visibleChildren = node.children.filter((child) =>
            allowedSections.includes(child.section)
          )
          if (!visibleChildren.length) return null

          const groupHasActive = visibleChildren.some(
            (child) => pathname === child.href || pathname.startsWith(child.href + '/')
          )

          return (
            <div key={node.label}>
              {/* Cabecera del grupo */}
              <button
                onClick={() => toggleGroup(node.label)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-brand text-sm transition-colors ${
                  groupHasActive && !isOpen
                    ? 'text-brand-cream'
                    : 'text-brand-cream/50 hover:text-brand-cream hover:bg-brand-cream/10'
                }`}
              >
                <span className="text-base leading-none">{node.icon}</span>
                <span className="flex-1 text-left">{node.label}</span>
                <svg
                  className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Hijos del grupo */}
              {isOpen && (
                <div className="mt-0.5 ml-3 pl-3 border-l border-brand-cream/15 space-y-0.5">
                  {visibleChildren.map((child) => {
                    // leaf-group hijo (extensibilidad futura)
                    if (child.kind === 'leaf-group') {
                      const isLeafActive = pathname === child.href || pathname.startsWith(child.href + '/')
                      return (
                        <div key={child.href}>
                          <Link
                            href={child.href}
                            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-brand text-xs transition-colors ${
                              isLeafActive
                                ? 'bg-brand-cream/15 text-brand-cream font-semibold'
                                : 'text-brand-cream/50 hover:text-brand-cream hover:bg-brand-cream/10'
                            }`}
                          >
                            <span className="text-sm leading-none">{child.icon}</span>
                            {child.label}
                            <svg
                              className={`ml-auto w-2.5 h-2.5 transition-transform ${isLeafActive ? 'rotate-90' : ''}`}
                              fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                          {isLeafActive && (
                            <div className="mt-0.5 ml-3 pl-2.5 border-l border-brand-cream/10 space-y-0.5">
                              {child.children
                                .filter((sub) => !sub.fullAccessOnly || fullAccess)
                                .map((sub) => {
                                  const subActive = pathname === sub.href
                                  return (
                                    <Link
                                      key={sub.href}
                                      href={sub.href}
                                      className={`flex items-center px-2 py-1.5 rounded-md font-brand text-xs transition-colors ${
                                        subActive
                                          ? 'text-brand-cream font-semibold'
                                          : 'text-brand-cream/40 hover:text-brand-cream'
                                      }`}
                                    >
                                      {sub.label}
                                    </Link>
                                  )
                                })}
                            </div>
                          )}
                        </div>
                      )
                    }

                    // leaf hijo normal
                    const isActive = pathname === child.href || pathname.startsWith(child.href + '/')
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-brand text-xs transition-colors ${
                          isActive
                            ? 'bg-brand-cream/15 text-brand-cream font-semibold'
                            : 'text-brand-cream/50 hover:text-brand-cream hover:bg-brand-cream/10'
                        }`}
                      >
                        <span className="text-sm leading-none">{child.icon}</span>
                        {child.label}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-brand-cream/10 space-y-3">
        <div className="px-3">
          <span className={`text-xs font-brand font-semibold px-2.5 py-1 rounded-full ${
            role === 'super_admin' ? 'bg-red-500/20 text-red-300' :
            role === 'admin'       ? 'bg-brand-cream/20 text-brand-cream/70' :
            role === 'vendedor'    ? 'bg-green-500/20 text-green-300' :
                                     'bg-blue-500/20 text-blue-300'
          }`}>
            {ROLE_CONFIG[role].label}
          </span>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl font-brand text-sm text-brand-cream/40 hover:text-brand-cream hover:bg-brand-cream/10 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
          Cerrar sesión
        </button>
      </div>
    </aside>
    </>
  )
}
