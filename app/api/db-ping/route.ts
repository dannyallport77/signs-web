import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Lightweight connectivity check; avoids touching app tables
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('db-ping error:', error)
    return NextResponse.json({ ok: false, error: error?.message || 'DB ping failed' }, { status: 500 })
  }
}
