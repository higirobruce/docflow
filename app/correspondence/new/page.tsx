'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { generateReferenceNumber } from '@/src/lib/date-utils'

interface User {
  id: number
  name: string
  email: string
  role: string
}

interface Department {
  id: number
  name: string
  code: string
}

interface CreateCorrespondenceData {
  referenceNumber: string
  subject: string
  description: string
  type: string
  priority: string
  status: string
  senderName: string
  senderEmail?: string
  senderPhone?: string
  senderOrganization?: string
  senderAddress?: string
  receivedDate: string
  dueDate: string
  notes?: string
  assignedToId?: number | null
  departmentId?: number | null
}

async function fetchUsers(): Promise<User[]> {
  const response = await fetch('/api/users')
  if (!response.ok) {
    throw new Error('Failed to fetch users')
  }
  return response.json()
}

async function fetchDepartments(): Promise<Department[]> {
  const response = await fetch('/api/departments')
  if (!response.ok) {
    throw new Error('Failed to fetch departments')
  }
  return response.json()
}

async function createCorrespondence(data: CreateCorrespondenceData) {
  const response = await fetch('/api/correspondence', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    if (response.status === 401) {
      throw new Error('You must be logged in to create correspondence')
    }
    if (response.status === 403) {
      throw new Error('You do not have permission to create correspondence')
    }
    throw new Error(body?.error || 'Failed to create correspondence')
  }

  return response.json()
}

export default function NewCorrespondencePage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  })

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: fetchDepartments,
  })

  const mutation = useMutation({
    mutationFn: createCorrespondence,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['correspondence'] })
      router.push('/correspondence')
    },
  })

  const [formData, setFormData] = useState({
    referenceNumber: generateReferenceNumber(),
    subject: '',
    description: '',
    type: 'letter',
    priority: 'normal',
    status: 'pending',
    senderName: '',
    senderEmail: '',
    senderPhone: '',
    senderOrganization: '',
    senderAddress: '',
    receivedDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
    assignedToId: '',
    departmentId: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const data: CreateCorrespondenceData = {
      referenceNumber: formData.referenceNumber,
      subject: formData.subject,
      description: formData.description,
      type: formData.type,
      priority: formData.priority,
      status: formData.status,
      senderName: formData.senderName,
      senderEmail: formData.senderEmail || undefined,
      senderPhone: formData.senderPhone || undefined,
      senderOrganization: formData.senderOrganization || undefined,
      senderAddress: formData.senderAddress || undefined,
      receivedDate: formData.receivedDate,
      dueDate: formData.dueDate,
      notes: formData.notes || undefined,
      assignedToId: formData.assignedToId && formData.assignedToId !== 'none' ? Number(formData.assignedToId) : null,
      departmentId: formData.departmentId && formData.departmentId !== 'none' ? Number(formData.departmentId) : null,
    }

    mutation.mutate(data)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/correspondence">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to List
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>New Correspondence</CardTitle>
            <CardDescription>
              Create a new correspondence item to track
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="referenceNumber">Reference Number</Label>
                  <Input
                    id="referenceNumber"
                    value={formData.referenceNumber}
                    onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                    required
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="letter">Letter</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="request">Request</SelectItem>
                      <SelectItem value="submission">Submission</SelectItem>
                      <SelectItem value="complaint">Complaint</SelectItem>
                      <SelectItem value="inquiry">Inquiry</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                  placeholder="Brief subject of the correspondence"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  placeholder="Detailed description of the correspondence"
                  rows={4}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Sender Information</h3>

                <div className="space-y-2">
                  <Label htmlFor="senderName">Sender Name</Label>
                  <Input
                    id="senderName"
                    value={formData.senderName}
                    onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                    required
                    placeholder="Full name of the sender"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="senderEmail">Email (Optional)</Label>
                    <Input
                      id="senderEmail"
                      type="email"
                      value={formData.senderEmail}
                      onChange={(e) => setFormData({ ...formData, senderEmail: e.target.value })}
                      placeholder="email@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="senderPhone">Phone (Optional)</Label>
                    <Input
                      id="senderPhone"
                      type="tel"
                      value={formData.senderPhone}
                      onChange={(e) => setFormData({ ...formData, senderPhone: e.target.value })}
                      placeholder="+1234567890"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senderOrganization">Organization (Optional)</Label>
                  <Input
                    id="senderOrganization"
                    value={formData.senderOrganization}
                    onChange={(e) => setFormData({ ...formData, senderOrganization: e.target.value })}
                    placeholder="Organization name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senderAddress">Address (Optional)</Label>
                  <Textarea
                    id="senderAddress"
                    value={formData.senderAddress}
                    onChange={(e) => setFormData({ ...formData, senderAddress: e.target.value })}
                    placeholder="Full mailing address"
                    rows={3}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Dates & Assignment</h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="receivedDate">Received Date</Label>
                    <Input
                      id="receivedDate"
                      type="date"
                      value={formData.receivedDate}
                      onChange={(e) => setFormData({ ...formData, receivedDate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="assignedToId">Assign To (Optional)</Label>
                    <Select value={formData.assignedToId} onValueChange={(value) => setFormData({ ...formData, assignedToId: value })}>
                      <SelectTrigger id="assignedToId">
                        <SelectValue placeholder="Select a user" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {users?.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="departmentId">Department (Optional)</Label>
                    <Select value={formData.departmentId} onValueChange={(value) => setFormData({ ...formData, departmentId: value })}>
                      <SelectTrigger id="departmentId">
                        <SelectValue placeholder="Select a department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {departments?.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id.toString()}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes or comments"
                  rows={4}
                />
              </div>

              {mutation.isError && (
                <div className="p-4 rounded-lg bg-destructive/10 text-destructive">
                  <p className="font-medium">Error creating correspondence</p>
                  <p className="text-sm">
                    {mutation.error instanceof Error ? mutation.error.message : 'An unexpected error occurred'}
                  </p>
                </div>
              )}

              <div className="flex gap-4 justify-end">
                <Link href="/correspondence">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Create Correspondence
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
