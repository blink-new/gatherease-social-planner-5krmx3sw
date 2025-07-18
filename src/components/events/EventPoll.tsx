import { useState } from 'react'
import { Check, X, Clock, Users, Calendar, Star, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Event, SlotWithVotes, Vote } from '@/types'

interface EventPollProps {
  event: Event
  slotsWithVotes: SlotWithVotes[]
  currentUser?: { id: string; email: string; displayName?: string } | null
  onVote: (slotId: string, availability: Vote['availability']) => void
  onConfirmSlot: (slotId: string) => void
  onBack: () => void
}

export function EventPoll({ 
  event, 
  slotsWithVotes, 
  currentUser, 
  onVote, 
  onConfirmSlot,
  onBack 
}: EventPollProps) {
  const [selectedVotes, setSelectedVotes] = useState<Record<string, Vote['availability']>>({})

  const isOrganizer = currentUser?.id === event.organizerId
  const bestSlot = slotsWithVotes.reduce((best, current) => 
    current.yesCount > best.yesCount ? current : best
  , slotsWithVotes[0])

  const getAvailabilityColor = (availability: Vote['availability']) => {
    switch (availability) {
      case 'yes': return 'bg-green-500 hover:bg-green-600'
      case 'maybe': return 'bg-yellow-500 hover:bg-yellow-600'
      case 'no': return 'bg-red-500 hover:bg-red-600'
    }
  }

  const getAvailabilityIcon = (availability: Vote['availability']) => {
    switch (availability) {
      case 'yes': return <Check className="w-4 h-4" />
      case 'maybe': return <Clock className="w-4 h-4" />
      case 'no': return <X className="w-4 h-4" />
    }
  }

  const getUserVote = (slotId: string) => {
    const slot = slotsWithVotes.find(s => s.id === slotId)
    return slot?.votes.find(v => v.userId === currentUser?.id)
  }

  const handleVote = (slotId: string, availability: Vote['availability']) => {
    setSelectedVotes(prev => ({ ...prev, [slotId]: availability }))
    onVote(slotId, availability)
  }

  const formatDateTime = (date: string, startTime: string, endTime: string) => {
    const dateObj = new Date(date)
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' })
    const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    
    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':')
      const hour = parseInt(hours)
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const displayHour = hour % 12 || 12
      return `${displayHour}:${minutes} ${ampm}`
    }

    return {
      dayName,
      dateStr,
      timeRange: `${formatTime(startTime)} - ${formatTime(endTime)}`
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="flex items-center space-x-2">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Events</span>
        </Button>
        
        <Badge className={`${
          event.status === 'confirmed' ? 'bg-green-100 text-green-800' :
          event.status === 'active' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {event.status === 'confirmed' && <Check className="w-4 h-4 mr-1" />}
          <span className="capitalize">{event.status}</span>
        </Badge>
      </div>

      {/* Event Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <Calendar className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
              <p className="text-sm text-gray-500 font-normal">
                Organized by {event.organizerName}
              </p>
            </div>
          </CardTitle>
          {event.description && (
            <p className="text-gray-600 mt-2">{event.description}</p>
          )}
        </CardHeader>
      </Card>

      {/* Time Slots Poll */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Available Time Slots</h2>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Maybe</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Not Available</span>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {slotsWithVotes.map((slot) => {
            const { dayName, dateStr, timeRange } = formatDateTime(slot.date, slot.startTime, slot.endTime)
            const userVote = getUserVote(slot.id)
            const currentVote = selectedVotes[slot.id] || userVote?.availability
            const isBestSlot = bestSlot?.id === slot.id && slot.yesCount > 0
            const isConfirmed = event.confirmedSlotId === slot.id

            return (
              <Card key={slot.id} className={`${
                isBestSlot && !isConfirmed ? 'ring-2 ring-accent border-accent' : ''
              } ${isConfirmed ? 'ring-2 ring-green-500 border-green-500 bg-green-50' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{dateStr.split(' ')[1]}</div>
                        <div className="text-sm text-gray-500">{dateStr.split(' ')[0]}</div>
                        <div className="text-xs text-gray-400">{dayName}</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-gray-900">{timeRange}</div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>{slot.totalVotes} votes</span>
                          </span>
                          {isBestSlot && !isConfirmed && (
                            <Badge className="bg-accent text-white flex items-center space-x-1">
                              <Star className="w-3 h-3" />
                              <span>Best Option</span>
                            </Badge>
                          )}
                          {isConfirmed && (
                            <Badge className="bg-green-500 text-white flex items-center space-x-1">
                              <Check className="w-3 h-3" />
                              <span>Confirmed</span>
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {!isConfirmed && (
                      <div className="flex items-center space-x-2">
                        {(['yes', 'maybe', 'no'] as const).map((availability) => (
                          <Button
                            key={availability}
                            size="sm"
                            variant={currentVote === availability ? 'default' : 'outline'}
                            className={`${
                              currentVote === availability 
                                ? getAvailabilityColor(availability) + ' text-white' 
                                : 'hover:bg-gray-50'
                            }`}
                            onClick={() => handleVote(slot.id, availability)}
                          >
                            {getAvailabilityIcon(availability)}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Vote Summary */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div className="h-full flex">
                          <div 
                            className="bg-green-500" 
                            style={{ width: `${slot.totalVotes > 0 ? (slot.yesCount / slot.totalVotes) * 100 : 0}%` }}
                          />
                          <div 
                            className="bg-yellow-500" 
                            style={{ width: `${slot.totalVotes > 0 ? (slot.maybeCount / slot.totalVotes) * 100 : 0}%` }}
                          />
                          <div 
                            className="bg-red-500" 
                            style={{ width: `${slot.totalVotes > 0 ? (slot.noCount / slot.totalVotes) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 text-sm">
                        <span className="text-green-600 font-medium">{slot.yesCount}</span>
                        <span className="text-yellow-600 font-medium">{slot.maybeCount}</span>
                        <span className="text-red-600 font-medium">{slot.noCount}</span>
                      </div>
                    </div>

                    {/* Participants */}
                    {slot.votes.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {slot.votes.map((vote) => (
                          <div key={vote.id} className="flex items-center space-x-2 bg-gray-50 rounded-full px-3 py-1">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className={`text-xs ${
                                vote.availability === 'yes' ? 'bg-green-100 text-green-700' :
                                vote.availability === 'maybe' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {vote.userName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-gray-700">{vote.userName}</span>
                            <div className={`w-2 h-2 rounded-full ${
                              vote.availability === 'yes' ? 'bg-green-500' :
                              vote.availability === 'maybe' ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`} />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Confirm Button for Organizer */}
                    {isOrganizer && !isConfirmed && slot.yesCount > 0 && (
                      <div className="pt-2 border-t">
                        <Button 
                          onClick={() => onConfirmSlot(slot.id)}
                          className="w-full bg-accent hover:bg-accent/90"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Confirm This Time Slot
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}