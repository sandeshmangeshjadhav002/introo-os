import Card from '../../components/Card'
import Button from '../../components/Button'

export default function SettingsPage() {
  return (
    <div className="p-8">
      <Card className="p-8">
        <h1 className="text-3xl font-bold text-text-primary mb-6">Settings</h1>
        <p className="text-text-secondary mb-8">Manage your account settings.</p>
        <Button>Save Changes</Button>
      </Card>
    </div>
  )
}
