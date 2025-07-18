import { Calendar, Plus, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface HeaderProps {
  user?: { email: string; displayName?: string } | null
  onCreateEvent: () => void
}

export function Header({ user, onCreateEvent }: HeaderProps) {
  const initials = user?.displayName 
    ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || 'U'

  return (
    <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-xl">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">GatherEase</h1>
              <p className="text-sm text-gray-500">Social Gathering Planner</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button onClick={onCreateEvent} className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Create Event</span>
            </Button>
            
            <div className="flex items-center space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary text-white text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">
                  {user?.displayName || user?.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}