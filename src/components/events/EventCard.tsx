import { Calendar, Clock, Users, CheckCircle2, Share2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Event } from '@/types'
import { toast } from 'react-hot-toast'

interface EventCardProps {
  event: Event
  onViewEvent: (event: Event) => void
}

export function EventCard({ event, onViewEvent }: EventCardProps) {
  const getStatusColor = (status: Event['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'active': return 'bg-blue-100 text-blue-800'
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: Event['status']) => {
    switch (status) {
      case 'confirmed': return <CheckCircle2 className="w-4 h-4" />
      default: return null
    }
  }

  const handleShareEvent = (e: React.MouseEvent) => {
    e.stopPropagation()
    const shareUrl = `${window.location.origin}/event/${event.id}`
    navigator.clipboard.writeText(shareUrl)
    toast.success('Event link copied to clipboard!')
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group" 
          onClick={() => onViewEvent(event)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors">
            {event.title}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-8 w-8"
              onClick={handleShareEvent}
            >
              <Share2 className="w-4 h-4" />
            </Button>
            <Badge className={`${getStatusColor(event.status)} flex items-center space-x-1`}>
              {getStatusIcon(event.status)}
              <span className="capitalize">{event.status}</span>
            </Badge>
          </div>
        </div>
        {event.description && (
          <p className="text-sm text-gray-600 line-clamp-2">{event.description}</p>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>by {event.organizerName}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>{new Date(event.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          className="w-full group-hover:bg-primary group-hover:text-white transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            onViewEvent(event)
          }}
        >
          <Clock className="w-4 h-4 mr-2" />
          View Availability Poll
        </Button>
      </CardContent>
    </Card>
  )
}