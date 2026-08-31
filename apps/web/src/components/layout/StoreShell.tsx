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
import { getStoreContext } from '@/lib/store-context'

export default async function StoreShell({ children }: { children: React.ReactNode }) {
  const { config, navItems, footerPages } = await getStoreContext()

  return (
    <>
      <Navbar
        logoUrl={config?.logo_url}
        storeName={config?.store_name}
        navItems={navItems}
        showCart={config?.nav_show_cart ?? true}
        showAuth={config?.nav_show_auth ?? true}
      />
      {children}
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
    </>
  )
}
