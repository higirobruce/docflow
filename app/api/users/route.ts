import { NextResponse } from 'next/server'
import { db } from '@/src/db'
import { users } from '@/src/db/schema'
import { asc } from 'drizzle-orm'

export async function GET() {
  try {
    const result = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .orderBy(asc(users.name))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
