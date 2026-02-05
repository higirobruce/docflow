import { NextResponse } from 'next/server'
import { db } from '@/src/db'
import { comments, users } from '@/src/db/schema'
import { eq, desc } from 'drizzle-orm'
import { auth } from '@/src/lib/auth'

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
        id: comments.id,
        content: comments.content,
        isInternal: comments.isInternal,
        createdAt: comments.createdAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.correspondenceId, correspondenceId))
      .orderBy(desc(comments.createdAt))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: idParam } = await params
    const correspondenceId = Number(idParam)
    if (isNaN(correspondenceId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const body = await request.json()
    if (!body.content?.trim()) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 })
    }

    const [comment] = await db
      .insert(comments)
      .values({
        correspondenceId,
        userId: Number(session.user.id),
        content: body.content.trim(),
        isInternal: body.isInternal ?? true,
      })
      .returning()

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }
}
