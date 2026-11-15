import type { Metadata } from 'next'
import Link from 'next/link'
import BlogPostForm from '../BlogPostForm'
import { T } from '@merkiai/ui'

export const metadata: Metadata = { title: 'Nuevo artículo — Blog' }

export default function BlogNuevoPage() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-8">
        <Link
          href="/blog"
          className="font-brand text-sm text-brand-primary/50 hover:text-brand-primary transition-colors"
        >
          <T>← Blog</T>
        </Link>
        <span className="text-brand-primary/20">/</span>
        <h1 className="font-display text-brand-primary text-2xl"><T>Nuevo artículo</T></h1>
      </div>
      <BlogPostForm />
    </div>
  )
}
