import { NextRequest } from 'next/server'
import { listHandler, createHandler } from '@/lib/instance-api'

export const GET = () => listHandler('email')
export const POST = (req: NextRequest) => createHandler('email', req)
