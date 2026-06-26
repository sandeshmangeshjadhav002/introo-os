import Card from '../../components/Card'
import Button from '../../components/Button'

export default function ChatPage() {
  return (
    <div className="p-8">
      <Card className="p-8">
        <h1 className="text-3xl font-bold text-text-primary mb-6">Chat</h1>
        <p className="text-text-secondary mb-8">Communicate with your team.</p>
        <Button>New Message</Button>
      </Card>
    </div>
  )
}
