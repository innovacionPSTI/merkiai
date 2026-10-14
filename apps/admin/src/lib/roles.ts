/**
 * Definición de roles y permisos del panel de administración Merkiai.
 *
 * Roles con acceso al panel:
 *  - super_admin   : Acceso total + gestión de usuarios incluyendo otros admins
 *  - admin         : Acceso total + gestión de usuarios (no puede tocar super_admin ni promover a super_admin)
 *  - vendedor      : Ventas — productos, categorías, pedidos, clientes, cupones
 *  - gestor_tienda : Contenido/marketing — contenido, blog, newsletter,
 *                    apariencia, cupones, configuración general y legal
 *
 * Roles sin acceso al panel:
 *  - miembro       : Sin permisos. Rol predeterminado al crear un usuario.
 *                    Un admin debe asignar un rol real para que pueda ingresar.
 *  - customer      : Usuario del sitio web (apps/web). No aplica al admin.
 */

// Subpath puro (sin jwt/supabase) para no arrastrar ESM a los tests de componentes.
import { effectiveSectionsForRole } from '@merkiai/tenancy/entitlements'

/** Roles que tienen acceso efectivo al panel de administración */
export type AdminRole = 'super_admin' | 'admin' | 'vendedor' | 'gestor_tienda'

/**
 * Todos los roles que pueden existir en la columna profiles.role
 * para usuarios del panel de administración.
 * 'miembro' = usuario invitado pero sin permisos asignados aún.
 */
export type AssignableRole = AdminRole | 'miembro'

export type AdminSection =
  | 'dashboard'
  | 'productos'
  | 'categorias'
  | 'variantes'
  | 'pedidos'
  | 'clientes'
  | 'contenido'
  | 'blog'
  | 'newsletter'
  | 'cupones'
  | 'apariencia'
  | 'media'
  | 'configuracion'
  | 'usuarios'
  | 'sistema'

interface RoleConfig {
  label: string
  color: string        // Tailwind classes para badge
  sections: AdminSection[]
  canManageUsers: boolean
  canAccessFullConfig: boolean
  /**
   * HU-134 · Operaciones de datos en volumen (importar / exportar / respaldar /
   * borrado masivo). Mueven información sensible, así que se restringen a los
   * roles de administración por defecto. (La auditoría de cada operación es
   * HU-146.)
   */
  canManageData: boolean
}

export const ROLE_CONFIG: Record<AdminRole, RoleConfig> = {
  super_admin: {
    label: 'Super Admin',
    color: 'bg-red-100 text-red-700',
    sections: ['dashboard', 'productos', 'categorias', 'variantes', 'pedidos', 'clientes', 'contenido', 'blog', 'newsletter', 'cupones', 'apariencia', 'media', 'configuracion', 'usuarios', 'sistema'],
    canManageUsers: true,
    canAccessFullConfig: true,
    canManageData: true,
  },
  admin: {
    label: 'Admin',
    color: 'bg-brand-primary/10 text-brand-primary',
    sections: ['dashboard', 'productos', 'categorias', 'variantes', 'pedidos', 'clientes', 'contenido', 'blog', 'newsletter', 'cupones', 'apariencia', 'media', 'configuracion', 'usuarios', 'sistema'],
    canManageUsers: true,
    canAccessFullConfig: true,
    canManageData: true,
  },
  vendedor: {
    label: 'Vendedor',
    color: 'bg-green-100 text-green-700',
    // Enfoque ventas: gestión de catálogo, órdenes, clientes y descuentos
    sections: ['dashboard', 'productos', 'categorias', 'variantes', 'pedidos', 'clientes', 'cupones'],
    canManageUsers: false,
    canAccessFullConfig: false,
    canManageData: false,
  },
  gestor_tienda: {
    label: 'Gestor de Tienda',
    color: 'bg-blue-100 text-blue-700',
    // Enfoque contenido/marketing: visual, publicaciones, promociones y config básica
    sections: ['dashboard', 'contenido', 'blog', 'newsletter', 'apariencia', 'media', 'cupones', 'configuracion'],
    canManageUsers: false,
    canAccessFullConfig: false, // Solo ve config general y legal (no pagos ni envíos)
    canManageData: false,
  },
}

/** Roles con acceso real al panel (exluye 'miembro') */
export const ADMIN_ROLES: AdminRole[] = ['super_admin', 'admin', 'vendedor', 'gestor_tienda']

/** Verifica si un string es un AdminRole con acceso real al panel */
export function isAdminRole(role: string): role is AdminRole {
  return ADMIN_ROLES.includes(role as AdminRole)
}

/** Verifica si el rol tiene acceso a una sección (matriz por DEFECTO del código). */
export function canAccess(role: AdminRole, section: AdminSection): boolean {
  return ROLE_CONFIG[role].sections.includes(section)
}

/**
 * Secciones EFECTIVAS de un rol considerando la matriz del plan (HU-281).
 * admin/super_admin siempre completas; vendedor/gestor_tienda pueden ser
 * ampliadas o recortadas por el plan (`roleAccess`). Si no hay override, usa
 * el default del código.
 */
export function effectiveSections(
  role: AdminRole,
  roleAccess?: Record<string, string[]> | null,
): AdminSection[] {
  const defaults = ROLE_CONFIG[role].sections
  return effectiveSectionsForRole(role, defaults, roleAccess) as AdminSection[]
}

/**
 * Verifica acceso usando las secciones efectivas del AdminUser (rol + matriz del
 * plan). Si `allowedSections` no está presente, cae al default del rol.
 */
export function userCanAccess(
  user: { allowedSections?: AdminSection[]; role?: AdminRole },
  section: AdminSection,
): boolean {
  const secs = user.allowedSections ?? (user.role ? ROLE_CONFIG[user.role].sections : [])
  return secs.includes(section)
}

/**
 * HU-134 · ¿El usuario puede ejecutar operaciones de datos en volumen
 * (importar / exportar / respaldar / borrado masivo)? Restringido a roles de
 * administración. Se evalúa por rol (no por sección): un vendedor puede ver
 * Productos pero no exportar/importar/borrar en masa.
 */
export function userCanManageData(user: { role?: AdminRole | string }): boolean {
  const role = user.role as AdminRole | undefined
  return !!role && ROLE_CONFIG[role]?.canManageData === true
}

/**
 * Roles que se pueden asignar a un usuario desde /usuarios.
 * 'miembro' está incluido para poder "revocar" privilegios sin eliminar la cuenta.
 * 'super_admin' nunca es asignable (para evitar escalada de privilegios).
 */
export const ASSIGNABLE_ROLES: AssignableRole[] = ['admin', 'vendedor', 'gestor_tienda', 'miembro']

export const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  super_admin:   { label: 'Super Admin',      color: 'bg-red-100 text-red-700' },
  admin:         { label: 'Admin',             color: 'bg-brand-primary/10 text-brand-primary' },
  vendedor:      { label: 'Vendedor',          color: 'bg-green-100 text-green-700' },
  gestor_tienda: { label: 'Gestor de Tienda', color: 'bg-blue-100 text-blue-700' },
  miembro:       { label: 'Miembro',           color: 'bg-amber-100 text-amber-700' },
  customer:      { label: 'Cliente',           color: 'bg-gray-100 text-gray-500' },
}
