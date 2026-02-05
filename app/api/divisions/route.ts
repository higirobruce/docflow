import { NextResponse } from 'next/server'
import { db } from '@/src/db'
import { divisions } from '@/src/db/schema'
import { asc } from 'drizzle-orm'

export async function GET() {
  try {
    const result = await db
      .select({
        id: divisions.id,
        name: divisions.name,
        code: divisions.code,
      })
      .from(divisions)
      .orderBy(asc(divisions.name))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching divisions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch divisions' },
      { status: 500 }
    )
  }
}
