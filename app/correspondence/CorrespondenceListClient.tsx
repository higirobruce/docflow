'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, AlertTriangle, Clock, CalendarClock, CalendarCheck } from 'lucide-react'
import { formatDate, getDaysUntilDue } from '@/src/lib/date-utils'

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

interface CorrespondenceListClientProps {
  initialData: Correspondence[]
}

type DueGroup = 'overdue' | 'this_week' | 'this_month' | 'beyond' | 'completed'

function getDueGroup(item: Correspondence): DueGroup {
  if (item.status === 'completed') return 'completed'
  const days = getDaysUntilDue(item.dueDate)
  if (days < 0) return 'overdue'
  if (days <= 7) return 'this_week'
  if (days <= 30) return 'this_month'
  return 'beyond'
}

function getDueBadge(item: Correspondence) {
  if (item.status === 'completed') return null
  const days = getDaysUntilDue(item.dueDate)
  if (days < 0) {
    return <Badge variant="destructive" className="text-xs">Overdue</Badge>
  }
  if (days === 0) {
    return <Badge variant="destructive" className="text-xs">Due today</Badge>
  }
  if (days <= 3) {
    return <Badge className="bg-orange-500 text-xs">{days}d left</Badge>
  }
  if (days <= 7) {
    return <Badge className="bg-yellow-500 text-white text-xs">{days}d left</Badge>
  }
  return null
}

const GROUP_CONFIG: Record<DueGroup, { label: string; icon: React.ReactNode; color: string }> = {
  overdue: {
    label: 'Overdue',
    icon: <AlertTriangle className="h-4 w-4" />,
    color: 'text-destructive bg-destructive/10',
  },
  this_week: {
    label: 'Due Within 1 Week',
    icon: <Clock className="h-4 w-4" />,
    color: 'text-orange-700 bg-orange-50',
  },
  this_month: {
    label: 'Due Within 1 Month',
    icon: <CalendarClock className="h-4 w-4" />,
    color: 'text-yellow-700 bg-yellow-50',
  },
  beyond: {
    label: 'Due Beyond 1 Month',
    icon: <CalendarCheck className="h-4 w-4" />,
    color: 'text-green-700 bg-green-50',
  },
  completed: {
    label: 'Completed',
    icon: <CalendarCheck className="h-4 w-4" />,
    color: 'text-muted-foreground bg-muted',
  },
}

const GROUP_ORDER: DueGroup[] = ['overdue', 'this_week', 'this_month', 'beyond', 'completed']

export default function CorrespondenceListClient({ initialData }: CorrespondenceListClientProps) {
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    priority: 'all',
    type: 'all',
    dueGroup: 'all',
  })

  const filteredData = useMemo(() => {
    let filtered = [...initialData]

    if (filters.search) {
      const q = filters.search.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.subject.toLowerCase().includes(q) ||
          item.senderName.toLowerCase().includes(q) ||
          item.referenceNumber.toLowerCase().includes(q)
      )
    }
    if (filters.status !== 'all') {
      filtered = filtered.filter((item) => item.status === filters.status)
    }
    if (filters.priority !== 'all') {
      filtered = filtered.filter((item) => item.priority === filters.priority)
    }
    if (filters.type !== 'all') {
      filtered = filtered.filter((item) => item.type === filters.type)
    }
    if (filters.dueGroup !== 'all') {
      filtered = filtered.filter((item) => getDueGroup(item) === filters.dueGroup)
    }
    return filtered
  }, [initialData, filters])

  const groupedData = useMemo(() => {
    const groups: Record<DueGroup, Correspondence[]> = {
      overdue: [],
      this_week: [],
      this_month: [],
      beyond: [],
      completed: [],
    }
    filteredData.forEach((item) => {
      groups[getDueGroup(item)].push(item)
    })
    for (const key of GROUP_ORDER) {
      groups[key].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    }
    return groups
  }, [filteredData])

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

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const hasAnyData = filteredData.length > 0

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and filter correspondence</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-9"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.priority} onValueChange={(value) => handleFilterChange('priority', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="letter">Letter</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="request">Request</SelectItem>
                <SelectItem value="submission">Submission</SelectItem>
                <SelectItem value="complaint">Complaint</SelectItem>
                <SelectItem value="inquiry">Inquiry</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.dueGroup} onValueChange={(value) => handleFilterChange('dueGroup', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Due Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Due Dates</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="this_week">Due This Week</SelectItem>
                <SelectItem value="this_month">Due This Month</SelectItem>
                <SelectItem value="beyond">Beyond 1 Month</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sender</TableHead>
                <TableHead>Due Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!hasAnyData ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <p className="font-medium">No correspondence found</p>
                      <p className="text-sm mt-1">
                        {initialData.length === 0
                          ? 'Get started by creating your first correspondence item'
                          : 'Try adjusting your filters'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                GROUP_ORDER.map((group) => {
                  const items = groupedData[group]
                  if (items.length === 0) return null
                  const config = GROUP_CONFIG[group]
                  return (
                    <React.Fragment key={group}>
                      <GroupRows
                        items={items}
                        label={config.label}
                        icon={config.icon}
                        color={config.color}
                        count={items.length}
                        getPriorityBadge={getPriorityBadge}
                        getStatusBadge={getStatusBadge}
                      />
                    </React.Fragment>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}

function GroupRows({
  items,
  label,
  icon,
  color,
  count,
  getPriorityBadge,
  getStatusBadge,
}: {
  items: Correspondence[]
  label: string
  icon: React.ReactNode
  color: string
  count: number
  getPriorityBadge: (p: string) => React.ReactNode
  getStatusBadge: (s: string) => React.ReactNode
}) {
  return (
    <>
      <TableRow className="hover:bg-transparent">
        <TableCell colSpan={7} className="py-2 px-4">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium ${color}`}>
            {icon}
            {label}
            <span className="text-xs font-normal opacity-75">({count})</span>
          </div>
        </TableCell>
      </TableRow>
      {items.map((item) => (
        <TableRow
          key={item.id}
          className="cursor-pointer hover:bg-muted/50"
          onClick={() => window.location.href = `/correspondence/${item.id}`}
        >
          <TableCell className="font-medium">{item.referenceNumber}</TableCell>
          <TableCell>{item.subject}</TableCell>
          <TableCell className="capitalize">{item.type}</TableCell>
          <TableCell>{getPriorityBadge(item.priority)}</TableCell>
          <TableCell>{getStatusBadge(item.status)}</TableCell>
          <TableCell>{item.senderName}</TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <span>{formatDate(item.dueDate)}</span>
              {getDueBadge(item)}
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}
