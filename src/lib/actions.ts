'use server'

import { db } from '../db'
import { correspondence, users, departments } from '../db/schema'
import { eq, desc, sql } from 'drizzle-orm'
import { generateReferenceNumber } from './date-utils'
import { revalidatePath } from 'next/cache'
import { requireAuth } from './authorization'
import { canMutate } from './authorization'

// Get all correspondence
export async function getCorrespondence() {
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
      receivedDate: correspondence.receivedDate,
      dueDate: correspondence.dueDate,
      completedDate: correspondence.completedDate,
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

  return result
}

// Get correspondence statistics
export async function getCorrespondenceStats() {
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

  return stats[0]
}

// Get single correspondence by ID
export async function getCorrespondenceById(id: number) {
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
      attachments: correspondence.attachments,
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

  return result[0]
}

// Create new correspondence
export async function createCorrespondence(formData: {
  subject: string
  description: string
  type: string
  priority: string
  senderName: string
  senderEmail?: string
  senderPhone?: string
  senderOrganization?: string
  senderAddress?: string
  assignedToId?: number
  departmentId?: number
  receivedDate: string
  dueDate: string
  notes?: string
  createdById: number
}) {
  const session = await requireAuth()
  if (!canMutate(session.user.role)) {
    throw new Error('Forbidden: insufficient permissions')
  }

  const referenceNumber = generateReferenceNumber()

  const result = await db
    .insert(correspondence)
    .values({
      referenceNumber,
      subject: formData.subject,
      description: formData.description,
      type: formData.type as any,
      priority: formData.priority as any,
      senderName: formData.senderName,
      senderEmail: formData.senderEmail,
      senderPhone: formData.senderPhone,
      senderOrganization: formData.senderOrganization,
      senderAddress: formData.senderAddress,
      assignedToId: formData.assignedToId,
      departmentId: formData.departmentId,
      receivedDate: new Date(formData.receivedDate),
      dueDate: new Date(formData.dueDate),
      notes: formData.notes,
      createdById: formData.createdById,
    })
    .returning()

  revalidatePath('/correspondence')
  revalidatePath('/')

  return result[0]
}

// Get all active users
export async function getUsers() {
  return await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      department: users.department,
    })
    .from(users)
    .where(eq(users.isActive, true))
    .orderBy(users.name)
}

// Get all departments
export async function getDepartments() {
  return await db
    .select({
      id: departments.id,
      name: departments.name,
      code: departments.code,
      description: departments.description,
    })
    .from(departments)
    .orderBy(departments.name)
}
