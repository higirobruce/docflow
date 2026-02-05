import { NextResponse } from 'next/server'
import { db } from '@/src/db'
import { correspondence, users, departments } from '@/src/db/schema'
import { eq, desc } from 'drizzle-orm'
import { auth } from '@/src/lib/auth'
import { canMutate } from '@/src/lib/authorization'

export async function GET() {
  try {
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
      .orderBy(desc(correspondence.createdAt))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching correspondence:', error)
    return NextResponse.json(
      { error: 'Failed to fetch correspondence' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!canMutate(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    const result = await db
      .insert(correspondence)
      .values({
        createdById: Number(session.user.id),
        referenceNumber: body.referenceNumber,
        subject: body.subject,
        description: body.description,
        type: body.type,
        priority: body.priority,
        status: body.status,
        senderName: body.senderName,
        senderEmail: body.senderEmail,
        senderPhone: body.senderPhone,
        senderOrganization: body.senderOrganization,
        senderAddress: body.senderAddress,
        receivedDate: new Date(body.receivedDate),
        dueDate: new Date(body.dueDate),
        completedDate: body.completedDate ? new Date(body.completedDate) : null,
        notes: body.notes,
        assignedToId: body.assignedToId || null,
        departmentId: body.departmentId || null,
      })
      .returning()

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error('Error creating correspondence:', error)
    return NextResponse.json(
      { error: 'Failed to create correspondence' },
      { status: 500 }
    )
  }
}
