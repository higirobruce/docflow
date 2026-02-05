'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  Building,
  Send,
  Loader2,
  Edit,
} from 'lucide-react'
import { formatDate } from '@/src/lib/date-utils'
import { ParamValue } from 'next/dist/server/request/params'

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
  senderAddress: string | null
  receivedDate: Date
  dueDate: Date
  completedDate: Date | null
  notes: string | null
  assignedTo: {
    id: number | null
    name: string | null
    email: string | null
  } | null
  division: {
    id: number | null
    name: string | null
    code: string | null
  } | null
  createdAt: Date
  updatedAt: Date
}

interface Comment {
  id: number
  content: string
  isInternal: boolean
  createdAt: string
  user: { id: number | null; name: string | null; email: string | null }
}

interface Activity {
  id: number
  action: string
  description: string
  previousValue: string | null
  newValue: string | null
  createdAt: string
  user: { id: number | null; name: string | null }
}

async function fetchCorrespondenceById(paramsId: ParamValue): Promise<Correspondence> {
  const response = await fetch(`/api/correspondence/${paramsId}`)
  if (!response.ok) {
    if (response.status === 404) throw new Error('Correspondence not found')
    throw new Error('Failed to fetch correspondence')
  }
  return response.json()
}

async function fetchComments(id: ParamValue): Promise<Comment[]> {
  const response = await fetch(`/api/correspondence/${id}/comments`)
  if (!response.ok) throw new Error('Failed to fetch comments')
  return response.json()
}

async function fetchActivity(id: ParamValue): Promise<Activity[]> {
  const response = await fetch(`/api/correspondence/${id}/activity`)
  if (!response.ok) throw new Error('Failed to fetch activity')
  return response.json()
}

export default function CorrespondenceDetailPage() {
  const { id: paramsId } = useParams()
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [newComment, setNewComment] = useState('')

  const canEdit = session?.user?.role === 'admin' || session?.user?.role === 'manager'

  const { data: correspondence, isLoading, error } = useQuery({
    queryKey: ['correspondence', paramsId],
    queryFn: () => fetchCorrespondenceById(paramsId),
    enabled: !!paramsId,
  })

  const { data: commentsList } = useQuery({
    queryKey: ['comments', paramsId],
    queryFn: () => fetchComments(paramsId),
    enabled: !!paramsId,
  })

  const { data: activityList } = useQuery({
    queryKey: ['activity', paramsId],
    queryFn: () => fetchActivity(paramsId),
    enabled: !!paramsId,
  })

  const statusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const response = await fetch(`/api/correspondence/${paramsId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.error || 'Failed to update status')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['correspondence', paramsId] })
      queryClient.invalidateQueries({ queryKey: ['activity', paramsId] })
      queryClient.invalidateQueries({ queryKey: ['correspondence'] })
    },
  })

  const priorityMutation = useMutation({
    mutationFn: async (newPriority: string) => {
      const response = await fetch(`/api/correspondence/${paramsId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: newPriority }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.error || 'Failed to update priority')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['correspondence', paramsId] })
      queryClient.invalidateQueries({ queryKey: ['activity', paramsId] })
      queryClient.invalidateQueries({ queryKey: ['correspondence'] })
    },
  })

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/correspondence/${paramsId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, isInternal: true }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.error || 'Failed to add comment')
      }
      return response.json()
    },
    onSuccess: () => {
      setNewComment('')
      queryClient.invalidateQueries({ queryKey: ['comments', paramsId] })
    },
  })

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return
    commentMutation.mutate(newComment)
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent': return <Badge variant="destructive">Urgent</Badge>
      case 'high': return <Badge className="bg-orange-500">High</Badge>
      case 'normal': return <Badge variant="secondary">Normal</Badge>
      case 'low': return <Badge variant="outline">Low</Badge>
      default: return <Badge>{priority}</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="bg-yellow-50">Pending</Badge>
      case 'in_progress': return <Badge variant="outline" className="bg-blue-50">In Progress</Badge>
      case 'completed': return <Badge variant="outline" className="bg-green-50">Completed</Badge>
      case 'overdue': return <Badge variant="destructive">Overdue</Badge>
      default: return <Badge>{status}</Badge>
    }
  }

  const formatCommentDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Link href="/correspondence">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to List
              </Button>
            </Link>
          </div>
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading correspondence details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !correspondence) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Link href="/correspondence">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to List
              </Button>
            </Link>
          </div>
          <div className="text-center py-12">
            <p className="text-destructive">
              {error instanceof Error ? error.message : 'Correspondence not found'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/correspondence">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to List
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-2xl">
                        Correspondence Details
                      </CardTitle>
                      <Badge>{correspondence.referenceNumber}</Badge>
                      {getStatusBadge(correspondence.status)}
                      {getPriorityBadge(correspondence.priority)}
                    </div>
                    <CardDescription>
                      View and manage correspondence information
                    </CardDescription>
                  </div>
                  {canEdit && (
                    <Link href={`/correspondence/${paramsId}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </Link>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Subject</h3>
                    <p>{correspondence.subject}</p>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Description</h3>
                    <p className="whitespace-pre-wrap">{correspondence.description}</p>
                  </div>
                  {correspondence.notes && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Notes</h3>
                        <p className="whitespace-pre-wrap text-muted-foreground">{correspondence.notes}</p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="comments" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="comments">
                  Comments {commentsList?.length ? `(${commentsList.length})` : ''}
                </TabsTrigger>
                <TabsTrigger value="activity">
                  Activity {activityList?.length ? `(${activityList.length})` : ''}
                </TabsTrigger>
                <TabsTrigger value="attachments">Attachments</TabsTrigger>
              </TabsList>

              <TabsContent value="comments" className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <form onSubmit={handleCommentSubmit} className="mb-6">
                      <Textarea
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows={3}
                        disabled={commentMutation.isPending}
                      />
                      <div className="flex justify-end mt-2">
                        <Button
                          type="submit"
                          size="sm"
                          disabled={!newComment.trim() || commentMutation.isPending}
                        >
                          {commentMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4 mr-2" />
                          )}
                          Comment
                        </Button>
                      </div>
                      {commentMutation.isError && (
                        <p className="text-sm text-destructive mt-2">
                          {commentMutation.error instanceof Error
                            ? commentMutation.error.message
                            : 'Failed to add comment'}
                        </p>
                      )}
                    </form>

                    {!commentsList?.length ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <Mail className="h-10 w-10 mx-auto mb-3 opacity-50" />
                        <p>No comments yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {commentsList.map((comment) => (
                          <div key={comment.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                                  <User className="h-4 w-4 text-primary" />
                                </div>
                                <span className="text-sm font-medium">
                                  {comment.user?.name || 'Unknown'}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {formatCommentDate(comment.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity" className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    {!activityList?.length ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <Clock className="h-10 w-10 mx-auto mb-3 opacity-50" />
                        <p>No activity recorded yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {activityList.map((activity) => (
                          <div key={activity.id} className="flex gap-3 border-b pb-3 last:border-0">
                            <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm">{activity.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-muted-foreground">
                                  {activity.user?.name || 'System'}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatCommentDate(activity.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="attachments" className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-6 text-muted-foreground">
                      <Building className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p>No attachments</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Status & Priority</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Status</p>
                  {canEdit ? (
                    <Select
                      value={correspondence.status}
                      onValueChange={(value) => statusMutation.mutate(value)}
                      disabled={statusMutation.isPending}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    getStatusBadge(correspondence.status)
                  )}
                  {statusMutation.isError && (
                    <p className="text-xs text-destructive mt-1">
                      {statusMutation.error instanceof Error
                        ? statusMutation.error.message
                        : 'Failed to update'}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Priority</p>
                  {canEdit ? (
                    <Select
                      value={correspondence.priority}
                      onValueChange={(value) => priorityMutation.mutate(value)}
                      disabled={priorityMutation.isPending}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    getPriorityBadge(correspondence.priority)
                  )}
                  {priorityMutation.isError && (
                    <p className="text-xs text-destructive mt-1">
                      {priorityMutation.error instanceof Error
                        ? priorityMutation.error.message
                        : 'Failed to update'}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Type</p>
                  <Badge variant="outline" className="capitalize">{correspondence.type}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sender Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{correspondence.senderName}</p>
                  </div>
                </div>
                {correspondence.senderEmail && (
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{correspondence.senderEmail}</p>
                    </div>
                  </div>
                )}
                {correspondence.senderPhone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{correspondence.senderPhone}</p>
                    </div>
                  </div>
                )}
                {correspondence.senderOrganization && (
                  <div className="flex items-start gap-3">
                    <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Organization</p>
                      <p className="font-medium">{correspondence.senderOrganization}</p>
                    </div>
                  </div>
                )}
                {correspondence.senderAddress && (
                  <div className="flex items-start gap-3">
                    <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium whitespace-pre-wrap">{correspondence.senderAddress}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dates & Assignment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Received</p>
                    <p className="font-medium">{formatDate(correspondence.receivedDate)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Due Date</p>
                    <p className="font-medium">{formatDate(correspondence.dueDate)}</p>
                  </div>
                </div>
                {correspondence.completedDate && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Completed</p>
                      <p className="font-medium">{formatDate(correspondence.completedDate)}</p>
                    </div>
                  </div>
                )}
                {correspondence.assignedTo && (
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Assigned To</p>
                      <p className="font-medium">{correspondence.assignedTo.name}</p>
                      <p className="text-xs text-muted-foreground">{correspondence.assignedTo.email}</p>
                    </div>
                  </div>
                )}
                {correspondence.division && (
                  <div className="flex items-start gap-3">
                    <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Division</p>
                      <p className="font-medium">{correspondence.division.name}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
