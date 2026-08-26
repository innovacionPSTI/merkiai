import { Suspense } from 'react'
import { StackHandler } from '@stackframe/stack'
import { stackServerApp } from '@/stack'

/** Catch-all de Stack Auth (sign-in, sign-out, password-reset, etc.). */
export default function Handler(props: unknown) {
  return (
    <Suspense>
      <StackHandler fullPage app={stackServerApp} routeProps={props} />
    </Suspense>
  )
}
