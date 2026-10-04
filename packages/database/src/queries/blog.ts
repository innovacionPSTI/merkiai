import type { Db } from '../client'
import type { BlogPost } from '../types'

/**
 * Lecturas de blog. `db` es **obligatorio** (tenant-scoped): nunca default a
 * service-role — así ningún caller lee cross-tenant por descuido (HU-232).
 * Para borrador (no-publicados) pásese un cliente que pueda verlos (machine/admin).
 */
export async function getBlogPosts(options: { category?: string; limit?: number } | undefined, db: Db) {
  const supabase = db
  let query = supabase
    .from('blog_posts')
    .select('*')
    .eq('published', true)
    .order('published_at', { ascending: false })

  if (options?.category) query = query.eq('category', options.category)
  if (options?.limit) query = query.limit(options.limit)

  const { data, error } = await query
  if (error) throw error
  return data as BlogPost[]
}

export async function getBlogPostBySlug(slug: string, db: Db) {
  const supabase = db
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (error) throw error
  return data as BlogPost
}

/** Draft mode: fetch post regardless of published status (for preview). */
export async function getBlogPostBySlugAny(slug: string, db: Db) {
  const supabase = db
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) throw error
  return data as BlogPost
}
