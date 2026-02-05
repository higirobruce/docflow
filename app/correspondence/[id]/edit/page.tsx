'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { CorrespondenceForm, CorrespondenceData } from '@/components/correspondence-form'

interface FetchedCorrespondenceData {
  id: number
  referenceNumber: string
  subject: string
  description: string
  type: string
  priority: string
  status: string
  senderName: string
  senderEmail?: string | null
  senderPhone?: string | null
  senderOrganization?: string | null
  senderAddress?: string | null
  receivedDate: string
  dueDate: string
  notes?: string | null
  assignedToId?: number | null
  divisionId?: number | null
  assignedTo?: { id: number | null } | null
  division?: { id: number | null } | null
}

async function fetchCorrespondence(id: string): Promise<FetchedCorrespondenceData> {
  const response = await fetch(`/api/correspondence/${id}`)
  if (!response.ok) {
    throw new Error('Failed to fetch correspondence')
  }
  return response.json()
}

async function updateCorrespondence({ id, data }: { id: string; data: Partial<CorrespondenceData> }) {
  const response = await fetch(`/api/correspondence/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    if (response.status === 401) {
      throw new Error('You must be logged in to update correspondence')
    }
    if (response.status === 403) {
      throw new Error('You do not have permission to update correspondence')
    }
    throw new Error(body?.error || 'Failed to update correspondence')
  }

  return response.json()
}

export default function EditCorrespondencePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: correspondence, isLoading: isLoadingCorrespondence } = useQuery({
    queryKey: ['correspondence', id],
    queryFn: () => fetchCorrespondence(id),
  })

  const updateMutation = useMutation({
    mutationFn: updateCorrespondence,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['correspondence'] })
      queryClient.invalidateQueries({ queryKey: ['correspondence', id] })
      router.push(`/correspondence/${id}`)
      router.refresh()
    },
  })

  const handleSubmit = (data: CorrespondenceData) => {
    updateMutation.mutate({ id, data })
  }

  if (isLoadingCorrespondence) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const initialData: Partial<CorrespondenceData> | undefined = correspondence ? {
    referenceNumber: correspondence.referenceNumber,
    subject: correspondence.subject,
    description: correspondence.description,
    type: correspondence.type,
    priority: correspondence.priority,
    status: correspondence.status,
    senderName: correspondence.senderName,
    senderEmail: correspondence.senderEmail || '',
    senderPhone: correspondence.senderPhone || '',
    senderOrganization: correspondence.senderOrganization || '',
    senderAddress: correspondence.senderAddress || '',
    receivedDate: correspondence.receivedDate,
    dueDate: correspondence.dueDate,
    notes: correspondence.notes || '',
    assignedToId: correspondence.assignedToId || correspondence.assignedTo?.id || null,
    divisionId: correspondence.divisionId || correspondence.division?.id || null,
  } : undefined

  return (
    <div className="min-h-screen bg-background">
      <CorrespondenceForm
        initialData={initialData}
        onSubmit={handleSubmit}
        isLoading={updateMutation.isPending}
        error={updateMutation.error}
        title="Edit Correspondence"
        description="Update existing correspondence details"
        submitLabel="Save Changes"
        backLink={`/correspondence/${id}`}
      />
    </div>
  )
}
