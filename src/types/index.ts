export interface Event {
  id: string
  title: string
  description?: string
  organizerId: string
  organizerName: string
  createdAt: string
  updatedAt: string
  status: 'draft' | 'active' | 'confirmed' | 'cancelled'
  confirmedSlotId?: string
}

export interface TimeSlot {
  id: string
  eventId: string
  date: string
  startTime: string
  endTime: string
  createdAt: string
}

export interface Vote {
  id: string
  eventId: string
  slotId: string
  userId: string
  userName: string
  availability: 'yes' | 'maybe' | 'no'
  createdAt: string
  updatedAt: string
}

export interface SlotWithVotes extends TimeSlot {
  votes: Vote[]
  yesCount: number
  maybeCount: number
  noCount: number
  totalVotes: number
}