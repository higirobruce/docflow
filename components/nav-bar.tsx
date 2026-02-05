'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Home, FileText, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function NavBar() {
  const { data: session } = useSession()

  if (!session) return null

  return (
    <nav className="border-b bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-primary">RISA DocFlow</h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/"
                className="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium hover:border-primary hover:text-foreground border-transparent text-muted-foreground transition-colors"
              >
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Link>
              <Link
                href="/correspondence"
                className="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium hover:border-primary hover:text-foreground border-transparent text-muted-foreground transition-colors"
              >
                <FileText className="w-4 h-4 mr-2" />
                Correspondence
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{session.user.name}</span>
              <Badge variant="outline" className="capitalize">{session.user.role}</Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
