import { NextRequest } from 'next/server'
import { patchHandler, deleteHandler } from '@/lib/instance-api'

export const PATCH = async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => patchHandler('email', (await params).id, req)
export const DELETE = async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => deleteHandler((await params).id)
