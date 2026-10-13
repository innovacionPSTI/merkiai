import { NextRequest } from 'next/server'
import { activateHandler } from '@/lib/instance-api'

export const POST = (req: NextRequest) => activateHandler('email', req)
