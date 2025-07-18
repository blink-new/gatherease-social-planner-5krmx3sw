import { useState } from 'react'
import { Plus, X, Calendar, Clock } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'

interface TimeSlotInput {
  id: string
  date: string
  startTime: string
  endTime: string
}

interface CreateEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateEvent: (eventData: {
    title: string
    description: string
    timeSlots: TimeSlotInput[]
  }) => void
}

export function CreateEventDialog({ open, onOpenChange, onCreateEvent }: CreateEventDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [timeSlots, setTimeSlots] = useState<TimeSlotInput[]>([
    { id: '1', date: '', startTime: '', endTime: '' }
  ])

  const addTimeSlot = () => {
    const newSlot: TimeSlotInput = {
      id: Date.now().toString(),
      date: '',
      startTime: '',
      endTime: ''
    }
    setTimeSlots([...timeSlots, newSlot])
  }

  const removeTimeSlot = (id: string) => {
    if (timeSlots.length > 1) {
      setTimeSlots(timeSlots.filter(slot => slot.id !== id))
    }
  }

  const updateTimeSlot = (id: string, field: keyof TimeSlotInput, value: string) => {
    setTimeSlots(timeSlots.map(slot => 
      slot.id === id ? { ...slot, [field]: value } : slot
    ))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) return
    
    const validSlots = timeSlots.filter(slot => 
      slot.date && slot.startTime && slot.endTime
    )
    
    if (validSlots.length === 0) return

    onCreateEvent({
      title: title.trim(),
      description: description.trim(),
      timeSlots: validSlots
    })

    // Reset form
    setTitle('')
    setDescription('')
    setTimeSlots([{ id: '1', date: '', startTime: '', endTime: '' }])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-primary" />
            <span>Create New Event</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Team Lunch, Birthday Party, Project Meeting"
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add any additional details about your event..."
                className="mt-1 min-h-[80px]"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Proposed Time Slots *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTimeSlot}
                className="flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Add Slot</span>
              </Button>
            </div>

            <div className="space-y-3">
              {timeSlots.map((slot, index) => (
                <Card key={slot.id} className="border-2 border-dashed border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-primary" />
                        <span className="font-medium text-sm">Option {index + 1}</span>
                      </div>
                      {timeSlots.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTimeSlot(slot.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label htmlFor={`date-${slot.id}`} className="text-sm">Date</Label>
                        <Input
                          id={`date-${slot.id}`}
                          type="date"
                          value={slot.date}
                          onChange={(e) => updateTimeSlot(slot.id, 'date', e.target.value)}
                          className="mt-1"
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`start-${slot.id}`} className="text-sm">Start Time</Label>
                        <Input
                          id={`start-${slot.id}`}
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => updateTimeSlot(slot.id, 'startTime', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`end-${slot.id}`} className="text-sm">End Time</Label>
                        <Input
                          id={`end-${slot.id}`}
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => updateTimeSlot(slot.id, 'endTime', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || timeSlots.every(slot => !slot.date || !slot.startTime || !slot.endTime)}
            >
              Create Event
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}