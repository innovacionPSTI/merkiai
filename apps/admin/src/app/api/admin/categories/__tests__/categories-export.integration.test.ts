/**
 * @jest-environment node
 *
 * Integration — GET /api/admin/categories/export (HU-132 export)
 *   · CSV con header del importador y parent_slug resuelto desde parent_id
 */
import { NextRequest } from 'next/server'

const data = [
  { id: 1, slug: 'ropa', name: 'Ropa', description: null, parent_id: null, meta_title: null, meta_description: null, image_url: null, active: true, order_index: 0 },
  { id: 2, slug: 'camisetas', name: 'Camisetas', description: null, parent_id: 1, meta_title: null, meta_description: null, image_url: null, active: true, order_index: 1 },
]
const mockFrom = jest.fn(() => ({ select: () => ({ order: () => Promise.resolve({ data }) }) }))

jest.mock('@/lib/auth', () => ({ getAdminUser: jest.fn(async () => ({ role: 'admin', tenantId: 't1' })) }))
jest.mock('@/lib/admin-db', () => ({ getAdminDb: () => ({ from: mockFrom }) }))

import { GET } from '../export/route'

describe('GET /api/admin/categories/export', () => {
  it('emite CSV con parent_slug resuelto', async () => {
    const res = await GET(new NextRequest('http://localhost/api/admin/categories/export') as any)
    expect(res.headers.get('Content-Type')).toContain('text/csv')
    const text = await res.text()
    const lines = text.split('\n')
    expect(lines[0]).toBe('slug,name,description,parent_slug,meta_title,meta_description,image_url,active,order_index')
    // camisetas → parent_slug = ropa
    const camisetas = lines.find((l) => l.startsWith('camisetas,'))!
    expect(camisetas.split(',')[3]).toBe('ropa')
  })
})
