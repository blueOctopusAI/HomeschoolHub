"use client"

import { useState } from "react"
import { CalendarGrid } from "./calendar-grid"
import { EventForm } from "./event-form"
import { EventList } from "./event-list"
import type { Event } from "@/types/event"

export function CalendarApp() {
  const [events, setEvents] = useState<Event[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isAddingEvent, setIsAddingEvent] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)

  const handleAddEvent = (event: Event) => {
    if (editingEvent) {
      setEvents(events.map((e) => (e.id === editingEvent.id ? event : e)))
      setEditingEvent(null)
    } else {
      setEvents([...events, { ...event, id: Date.now().toString() }])
    }
    setIsAddingEvent(false)
  }

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event)
    setIsAddingEvent(true)
  }

  const handleDeleteEvent = (id: string) => {
    setEvents(events.filter((event) => event.id !== id))
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <CalendarGrid
          events={events}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onAddEvent={() => {
            setEditingEvent(null)
            setIsAddingEvent(true)
          }}
        />
      </div>
      <div className="space-y-6">
        {isAddingEvent ? (
          <EventForm
            selectedDate={selectedDate}
            onSubmit={handleAddEvent}
            onCancel={() => {
              setIsAddingEvent(false)
              setEditingEvent(null)
            }}
            editingEvent={editingEvent}
          />
        ) : (
          <EventList
            events={events}
            selectedDate={selectedDate}
            onEditEvent={handleEditEvent}
            onDeleteEvent={handleDeleteEvent}
          />
        )}
      </div>
    </div>
  )
}
