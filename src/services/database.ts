import { blink } from '../blink/client'
import { blinkPublic } from '../blink/publicClient'
import type { Event, TimeSlot, Vote, SlotWithVotes } from '../types'

export class DatabaseService {
  // Events
  static async createEvent(event: Omit<Event, 'createdAt' | 'updatedAt'>): Promise<Event> {
    const user = await blink.auth.me()
    const now = new Date().toISOString()
    
    const newEvent: Event = {
      ...event,
      createdAt: now,
      updatedAt: now
    }

    await blink.db.events.create({
      id: newEvent.id,
      title: newEvent.title,
      description: newEvent.description || '',
      organizerId: newEvent.organizerId,
      organizerName: newEvent.organizerName,
      createdAt: newEvent.createdAt,
      updatedAt: newEvent.updatedAt,
      status: newEvent.status,
      confirmedSlotId: newEvent.confirmedSlotId || '',
      userId: user.id
    })

    return newEvent
  }

  static async getEvent(eventId: string): Promise<Event | null> {
    const events = await blink.db.events.list({
      where: { id: eventId },
      limit: 1
    })

    if (events.length === 0) return null

    const event = events[0]
    return {
      id: event.id,
      title: event.title,
      description: event.description || undefined,
      organizerId: event.organizerId,
      organizerName: event.organizerName,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      status: event.status as Event['status'],
      confirmedSlotId: event.confirmedSlotId || undefined
    }
  }

  static async getUserEvents(userId: string): Promise<Event[]> {
    const events = await blink.db.events.list({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })

    return events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description || undefined,
      organizerId: event.organizerId,
      organizerName: event.organizerName,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      status: event.status as Event['status'],
      confirmedSlotId: event.confirmedSlotId || undefined
    }))
  }

  static async updateEvent(eventId: string, updates: Partial<Event>): Promise<void> {
    const updateData: any = {
      ...updates,
      updatedAt: new Date().toISOString()
    }

    // Handle optional fields
    if (updateData.description === undefined) updateData.description = ''
    if (updateData.confirmedSlotId === undefined) updateData.confirmedSlotId = ''

    await blink.db.events.update(eventId, updateData)
  }

  // Time Slots
  static async createTimeSlots(eventId: string, slots: Omit<TimeSlot, 'id' | 'eventId' | 'createdAt'>[]): Promise<TimeSlot[]> {
    const user = await blink.auth.me()
    const now = new Date().toISOString()
    
    const timeSlots: TimeSlot[] = slots.map(slot => ({
      id: `slot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      eventId,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      createdAt: now
    }))

    // Create all slots in database
    await blink.db.timeSlots.createMany(
      timeSlots.map(slot => ({
        id: slot.id,
        eventId: slot.eventId,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        createdAt: slot.createdAt,
        userId: user.id
      }))
    )

    return timeSlots
  }

  static async getEventTimeSlots(eventId: string): Promise<TimeSlot[]> {
    const slots = await blink.db.timeSlots.list({
      where: { eventId },
      orderBy: { date: 'asc' }
    })

    return slots.map(slot => ({
      id: slot.id,
      eventId: slot.eventId,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      createdAt: slot.createdAt
    }))
  }

  // Votes
  static async createVote(vote: Omit<Vote, 'id' | 'createdAt' | 'updatedAt'>): Promise<Vote> {
    const now = new Date().toISOString()
    const voteId = `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const newVote: Vote = {
      id: voteId,
      ...vote,
      createdAt: now,
      updatedAt: now
    }

    // Try to update existing vote first, if not found, create new
    try {
      const existingVotes = await blink.db.votes.list({
        where: { 
          AND: [
            { slotId: vote.slotId },
            { userId: vote.userId }
          ]
        },
        limit: 1
      })

      if (existingVotes.length > 0) {
        // Update existing vote
        await blink.db.votes.update(existingVotes[0].id, {
          availability: vote.availability,
          updatedAt: now
        })
        return {
          ...newVote,
          id: existingVotes[0].id
        }
      } else {
        // Create new vote
        await blink.db.votes.create({
          id: newVote.id,
          eventId: newVote.eventId,
          slotId: newVote.slotId,
          userId: newVote.userId,
          userName: newVote.userName,
          availability: newVote.availability,
          createdAt: newVote.createdAt,
          updatedAt: newVote.updatedAt
        })
        return newVote
      }
    } catch (error) {
      console.error('Error creating/updating vote:', error)
      throw error
    }
  }

  static async getEventVotes(eventId: string): Promise<Vote[]> {
    const votes = await blink.db.votes.list({
      where: { eventId }
    })

    return votes.map(vote => ({
      id: vote.id,
      eventId: vote.eventId,
      slotId: vote.slotId,
      userId: vote.userId,
      userName: vote.userName,
      availability: vote.availability as Vote['availability'],
      createdAt: vote.createdAt,
      updatedAt: vote.updatedAt
    }))
  }

  // Combined data
  static async getEventWithSlotsAndVotes(eventId: string): Promise<{
    event: Event | null
    slots: SlotWithVotes[]
  }> {
    const [event, timeSlots, votes] = await Promise.all([
      this.getEvent(eventId),
      this.getEventTimeSlots(eventId),
      this.getEventVotes(eventId)
    ])

    if (!event) {
      return { event: null, slots: [] }
    }

    const slots: SlotWithVotes[] = timeSlots.map(slot => {
      const slotVotes = votes.filter(vote => vote.slotId === slot.id)
      return {
        ...slot,
        votes: slotVotes,
        yesCount: slotVotes.filter(v => v.availability === 'yes').length,
        maybeCount: slotVotes.filter(v => v.availability === 'maybe').length,
        noCount: slotVotes.filter(v => v.availability === 'no').length,
        totalVotes: slotVotes.length
      }
    })

    return { event, slots }
  }

  // PUBLIC METHODS (no authentication required)
  static async getPublicEvent(eventId: string): Promise<Event | null> {
    const events = await blinkPublic.db.events.list({
      where: { id: eventId },
      limit: 1
    })

    if (events.length === 0) return null

    const event = events[0]
    return {
      id: event.id,
      title: event.title,
      description: event.description || undefined,
      organizerId: event.organizerId,
      organizerName: event.organizerName,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      status: event.status as Event['status'],
      confirmedSlotId: event.confirmedSlotId || undefined
    }
  }

  static async getPublicEventTimeSlots(eventId: string): Promise<TimeSlot[]> {
    const slots = await blinkPublic.db.timeSlots.list({
      where: { eventId },
      orderBy: { date: 'asc' }
    })

    return slots.map(slot => ({
      id: slot.id,
      eventId: slot.eventId,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      createdAt: slot.createdAt
    }))
  }

  static async getPublicEventVotes(eventId: string): Promise<Vote[]> {
    const votes = await blinkPublic.db.votes.list({
      where: { eventId }
    })

    return votes.map(vote => ({
      id: vote.id,
      eventId: vote.eventId,
      slotId: vote.slotId,
      userId: vote.userId,
      userName: vote.userName,
      availability: vote.availability as Vote['availability'],
      createdAt: vote.createdAt,
      updatedAt: vote.updatedAt
    }))
  }

  static async getPublicEventWithSlotsAndVotes(eventId: string): Promise<{
    event: Event | null
    slots: SlotWithVotes[]
  }> {
    const [event, timeSlots, votes] = await Promise.all([
      this.getPublicEvent(eventId),
      this.getPublicEventTimeSlots(eventId),
      this.getPublicEventVotes(eventId)
    ])

    if (!event) {
      return { event: null, slots: [] }
    }

    const slots: SlotWithVotes[] = timeSlots.map(slot => {
      const slotVotes = votes.filter(vote => vote.slotId === slot.id)
      return {
        ...slot,
        votes: slotVotes,
        yesCount: slotVotes.filter(v => v.availability === 'yes').length,
        maybeCount: slotVotes.filter(v => v.availability === 'maybe').length,
        noCount: slotVotes.filter(v => v.availability === 'no').length,
        totalVotes: slotVotes.length
      }
    })

    return { event, slots }
  }

  static async createPublicVote(vote: Omit<Vote, 'id' | 'createdAt' | 'updatedAt'>): Promise<Vote> {
    const now = new Date().toISOString()
    const voteId = `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const newVote: Vote = {
      id: voteId,
      ...vote,
      createdAt: now,
      updatedAt: now
    }

    // Try to update existing vote first, if not found, create new
    try {
      const existingVotes = await blinkPublic.db.votes.list({
        where: { 
          AND: [
            { slotId: vote.slotId },
            { userId: vote.userId }
          ]
        },
        limit: 1
      })

      if (existingVotes.length > 0) {
        // Update existing vote
        await blinkPublic.db.votes.update(existingVotes[0].id, {
          availability: vote.availability,
          updatedAt: now
        })
        return {
          ...newVote,
          id: existingVotes[0].id
        }
      } else {
        // Create new vote
        await blinkPublic.db.votes.create({
          id: newVote.id,
          eventId: newVote.eventId,
          slotId: newVote.slotId,
          userId: newVote.userId,
          userName: newVote.userName,
          availability: newVote.availability,
          createdAt: newVote.createdAt,
          updatedAt: newVote.updatedAt
        })
        return newVote
      }
    } catch (error) {
      console.error('Error creating/updating public vote:', error)
      throw error
    }
  }
}