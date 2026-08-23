/**
 * Email helpers para apps/admin.
 * Todas las funciones provienen de @merkiai/database — re-exportadas aquí
 * para que los callers internos no cambien su ruta de importación.
 */
export type { EmailConfig } from '@merkiai/database'
export { sendShippingNotification, sendStatusNotification, sendPaymentConfirmed } from '@merkiai/database'
