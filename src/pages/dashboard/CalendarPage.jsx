import Card from '../../components/Card'
import Button from '../../components/Button'

export default function CalendarPage() {
  return (
    <div className="p-8">
      <Card className="p-8">
        <h1 className="text-3xl font-bold text-text-primary mb-6">Calendar</h1>
        <p className="text-text-secondary mb-8">Manage events and appointments.</p>
        <Button>Add Event</Button>
      </Card>
    </div>
  )
}
