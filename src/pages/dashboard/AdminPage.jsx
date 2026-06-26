import Card from '../../components/Card'
import Button from '../../components/Button'

export default function AdminPage() {
  return (
    <div className="p-8">
      <Card className="p-8">
        <h1 className="text-3xl font-bold text-text-primary mb-6">Admin</h1>
        <p className="text-text-secondary mb-8">Manage users and platform settings.</p>
        <Button>Add User</Button>
      </Card>
    </div>
  )
}
