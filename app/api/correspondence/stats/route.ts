import { NextResponse } from 'next/server'
import { db } from '@/src/db'
import { correspondence } from '@/src/db/schema'
import { sql } from 'drizzle-orm'

export async function GET() {
  try {
    const stats = await db
      .select({
        total: sql<number>`count(*)::int`,
        pending: sql<number>`count(*) filter (where ${correspondence.status} = 'pending')::int`,
        inProgress: sql<number>`count(*) filter (where ${correspondence.status} = 'in_progress')::int`,
        completed: sql<number>`count(*) filter (where ${correspondence.status} = 'completed')::int`,
        overdue: sql<number>`count(*) filter (where ${correspondence.status} = 'overdue')::int`,
        urgent: sql<number>`count(*) filter (where ${correspondence.priority} = 'urgent')::int`,
        high: sql<number>`count(*) filter (where ${correspondence.priority} = 'high')::int`,
        normal: sql<number>`count(*) filter (where ${correspondence.priority} = 'normal')::int`,
        low: sql<number>`count(*) filter (where ${correspondence.priority} = 'low')::int`,
      })
      .from(correspondence)

    return NextResponse.json(stats[0])
  } catch (error) {
    console.error('Error fetching correspondence stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch correspondence statistics' },
      { status: 500 }
    )
  }
}
