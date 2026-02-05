import { NextResponse } from 'next/server'
import { db } from '@/src/db'
import { activityLog, users } from '@/src/db/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const correspondenceId = Number(idParam)
    if (isNaN(correspondenceId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const result = await db
      .select({
        id: activityLog.id,
        action: activityLog.action,
        description: activityLog.description,
        previousValue: activityLog.previousValue,
        newValue: activityLog.newValue,
        createdAt: activityLog.createdAt,
        user: {
          id: users.id,
          name: users.name,
        },
      })
      .from(activityLog)
      .leftJoin(users, eq(activityLog.userId, users.id))
      .where(eq(activityLog.correspondenceId, correspondenceId))
      .orderBy(desc(activityLog.createdAt))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching activity log:', error)
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 })
  }
}
