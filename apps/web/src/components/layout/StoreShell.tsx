/**
 * StoreShell (HU-217) — chrome unificado del storefront.
 *
 * Renderiza Navbar + contenido + Footer usando `getStoreContext()` (tenant
 * resuelto por host, cacheado). Reemplaza la resolución/monaje duplicados que
 * había en cada layout de grupo de ruta (público/cart/checkout/cuenta), que
 * causaban que algunos mostraran la marca del tenant por defecto.
 *
 * El contenido (`children`) lo compone cada layout: el público envuelve en
 * `<main>`, la cuenta añade su sidebar, etc. Aquí solo vive el chrome.
 */
import Navbar from './Navbar'
import Footer from './Footer'
import SectionRenderer from '@/components/sections/SectionRenderer'
import { requireStoreContext } from '@/lib/store-context'
import { getSectionsWithItems } from '@merkiai/database'
import { resolveFeature, FEATURES } from '@merkiai/tenancy'

/**
 * Claves reservadas de las REGIONES de chrome (HU-372). Son páginas del CMS
 * (`page_type='region'`, no enrutables) cuyos bloques componen el encabezado y
 * el pie cuando el plan tiene `editable_chrome`.
 */
const HEADER_REGION = 'region_header'
const FOOTER_REGION = 'region_footer'

export default async function StoreShell({ children }: { children: React.ReactNode }) {
  // HU-229: si el host no resuelve a un tenant (modo estricto), 404 limpio.
  const { config, navItems, footerPages, db, entitlements, ecommerceEnabled } = await requireStoreContext()

  // HU-372 · chrome editable por regiones, gated por plan. Solo se consultan las
  // regiones si la feature está activa; si no hay secciones se cae al chrome
  // config-driven (Navbar/Footer) → cero regresión.
  const editableChrome = resolveFeature(entitlements, FEATURES.EDITABLE_CHROME)
  const [headerSections, footerSections] = editableChrome && db
    ? await Promise.all([
        getSectionsWithItems(HEADER_REGION, true, db).catch(() => []),
        getSectionsWithItems(FOOTER_REGION, true, db).catch(() => []),
      ])
    : [[], []]
  // Anti-recursión: ignora partials anidados dentro de la región.
  const headerBlocks = headerSections.filter((s) => s.section_type !== 'partial_ref')
  const footerBlocks = footerSections.filter((s) => s.section_type !== 'partial_ref')

  return (
    <>
      {headerBlocks.length > 0 ? (
        <header>
          {headerBlocks.map((s) => (
            <SectionRenderer key={s.id} section={s} pageKey={HEADER_REGION} whatsappNumber={config?.whatsapp_number} />
          ))}
        </header>
      ) : (
      <Navbar
        logoUrl={config?.logo_url}
        storeName={config?.store_name}
        navItems={navItems}
        showCart={ecommerceEnabled && (config?.nav_show_cart ?? true)}
        showAuth={config?.nav_show_auth ?? true}
        showWishlist={config?.nav_show_wishlist ?? true}
      />
      )}
      {children}
      {footerBlocks.length > 0 ? (
        <footer>
          {footerBlocks.map((s) => (
            <SectionRenderer key={s.id} section={s} pageKey={FOOTER_REGION} whatsappNumber={config?.whatsapp_number} />
          ))}
        </footer>
      ) : (
      <Footer
        logoUrl={config?.logo_url}
        storeName={config?.store_name}
        whatsapp={config?.whatsapp_number}
        social={{
          instagramUrl:     config?.instagram_url,
          instagramEnabled: config?.instagram_enabled,
          facebookUrl:      config?.facebook_url,
          facebookEnabled:  config?.facebook_enabled,
          tiktokUrl:        config?.tiktok_url,
          tiktokEnabled:    config?.tiktok_enabled,
        }}
        pages={footerPages}
        footerFlags={{
          showStore: config?.footer_show_store ?? true,
          showBlog:  config?.footer_show_blog  ?? true,
          showLegal: config?.footer_show_legal ?? true,
        }}
      />
      )}
    </>
  )
}
