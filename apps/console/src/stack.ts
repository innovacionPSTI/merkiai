import { StackServerApp } from '@stackframe/stack'

/**
 * Stack Auth server app del CONTROL PLANE (proyecto propio, distinto de web/admin).
 * Los operadores de plataforma se autentican aquí; la autorización usa la
 * Project Permission `platform:operate` (ver `lib/platform-auth.ts`).
 */
export const stackServerApp = new StackServerApp({
  tokenStore: 'nextjs-cookie',
  projectId: process.env.NEXT_PUBLIC_HEXCLAVE_PROJECT_ID,
  publishableClientKey: process.env.NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY,
  secretServerKey: process.env.HEXCLAVE_SECRET_SERVER_KEY,
  urls: {
    signIn: '/login',
    afterSignIn: '/',
    afterSignOut: '/login',
  },
})
