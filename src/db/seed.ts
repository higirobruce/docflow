import { db } from './index'
import { users, departments, correspondence, slaRules } from './schema'
import { addDays } from 'date-fns'
import bcrypt from 'bcryptjs'

async function seed() {
  console.log('Seeding database...')

  const defaultPassword = await bcrypt.hash('password123', 10)

  const [adminDept, hrDept, itDept, financeDept] = await db
    .insert(departments)
    .values([
      { name: 'Administration', code: 'ADMIN', description: 'Administrative Department' },
      { name: 'Human Resources', code: 'HR', description: 'Human Resources Department' },
      { name: 'Information Technology', code: 'IT', description: 'IT Department' },
      { name: 'Finance', code: 'FIN', description: 'Finance Department' },
    ])
    .returning()

  console.log('Departments seeded')

  const [admin, manager1, staff1, staff2, staff3] = await db
    .insert(users)
    .values([
      { name: 'Admin User', email: 'admin@example.com', passwordHash: defaultPassword, role: 'admin', department: 'Administration' },
      { name: 'John Manager', email: 'john.manager@example.com', passwordHash: defaultPassword, role: 'manager', department: 'Administration' },
      { name: 'Sarah Staff', email: 'sarah.staff@example.com', passwordHash: defaultPassword, role: 'staff', department: 'Human Resources' },
      { name: 'Mike Staff', email: 'mike.staff@example.com', passwordHash: defaultPassword, role: 'staff', department: 'Information Technology' },
      { name: 'Emily Staff', email: 'emily.staff@example.com', passwordHash: defaultPassword, role: 'staff', department: 'Finance' },
    ])
    .returning()

  console.log('Users seeded')

  await db
    .insert(slaRules)
    .values([
      { name: 'Urgent Letters', correspondenceType: 'letter', priority: 'urgent', responseDays: 1, resolutionDays: 3 },
      { name: 'High Priority Requests', correspondenceType: 'request', priority: 'high', responseDays: 2, resolutionDays: 5 },
      { name: 'Normal Inquiries', correspondenceType: 'inquiry', priority: 'normal', responseDays: 3, resolutionDays: 7 },
      { name: 'Complaints', correspondenceType: 'complaint', priority: 'high', responseDays: 1, resolutionDays: 5 },
    ])

  console.log('SLA Rules seeded')

  const today = new Date()

  await db
    .insert(correspondence)
    .values([
      {
        referenceNumber: 'COR-2025-001',
        subject: 'Request for Information on New Policy',
        description: 'We request information regarding the new organizational policy that was recently announced.',
        type: 'request',
        priority: 'high',
        status: 'in_progress',
        senderName: 'Jane Doe',
        senderEmail: 'jane.doe@external.com',
        senderPhone: '+250788123456',
        senderOrganization: 'External Organization A',
        assignedToId: staff1.id,
        departmentId: hrDept.id,
        receivedDate: addDays(today, -5),
        dueDate: addDays(today, 2),
        createdById: admin.id,
      },
      {
        referenceNumber: 'COR-2025-002',
        subject: 'Complaint About Service Delivery',
        description: 'This letter is to formally complain about the poor service delivery experienced at your office.',
        type: 'complaint',
        priority: 'urgent',
        status: 'pending',
        senderName: 'Robert Smith',
        senderEmail: 'robert.smith@external.com',
        senderPhone: '+250788234567',
        senderOrganization: 'External Organization B',
        assignedToId: manager1.id,
        departmentId: adminDept.id,
        receivedDate: today,
        dueDate: addDays(today, 5),
        createdById: admin.id,
      },
      {
        referenceNumber: 'COR-2025-003',
        subject: 'Inquiry About Employment Opportunities',
        description: 'I am writing to inquire about available employment opportunities in your organization.',
        type: 'inquiry',
        priority: 'normal',
        status: 'pending',
        senderName: 'Alice Johnson',
        senderEmail: 'alice.johnson@external.com',
        assignedToId: staff1.id,
        departmentId: hrDept.id,
        receivedDate: addDays(today, -2),
        dueDate: addDays(today, 5),
        createdById: admin.id,
      },
    ])

  console.log('Sample correspondence seeded')
  console.log('Database seeded successfully!')
  console.log('')
  console.log('Login credentials (all users):')
  console.log('  Password: password123')
  console.log('  Admin:    admin@example.com')
  console.log('  Manager:  john.manager@example.com')
  console.log('  Staff:    sarah.staff@example.com')
  process.exit(0)
}

seed().catch((error) => {
  console.error('Seeding failed!', error)
  process.exit(1)
})
