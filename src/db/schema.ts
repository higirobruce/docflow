import { pgTable, text, timestamp, serial, integer, boolean, pgEnum } from 'drizzle-orm/pg-core'

export const priorityEnum = pgEnum('priority', ['low', 'normal', 'high', 'urgent'])
export const statusEnum = pgEnum('status', ['pending', 'in_progress', 'completed', 'overdue'])
export const correspondenceTypeEnum = pgEnum('correspondence_type', ['letter', 'email', 'request', 'submission', 'complaint', 'inquiry', 'other'])

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  role: text('role').notNull().default('staff'),
  department: text('department'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const departments = pgTable('departments', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  code: text('code').notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const correspondence = pgTable('correspondence', {
  id: serial('id').primaryKey(),
  referenceNumber: text('reference_number').notNull().unique(),
  subject: text('subject').notNull(),
  description: text('description').notNull(),
  type: correspondenceTypeEnum('type').notNull(),
  priority: priorityEnum('priority').notNull().default('normal'),
  status: statusEnum('status').notNull().default('pending'),
  senderName: text('sender_name').notNull(),
  senderEmail: text('sender_email'),
  senderPhone: text('sender_phone'),
  senderOrganization: text('sender_organization'),
  senderAddress: text('sender_address'),
  assignedToId: integer('assigned_to_id').references(() => users.id),
  departmentId: integer('department_id').references(() => departments.id),
  receivedDate: timestamp('received_date').notNull().defaultNow(),
  dueDate: timestamp('due_date').notNull(),
  completedDate: timestamp('completed_date'),
  attachments: text('attachments'),
  notes: text('notes'),
  createdById: integer('created_by_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const activityLog = pgTable('activity_log', {
  id: serial('id').primaryKey(),
  correspondenceId: integer('correspondence_id').references(() => correspondence.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  action: text('action').notNull(),
  description: text('description').notNull(),
  previousValue: text('previous_value'),
  newValue: text('new_value'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  correspondenceId: integer('correspondence_id').references(() => correspondence.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  content: text('content').notNull(),
  isInternal: boolean('is_internal').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const emailNotifications = pgTable('email_notifications', {
  id: serial('id').primaryKey(),
  correspondenceId: integer('correspondence_id').references(() => correspondence.id).notNull(),
  recipientId: integer('recipient_id').references(() => users.id).notNull(),
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  sentAt: timestamp('sent_at'),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const slaRules = pgTable('sla_rules', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  correspondenceType: correspondenceTypeEnum('correspondence_type'),
  priority: priorityEnum('priority'),
  departmentId: integer('department_id').references(() => departments.id),
  responseDays: integer('response_days').notNull(),
  resolutionDays: integer('resolution_days').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})