/** English (base). Regional catalogs (`en-US`) override only differences. */
const en = {
  common: {
    loading: 'Loading…',
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    search: 'Search',
    back: 'Back',
    continue: 'Continue',
    yes: 'Yes',
    no: 'No',
    error_generic: 'Something went wrong. Please try again.',
    not_found: "We couldn't find what you're looking for.",
    language: 'Language',
    phone: 'Mobile phone',
    computer: 'Computer',
  },
  address: {
    postal_code: 'Postal code',
    region: 'State or province',
    city: 'City',
    neighborhood: 'Neighborhood',
    line1: 'Address',
    line2: 'Apartment, suite or reference',
  },
  shop: {
    cart: 'Cart',
    add_to_cart: 'Add to cart',
    view_cart: 'View cart',
    checkout: 'Checkout',
    out_of_stock: 'Sold out',
    items_count: '{count, plural, =0 {No items} one {# item} other {# items}}',
    subtotal: 'Subtotal',
    shipping: 'Shipping',
    total: 'Total',
    free_shipping: 'Free shipping',
    suggest_locale: 'Would you like to view this store in {language}?',
  },
  account: {
    welcome: 'Welcome, {name}',
    orders: 'My orders',
    sign_in: 'Sign in',
    sign_out: 'Sign out',
  },
  email: {
    order_confirmed_subject: 'Your order {orderNumber} is confirmed',
    greeting: 'Hi {name},',
  },
}

export default en
