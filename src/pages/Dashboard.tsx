import { useState, useEffect, useCallback } from 'react'
import { Calendar, Users, Clock, Plus } from 'lucide-react'
import { blink } from '@/blink/client'
import { Header } from '@/components/layout/Header'
import { EventCard } from '@/components/events/EventCard'
import { CreateEventDialog } from '@/components/events/CreateEventDialog'
import { EventPoll } from '@/components/events/EventPoll'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Event, SlotWithVotes, Vote } from '@/types'
import { DatabaseService } from '@/services/database'
import { toast } from 'react-hot-toast'

export function Dashboard() {
  const [user, setUser] = useState<{ id: string; email: string; displayName?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [slotsWithVotes, setSlotsWithVotes] = useState<SlotWithVotes[]>([])
  const [createDialogOpen, setCreateDialogOpen] = useState(false)



  const mockSlotsWithVotes: SlotWithVotes[] = [
    {
      id: 'slot1',
      eventId: '1',
      date: '2025-01-25',
      startTime: '12:00',
      endTime: '13:30',
      createdAt: new Date().toISOString(),
      votes: [
        {
          id: 'vote1',
          eventId: '1',
          slotId: 'slot1',
          userId: 'user1',
          userName: 'Sarah Johnson',
          availability: 'yes',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'vote2',
          eventId: '1',
          slotId: 'slot1',
          userId: 'user2',
          userName: 'Alex Chen',
          availability: 'maybe',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'vote3',
          eventId: '1',
          slotId: 'slot1',
          userId: 'user3',
          userName: 'Mike Davis',
          availability: 'yes',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      yesCount: 2,
      maybeCount: 1,
      noCount: 0,
      totalVotes: 3
    },
    {
      id: 'slot2',
      eventId: '1',
      date: '2025-01-26',
      startTime: '12:30',
      endTime: '14:00',
      createdAt: new Date().toISOString(),
      votes: [
        {
          id: 'vote4',
          eventId: '1',
          slotId: 'slot2',
          userId: 'user1',
          userName: 'Sarah Johnson',
          availability: 'no',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'vote5',
          eventId: '1',
          slotId: 'slot2',
          userId: 'user2',
          userName: 'Alex Chen',
          availability: 'yes',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      yesCount: 1,
      maybeCount: 0,
      noCount: 1,
      totalVotes: 2
    },
    {
      id: 'slot3',
      eventId: '1',
      date: '2025-01-27',
      startTime: '11:30',
      endTime: '13:00',
      createdAt: new Date().toISOString(),
      votes: [
        {
          id: 'vote6',
          eventId: '1',
          slotId: 'slot3',
          userId: 'user1',
          userName: 'Sarah Johnson',
          availability: 'yes',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'vote7',
          eventId: '1',
          slotId: 'slot3',
          userId: 'user2',
          userName: 'Alex Chen',
          availability: 'yes',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'vote8',
          eventId: '1',
          slotId: 'slot3',
          userId: 'user3',
          userName: 'Mike Davis',
          availability: 'yes',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      yesCount: 3,
      maybeCount: 0,
      noCount: 0,
      totalVotes: 3
    }
  ]

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  const loadUserEvents = useCallback(async () => {
    if (!user) return
    
    try {
      const userEvents = await DatabaseService.getUserEvents(user.id)
      setEvents(userEvents)
    } catch (error) {
      console.error('Error loading events:', error)
      toast.error('Failed to load events')
    }
  }, [user])

  useEffect(() => {
    if (user) {
      loadUserEvents()
    }
  }, [user, loadUserEvents])

  const handleCreateEvent = async (eventData: {
    title: string
    description: string
    timeSlots: Array<{ date: string; startTime: string; endTime: string }>
  }) => {
    if (!user) return

    try {
      // Create event in database
      const newEvent = await DatabaseService.createEvent({
        id: Date.now().toString(),
        title: eventData.title,
        description: eventData.description,
        organizerId: user.id,
        organizerName: user.displayName || user.email,
        status: 'active'
      })

      // Create time slots in database
      await DatabaseService.createTimeSlots(newEvent.id, eventData.timeSlots)

      // Refresh events list
      await loadUserEvents()
      toast.success('Event created successfully!')
    } catch (error) {
      console.error('Error creating event:', error)
      toast.error('Failed to create event')
    }
  }

  const handleViewEvent = async (event: Event) => {
    setSelectedEvent(event)
    
    try {
      const { slots } = await DatabaseService.getEventWithSlotsAndVotes(event.id)
      setSlotsWithVotes(slots)
    } catch (error) {
      console.error('Error loading event details:', error)
      toast.error('Failed to load event details')
      setSlotsWithVotes([])
    }
  }



  const handleVote = async (slotId: string, availability: Vote['availability']) => {
    if (!user || !selectedEvent) return

    try {
      // Save vote to database
      await DatabaseService.createVote({
        eventId: selectedEvent.id,
        slotId,
        userId: user.id,
        userName: user.displayName || user.email,
        availability
      })

      // Refresh event data to get updated vote counts
      const { slots } = await DatabaseService.getEventWithSlotsAndVotes(selectedEvent.id)
      setSlotsWithVotes(slots)
      
      toast.success(`Vote recorded: ${availability}`)
    } catch (error) {
      console.error('Error voting:', error)
      toast.error('Failed to record vote')
    }
  }

  const handleConfirmSlot = async (slotId: string) => {
    if (!selectedEvent) return

    try {
      // Update event in database
      await DatabaseService.updateEvent(selectedEvent.id, {
        status: 'confirmed',
        confirmedSlotId: slotId
      })

      // Update local state
      const updatedEvent = { ...selectedEvent, status: 'confirmed' as const, confirmedSlotId: slotId }
      setSelectedEvent(updatedEvent)
      
      // Refresh events list
      await loadUserEvents()
      toast.success('Time slot confirmed!')
    } catch (error) {
      console.error('Error confirming slot:', error)
      toast.error('Failed to confirm slot')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-600">Loading GatherEase...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Calendar className="w-16 h-16 text-primary mx-auto" />
          <h1 className="text-2xl font-bold text-gray-900">Welcome to GatherEase</h1>
          <p className="text-gray-600">Please sign in to start planning your gatherings</p>
        </div>
      </div>
    )
  }

  if (selectedEvent) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={user} onCreateEvent={() => setCreateDialogOpen(true)} />
        <main className="py-8 px-4 sm:px-6 lg:px-8">
          <EventPoll
            event={selectedEvent}
            slotsWithVotes={slotsWithVotes}
            currentUser={user}
            onVote={handleVote}
            onConfirmSlot={handleConfirmSlot}
            onBack={() => setSelectedEvent(null)}
          />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} onCreateEvent={() => setCreateDialogOpen(true)} />
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Plan Your Perfect Gathering
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Create events, propose time slots, and let everyone vote on their availability. 
            We'll automatically highlight the best option for easy confirmation.
          </p>
          <Button 
            size="lg" 
            onClick={() => setCreateDialogOpen(true)}
            className="flex items-center space-x-2 mx-auto"
          >
            <Plus className="w-5 h-5" />
            <span>Create Your First Event</span>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardContent className="p-6 text-center">
              <Calendar className="w-8 h-8 text-primary mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">{events.length}</div>
              <div className="text-sm text-gray-600">Total Events</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="w-8 h-8 text-accent mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">
                {events.filter(e => e.status === 'active').length}
              </div>
              <div className="text-sm text-gray-600">Active Polls</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="w-8 h-8 text-green-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">
                {events.filter(e => e.status === 'confirmed').length}
              </div>
              <div className="text-sm text-gray-600">Confirmed Events</div>
            </CardContent>
          </Card>
        </div>

        {/* Events List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Your Events</h2>
            <Button 
              variant="outline" 
              onClick={() => setCreateDialogOpen(true)}
              className="flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Event</span>
            </Button>
          </div>

          {events.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No events yet</h3>
                <p className="text-gray-600 mb-6">
                  Create your first event to start gathering availability from participants.
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Event
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onViewEvent={handleViewEvent}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <CreateEventDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreateEvent={handleCreateEvent}
      />
    </div>
  )
}