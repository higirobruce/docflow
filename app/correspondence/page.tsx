'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import CorrespondenceListClient from './CorrespondenceListClient'

interface Correspondence {
  id: number
  referenceNumber: string
  subject: string
  description: string
  type: string
  priority: string
  status: string
  senderName: string
  senderEmail: string | null
  senderPhone: string | null
  senderOrganization: string | null
  receivedDate: Date
  dueDate: Date
  completedDate: Date | null
  assignedTo: {
    id: number | null
    name: string | null
    email: string | null
  } | null
  department: {
    id: number | null
    name: string | null
    code: string | null
  } | null
  createdAt: Date
  updatedAt: Date
}

async function fetchCorrespondence(): Promise<Correspondence[]> {
  const response = await fetch('/api/correspondence')
  if (!response.ok) {
    throw new Error('Failed to fetch correspondence')
  }
  return response.json()
}

export default function CorrespondencePage() {
  const { data: correspondence, isLoading } = useQuery({
    queryKey: ['correspondence'],
    queryFn: fetchCorrespondence,
  })

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Correspondence</h1>
            <p className="text-muted-foreground mt-2">
              Manage all correspondence items
            </p>
          </div>
          <Link href="/correspondence/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Correspondence
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading correspondence...</p>
          </div>
        ) : (
          <CorrespondenceListClient initialData={correspondence || []} />
        )}
      </div>
    </div>
  )
}
