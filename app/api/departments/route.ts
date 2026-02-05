import { NextResponse } from 'next/server'
import { db } from '@/src/db'
import { departments } from '@/src/db/schema'
import { asc } from 'drizzle-orm'

export async function GET() {
  try {
    const result = await db
      .select({
        id: departments.id,
        name: departments.name,
        code: departments.code,
      })
      .from(departments)
      .orderBy(asc(departments.name))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching departments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch departments' },
      { status: 500 }
    )
  }
}
