import { NextRequest } from 'next/server'
import { listHandler, createHandler } from '@/lib/instance-api'

export const GET = () => listHandler('shipping')
export const POST = (req: NextRequest) => createHandler('shipping', req)
