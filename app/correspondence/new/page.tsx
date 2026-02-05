'use client'

import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CorrespondenceForm, CorrespondenceData } from '@/components/correspondence-form'

async function createCorrespondence(data: CorrespondenceData) {
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

  const mutation = useMutation({
    mutationFn: createCorrespondence,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['correspondence'] })
      router.push('/correspondence')
    },
  })

  const handleSubmit = (data: CorrespondenceData) => {
    mutation.mutate(data)
  }

  return (
    <div className="min-h-screen bg-background">
      <CorrespondenceForm
        onSubmit={handleSubmit}
        isLoading={mutation.isPending}
        error={mutation.error}
        title="New Correspondence"
        description="Create a new correspondence item to track"
        submitLabel="Create Correspondence"
      />
    </div>
  )
}
