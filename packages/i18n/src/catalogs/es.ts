/**
 * Catálogo de REFERENCIA: español neutro (latinoamericano). Debe contener TODAS
 * las claves (lo exige `pnpm i18n:check`). Los catálogos regionales (`es-CO`,
 * `es-MX`, `es-ES`) solo sobrescriben lo que cambia. Mensajes en sintaxis ICU.
 */
const es = {
  common: {
    loading: 'Cargando…',
    save: 'Guardar',
    cancel: 'Cancelar',
    close: 'Cerrar',
    search: 'Buscar',
    back: 'Volver',
    continue: 'Continuar',
    yes: 'Sí',
    no: 'No',
    error_generic: 'Algo salió mal. Inténtalo de nuevo.',
    not_found: 'No encontramos lo que buscas.',
    language: 'Idioma',
    phone: 'Celular',
    computer: 'Computador',
  },
  address: {
    postal_code: 'Código postal',
    region: 'Departamento o estado',
    city: 'Ciudad o municipio',
    neighborhood: 'Barrio',
    line1: 'Dirección',
    line2: 'Apartamento, oficina o referencia',
  },
  shop: {
    cart: 'Carrito',
    add_to_cart: 'Agregar al carrito',
    view_cart: 'Ver carrito',
    checkout: 'Finalizar compra',
    out_of_stock: 'Agotado',
    items_count: '{count, plural, =0 {Sin productos} one {# producto} other {# productos}}',
    subtotal: 'Subtotal',
    shipping: 'Envío',
    total: 'Total',
    free_shipping: 'Envío gratis',
    suggest_locale: '¿Prefieres ver esta tienda en {language}?',
  },
  account: {
    welcome: '{gender, select, female {Bienvenida} male {Bienvenido} other {Te damos la bienvenida}}, {name}',
    orders: 'Mis pedidos',
    sign_in: 'Iniciar sesión',
    sign_out: 'Cerrar sesión',
  },
  email: {
    order_confirmed_subject: 'Tu pedido {orderNumber} fue confirmado',
    greeting: 'Hola, {name}:',
  },
} as const

export default es
