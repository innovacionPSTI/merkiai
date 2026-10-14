/**
 * HU-279 · Sincroniza la columna legacy `tenants.primary_domain` con el dominio
 * PRIMARIO de `tenant_custom_domains`. Mantiene consistentes a los consumidores
 * que aún leen la columna (base-url canónica, admin, aprovisionamiento) mientras
 * dure la convivencia tabla ↔ columnas.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any

export async function syncPrimaryDomainColumn(db: Db, tenantId: string, primaryDomain: string | null): Promise<void> {
  try {
    await db
      .from('tenants')
      .update({
        primary_domain: primaryDomain,
        domain_status: primaryDomain ? 'active' : 'none',
        ...(primaryDomain ? { domain_requested: primaryDomain } : {}),
      })
      .eq('id', tenantId)
  } catch { /* best-effort: la tabla es la fuente de verdad del resolver */ }
}
