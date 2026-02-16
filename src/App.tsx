import { AuthProvider, useAuth } from './contexts/AuthContext'
import AppLayout from './components/layout/AppLayout'
import LoginScreen from './components/auth/LoginScreen'

// Loading spinner component
const LoadingScreen = () => (
  <div className="min-h-screen bg-trader-bg flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-green flex items-center justify-center animate-pulse">
        <span className="text-trader-bg font-bold text-2xl">HT</span>
      </div>
      <div className="w-8 h-8 mx-auto border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
      <p className="mt-4 text-trader-muted text-sm">Loading...</p>
    </div>
  </div>
)

// Auth gate component
const AuthGate = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  if (!user) {
    return <LoginScreen />
  }

  return <AppLayout />
}

function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  )
}

export default App
