'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { formatRelativeTime } from '@/src/lib/date-utils'

interface CorrespondenceStats {
  total: number
  pending: number
  inProgress: number
  completed: number
  overdue: number
  urgent: number
  high: number
  normal: number
  low: number
}

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

async function fetchCorrespondenceStats(): Promise<CorrespondenceStats> {
  const response = await fetch('/api/correspondence/stats')
  if (!response.ok) {
    throw new Error('Failed to fetch correspondence statistics')
  }
  return response.json()
}

async function fetchCorrespondence(): Promise<Correspondence[]> {
  const response = await fetch('/api/correspondence')
  if (!response.ok) {
    throw new Error('Failed to fetch correspondence')
  }
  return response.json()
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['correspondence', 'stats'],
    queryFn: fetchCorrespondenceStats,
  })

  const { data: allCorrespondence, isLoading: correspondenceLoading } = useQuery({
    queryKey: ['correspondence'],
    queryFn: fetchCorrespondence,
  })

  const recentCorrespondence = allCorrespondence?.slice(0, 5) || []

  const statCards = [
    {
      title: 'Total Correspondence',
      value: stats?.total.toString() || '0',
      description: 'All tracked items',
      icon: <FileText className="h-4 w-4 text-muted-foreground" />,
      color: 'text-blue-600',
    },
    {
      title: 'Pending',
      value: stats?.pending.toString() || '0',
      description: 'Awaiting action',
      icon: <Clock className="h-4 w-4 text-muted-foreground" />,
      color: 'text-yellow-600',
    },
    {
      title: 'In Progress',
      value: stats?.inProgress.toString() || '0',
      description: 'Currently being handled',
      icon: <AlertCircle className="h-4 w-4 text-muted-foreground" />,
      color: 'text-orange-600',
    },
    {
      title: 'Completed',
      value: stats?.completed.toString() || '0',
      description: 'Successfully resolved',
      icon: <CheckCircle className="h-4 w-4 text-muted-foreground" />,
      color: 'text-green-600',
    },
  ]

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">Urgent</Badge>
      case 'high':
        return <Badge className="bg-orange-500">High</Badge>
      case 'normal':
        return <Badge variant="secondary">Normal</Badge>
      case 'low':
        return <Badge variant="outline">Low</Badge>
      default:
        return <Badge>{priority}</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50">Pending</Badge>
      case 'in_progress':
        return <Badge variant="outline" className="bg-blue-50">In Progress</Badge>
      case 'completed':
        return <Badge variant="outline" className="bg-green-50">Completed</Badge>
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (statsLoading || correspondenceLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Welcome to RISA Correspondence Tracker
            </p>
          </div>
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome to RISA Correspondence Tracker
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {statCards.map((stat, index) => (
            <Card key={index} className="py-3 gap-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 pb-0">
                <CardTitle className="text-xs font-medium">
                  {stat.title}
                </CardTitle>
                {stat.icon}
              </CardHeader>
              <CardContent className="px-4">
                <div className={`text-xl font-bold ${stat.color}`}>
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-5">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest correspondence updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentCorrespondence.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No correspondence yet</p>
                  <p className="text-sm mt-2">
                    Start by creating your first correspondence item
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentCorrespondence.map((item) => (
                    <Link
                      key={item.id}
                      href={`/correspondence/${item.id}`}
                      className="block p-4 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{item.referenceNumber}</p>
                            {getStatusBadge(item.status)}
                            {getPriorityBadge(item.priority)}
                          </div>
                          <p className="text-sm font-semibold">{item.subject}</p>
                          <p className="text-xs text-muted-foreground">
                            From: {item.senderName}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                          Due {formatRelativeTime(item.dueDate)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Priority Overview</CardTitle>
              <CardDescription>
                Items by priority level
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">Urgent</Badge>
                  </div>
                  <span className="text-lg font-bold">{stats?.urgent || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-orange-500">High</Badge>
                  </div>
                  <span className="text-lg font-bold">{stats?.high || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Normal</Badge>
                  </div>
                  <span className="text-lg font-bold">{stats?.normal || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Low</Badge>
                  </div>
                  <span className="text-lg font-bold">{stats?.low || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* <Card className="mt-4">
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Setup your correspondence tracking system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  1
                </div>
                <div>
                  <h3 className="font-semibold">Configure Database</h3>
                  <p className="text-sm text-muted-foreground">
                    Set up your PostgreSQL database and run migrations
                  </p>
                  <code className="text-xs bg-muted px-2 py-1 rounded mt-2 inline-block">
                    npm run db:push
                  </code>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  2
                </div>
                <div>
                  <h3 className="font-semibold">Seed Sample Data</h3>
                  <p className="text-sm text-muted-foreground">
                    Load sample data to explore the system
                  </p>
                  <code className="text-xs bg-muted px-2 py-1 rounded mt-2 inline-block">
                    npm run db:seed
                  </code>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  3
                </div>
                <div>
                  <h3 className="font-semibold">Start Tracking</h3>
                  <p className="text-sm text-muted-foreground">
                    Navigate to Correspondence to create and manage items
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card> */}
      </div>
    </div>
  )
}
