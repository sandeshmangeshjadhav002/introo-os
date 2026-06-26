import { Navigate } from 'react-router-dom'
import { useSupabase } from '../context/SupabaseContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useSupabase()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}
