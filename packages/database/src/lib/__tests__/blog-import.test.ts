import { parseBlogPostsCsv, BLOG_IMPORT_TEMPLATE } from '../blog-import'

describe('parseBlogPostsCsv', () => {
  it('parsea posts por slug', () => {
    const csv = ['slug,title,excerpt,category,published,published_at', 'hola,Hola,Resumen,Noticias,true,2026-01-15'].join('\n')
    const { posts, errors } = parseBlogPostsCsv(csv)
    expect(errors).toHaveLength(0)
    expect(posts[0]).toMatchObject({ slug: 'hola', title: 'Hola', excerpt: 'Resumen', category: 'Noticias', published: true, published_at: '2026-01-15' })
  })

  it('publicado sin fecha → asigna fecha actual', () => {
    const { posts } = parseBlogPostsCsv(['slug,title,published', 'x,X,true'].join('\n'))
    expect(posts[0].published).toBe(true)
    expect(posts[0].published_at).toBeTruthy()
  })

  it('borrador sin fecha → published_at null', () => {
    const { posts } = parseBlogPostsCsv(['slug,title,published', 'x,X,false'].join('\n'))
    expect(posts[0].published_at).toBeNull()
  })

  it('acepta sinónimos ES', () => {
    const { posts, errors } = parseBlogPostsCsv(['slug,titulo,resumen,categoria', 'g,Guía,Res,Guías'].join('\n'))
    expect(errors).toHaveLength(0)
    expect(posts[0]).toMatchObject({ title: 'Guía', excerpt: 'Res', category: 'Guías' })
  })

  it('exige slug y title; reporta duplicados', () => {
    const { posts, errors } = parseBlogPostsCsv(['slug,title', 'a,', 'b,B', 'b,B2'].join('\n'))
    expect(posts).toHaveLength(1)
    expect(errors.some((e) => /título/i.test(e.message))).toBe(true)
    expect(errors.some((e) => /duplicado/i.test(e.message))).toBe(true)
  })

  it('la plantilla se parsea sin errores', () => {
    const { posts, errors } = parseBlogPostsCsv(BLOG_IMPORT_TEMPLATE)
    expect(errors).toHaveLength(0)
    expect(posts).toHaveLength(2)
  })
})
