import { StackServerApp } from '@stackframe/stack'

/**
 * Stack Auth server app para el panel de administración.
 *
 * Sign-up deshabilitado: los usuarios admin solo se crean
 * desde /usuarios por un super_admin.
 */
export const stackServerApp = new StackServerApp({
  tokenStore: 'nextjs-cookie',
  projectId: process.env.NEXT_PUBLIC_HEXCLAVE_PROJECT_ID,
  publishableClientKey: process.env.NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY,
  secretServerKey: process.env.HEXCLAVE_SECRET_SERVER_KEY,
  urls: {
    signIn: '/login',
    afterSignIn: '/dashboard',
    afterSignOut: '/login',
    // Sin signUp: el middleware redirige /handler/sign-up → /login
  },
})
