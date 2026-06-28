import { useState } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Clock, Users, MapPin, MoreHorizontal } from 'lucide-react'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const eventSchema = z.object({
  title: z.string().min(1, 'Event title is required'),
  date: z.string().min(1, 'Date is required'),
  time: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  type: z.enum(['meeting', 'deadline', 'task', 'other']).default('meeting'),
})

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      date: '',
      time: '',
      location: '',
      description: '',
      type: 'meeting',
    },
  })

  const [events] = useState([
    { id: 1, title: 'Team Standup', date: '2025-06-30', time: '09:00', type: 'meeting', color: '#3b82f6' },
    { id: 2, title: 'Client Call', date: '2025-06-30', time: '14:00', type: 'meeting', color: '#10b981' },
    { id: 3, title: 'Project Deadline', date: '2025-07-02', type: 'deadline', color: '#ef4444' },
  ])

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days = []

    for (let i = 0; i < firstDay.getDay(); i++) {
      const prevDay = new Date(year, month, -i)
      days.push({ date: prevDay, isCurrentMonth: false })
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true })
    }

    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false })
    }

    return days
  }

  const daysInMonth = getDaysInMonth(currentDate)
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  const getEventsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0]
    return events.filter(event => event.date === dateStr)
  }

  const isToday = (date) => {
    const today = new Date()
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()
  }

  const handleAddEvent = (date) => {
    setSelectedDate(date)
    reset({
      date: date.toISOString().split('T')[0],
      title: '',
      time: '',
      location: '',
      description: '',
      type: 'meeting',
    })
    setIsModalOpen(true)
  }

  const onSubmit = (data) => {
    console.log('Creating event:', data)
    setIsModalOpen(false)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Calendar</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your schedule</p>
        </div>
        <Button onClick={() => handleAddEvent(new Date())}>
          <Plus size={18} className="mr-2" />
          Add Event
        </Button>
      </div>

      <div className="flex gap-6">
        <div className="flex-1">
          <Card className="p-6">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600"
              >
                <ChevronLeft size={20} />
              </button>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Week Days */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {daysInMonth.map(({ date, isCurrentMonth }, index) => {
                const dayEvents = getEventsForDate(date)
                return (
                  <div
                    key={index}
                    className={`min-h-[100px] p-2 border rounded-xl transition-colors ${
                      !isCurrentMonth ? 'bg-gray-50 dark:bg-gray-900/50 text-gray-400' : 'bg-white dark:bg-gray-900'
                    } hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer`}
                    onClick={() => handleAddEvent(date)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium ${
                        isToday(date) ? 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 w-7 h-7 rounded-full flex items-center justify-center' : ''
                      }`}>
                        {date.getDate()}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map(event => (
                        <div
                          key={event.id}
                          className="text-xs px-2 py-1 rounded truncate text-white"
                          style={{ backgroundColor: event.color }}
                        >
                          {event.time && <span className="opacity-80 mr-1">{event.time}</span>}
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-gray-500 px-2">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="w-80">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Today's Events</h3>
            <div className="space-y-3">
              {events
                .filter(e => e.date === new Date().toISOString().split('T')[0])
                .map(event => (
                  <div key={event.id} className="p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: event.color }} />
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">{event.title}</h4>
                    </div>
                    {event.time && (
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock size={14} />
                        {event.time}
                      </div>
                    )}
                  </div>
                ))}
              {events.filter(e => e.date === new Date().toISOString().split('T')[0]).length === 0 && (
                <p className="text-gray-500 text-sm">No events today</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Event"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Event Title *</label>
            <input
              {...register('title')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            />
            {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date *</label>
              <input
                type="date"
                {...register('date')}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time</label>
              <input
                type="time"
                {...register('time')}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
            <input
              {...register('location')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Add Event
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
