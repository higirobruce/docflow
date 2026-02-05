import { NextResponse } from 'next/server'
import { db } from '@/src/db'
import { correspondence, users, departments, activityLog } from '@/src/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/src/lib/auth'
import { canMutate } from '@/src/lib/authorization'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = Number(idParam)

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid correspondence ID' },
        { status: 400 }
      )
    }

    const result = await db
      .select({
        id: correspondence.id,
        referenceNumber: correspondence.referenceNumber,
        subject: correspondence.subject,
        description: correspondence.description,
        type: correspondence.type,
        priority: correspondence.priority,
        status: correspondence.status,
        senderName: correspondence.senderName,
        senderEmail: correspondence.senderEmail,
        senderPhone: correspondence.senderPhone,
        senderOrganization: correspondence.senderOrganization,
        senderAddress: correspondence.senderAddress,
        receivedDate: correspondence.receivedDate,
        dueDate: correspondence.dueDate,
        completedDate: correspondence.completedDate,
        notes: correspondence.notes,
        assignedTo: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
        department: {
          id: departments.id,
          name: departments.name,
          code: departments.code,
        },
        createdAt: correspondence.createdAt,
        updatedAt: correspondence.updatedAt,
      })
      .from(correspondence)
      .leftJoin(users, eq(correspondence.assignedToId, users.id))
      .leftJoin(departments, eq(correspondence.departmentId, departments.id))
      .where(eq(correspondence.id, id))

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Correspondence not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error('Error fetching correspondence:', error)
    return NextResponse.json(
      { error: 'Failed to fetch correspondence' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!canMutate(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: idParam } = await params
    const id = Number(idParam)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid correspondence ID' }, { status: 400 })
    }

    const body = await request.json()

    // Fetch current values for activity log
    const [current] = await db
      .select({ status: correspondence.status, priority: correspondence.priority })
      .from(correspondence)
      .where(eq(correspondence.id, id))

    if (!current) {
      return NextResponse.json({ error: 'Correspondence not found' }, { status: 404 })
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() }
    if (body.status) updates.status = body.status
    if (body.priority) updates.priority = body.priority
    if (body.assignedToId !== undefined) updates.assignedToId = body.assignedToId || null
    if (body.departmentId !== undefined) updates.departmentId = body.departmentId || null
    if (body.notes !== undefined) updates.notes = body.notes
    if (body.status === 'completed') updates.completedDate = new Date()

    const [updated] = await db
      .update(correspondence)
      .set(updates)
      .where(eq(correspondence.id, id))
      .returning()

    // Log status changes
    if (body.status && body.status !== current.status) {
      await db.insert(activityLog).values({
        correspondenceId: id,
        userId: Number(session.user.id),
        action: 'status_change',
        description: `Status changed from ${current.status} to ${body.status}`,
        previousValue: current.status,
        newValue: body.status,
      })
    }

    // Log priority changes
    if (body.priority && body.priority !== current.priority) {
      await db.insert(activityLog).values({
        correspondenceId: id,
        userId: Number(session.user.id),
        action: 'priority_change',
        description: `Priority changed from ${current.priority} to ${body.priority}`,
        previousValue: current.priority,
        newValue: body.priority,
      })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating correspondence:', error)
    return NextResponse.json(
      { error: 'Failed to update correspondence' },
      { status: 500 }
    )
  }
}
