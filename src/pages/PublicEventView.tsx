import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Calendar, Users, Clock, Check, X, Star, Share2, Copy } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DatabaseService } from '@/services/database'
import { Event, SlotWithVotes, Vote } from '@/types'
import { toast } from 'react-hot-toast'

export function PublicEventView() {
  const { eventId } = useParams<{ eventId: string }>()
  const [event, setEvent] = useState<Event | null>(null)
  const [slotsWithVotes, setSlotsWithVotes] = useState<SlotWithVotes[]>([])
  const [loading, setLoading] = useState(true)
  const [voterName, setVoterName] = useState('')
  const [voterEmail, setVoterEmail] = useState('')
  const [showVoterDialog, setShowVoterDialog] = useState(false)
  const [pendingVote, setPendingVote] = useState<{ slotId: string; availability: Vote['availability'] } | null>(null)
  const [currentVoter, setCurrentVoter] = useState<{ id: string; name: string; email: string } | null>(null)

  const loadEventData = useCallback(async () => {
    if (!eventId) {
      setLoading(false)
      return
    }

    try {
      // Use regular database service for testing
      const { event: eventData, slots } = await DatabaseService.getEventWithSlotsAndVotes(eventId)
      
      if (eventData) {
        setEvent(eventData)
        setSlotsWithVotes(slots)
      }
      setLoading(false)
    } catch (error) {
      console.error('Error loading event:', error)
      setLoading(false)
    }

    // Check if voter info is stored in localStorage
    const storedVoter = localStorage.getItem(`voter_${eventId}`)
    if (storedVoter) {
      setCurrentVoter(JSON.parse(storedVoter))
    }
  }, [eventId])

  useEffect(() => {
    loadEventData()
  }, [loadEventData])



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
    if (!currentVoter) return null
    const slot = slotsWithVotes.find(s => s.id === slotId)
    return slot?.votes.find(v => v.userId === currentVoter.id)
  }

  const handleVoteClick = (slotId: string, availability: Vote['availability']) => {
    if (!currentVoter) {
      setPendingVote({ slotId, availability })
      setShowVoterDialog(true)
      return
    }
    handleVote(slotId, availability)
  }

  const handleVoterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!voterName.trim() || !voterEmail.trim()) return

    const voter = {
      id: `voter_${Date.now()}`,
      name: voterName.trim(),
      email: voterEmail.trim()
    }

    setCurrentVoter(voter)
    localStorage.setItem(`voter_${eventId}`, JSON.stringify(voter))
    setShowVoterDialog(false)

    if (pendingVote) {
      handleVote(pendingVote.slotId, pendingVote.availability)
      setPendingVote(null)
    }

    toast.success(`Welcome, ${voter.name}! You can now vote on time slots.`)
  }

  const handleVote = async (slotId: string, availability: Vote['availability']) => {
    if (!currentVoter || !event) return

    try {
      // Save vote to database using regular method for testing
      await DatabaseService.createVote({
        eventId: event.id,
        slotId,
        userId: currentVoter.id,
        userName: currentVoter.name,
        availability
      })

      // Refresh event data to get updated vote counts
      const { slots } = await DatabaseService.getEventWithSlotsAndVotes(event.id)
      setSlotsWithVotes(slots)
      
      toast.success(`Vote recorded: ${availability}`)
    } catch (error) {
      console.error('Error voting:', error)
      toast.error('Failed to record vote')
    }
  }

  const handleShareEvent = () => {
    const shareUrl = window.location.href
    navigator.clipboard.writeText(shareUrl)
    toast.success('Event link copied to clipboard!')
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-600">Loading event...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto" />
          <h1 className="text-2xl font-bold text-gray-900">Event Not Found</h1>
          <p className="text-gray-600">The event you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Calendar className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">GatherEase</h1>
                <p className="text-sm text-gray-500">Social Gathering Planner</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareEvent}
              className="flex items-center space-x-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Event</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Event Info */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle className="flex items-center space-x-3">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
                  <p className="text-sm text-gray-500 font-normal">
                    Organized by {event.organizerName}
                  </p>
                </div>
              </CardTitle>
              <Badge className={`${
                event.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                event.status === 'active' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {event.status === 'confirmed' && <Check className="w-4 h-4 mr-1" />}
                <span className="capitalize">{event.status}</span>
              </Badge>
            </div>
            {event.description && (
              <p className="text-gray-600 mt-2">{event.description}</p>
            )}
          </CardHeader>
        </Card>

        {/* Voter Info */}
        {currentVoter && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-blue-100 text-blue-700">
                    {currentVoter.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-blue-900">Voting as {currentVoter.name}</p>
                  <p className="text-sm text-blue-600">{currentVoter.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        {!currentVoter && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Users className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-900">Ready to vote?</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Click on any time slot below to vote on your availability. You'll be asked to provide your name and email first.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
                              variant={userVote?.availability === availability ? 'default' : 'outline'}
                              className={`${
                                userVote?.availability === availability 
                                  ? getAvailabilityColor(availability) + ' text-white' 
                                  : 'hover:bg-gray-50'
                              }`}
                              onClick={() => handleVoteClick(slot.id, availability)}
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
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <Card className="bg-gray-50">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-gray-600">
              Powered by <span className="font-semibold text-primary">GatherEase</span> - 
              Making event planning simple and collaborative
            </p>
          </CardContent>
        </Card>
      </main>

      {/* Voter Information Dialog */}
      <Dialog open={showVoterDialog} onOpenChange={setShowVoterDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-primary" />
              <span>Join the Poll</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleVoterSubmit} className="space-y-4">
            <div>
              <Label htmlFor="voterName">Your Name *</Label>
              <Input
                id="voterName"
                value={voterName}
                onChange={(e) => setVoterName(e.target.value)}
                placeholder="Enter your full name"
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="voterEmail">Your Email *</Label>
              <Input
                id="voterEmail"
                type="email"
                value={voterEmail}
                onChange={(e) => setVoterEmail(e.target.value)}
                placeholder="Enter your email address"
                className="mt-1"
                required
              />
            </div>

            <p className="text-sm text-gray-600">
              Your information will be used to identify your votes and may be visible to other participants.
            </p>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowVoterDialog(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!voterName.trim() || !voterEmail.trim()}
              >
                Join Poll
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}