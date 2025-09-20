import { useEffect, useRef } from 'react'
import { useStore } from './store/useStore'
import { AuthService } from './services/authService'
import { LoginForm } from './components/Auth/LoginForm'
import { UsernameSetup } from './components/Auth/UsernameSetup'
import { LobbyScreen } from './components/Lobby/LobbyScreen'
import { TournamentBracket } from './components/Tournament/TournamentBracket'
import { MatchScreen } from './components/Match/MatchScreen'
import { AdminDashboard } from './components/Admin/AdminDashboard'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Header } from './components/Header'
import { Loader2 } from 'lucide-react'

function App() {
  const {
    user,
    isAuthenticated,
    currentTournament,
    currentView,
    isLoading,
    error,
    setError,
    setCurrentView
  } = useStore()

  const authInitialized = useRef(false)

  useEffect(() => {
    // Initialize auth listener only once
    if (!authInitialized.current) {
      console.log('Initializing auth listener...')
      AuthService.initAuthListener()
      authInitialized.current = true
    }
  }, [])

  useEffect(() => {
    // Determine current view based on app state
    if (isAuthenticated && user && currentTournament) {
      if (currentTournament.status === 'lobby') {
        setCurrentView('lobby')
      } else if (currentTournament.status === 'in_progress') {
        setCurrentView('tournament')
      } else if (currentTournament.status === 'finished') {
        setCurrentView('results')
      }
    }
  }, [isAuthenticated, user, currentTournament, setCurrentView])

  // Show loading spinner during initial load
  if (isLoading) {
    console.log('App is loading...', { isAuthenticated, user: !!user })
    
    const handleForceReset = async () => {
      try {
        // Clear all state
        useStore.setState({
          user: null,
          isAuthenticated: false,
          currentTournament: null,
          tournaments: [],
          participants: [],
          currentMatch: null,
          matches: [],
          submissions: [],
          votes: [],
          isLoading: false,
          error: null,
          currentView: 'lobby'
        })
        
        // Sign out from Supabase
        await AuthService.signOut()
        
        // Clear local storage
        localStorage.clear()
        sessionStorage.clear()
        
        // Reload the page
        window.location.reload()
      } catch (error) {
        console.error('Reset error:', error)
      }
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
          <p className="text-xs text-gray-400 mt-2">
            Auth: {isAuthenticated ? 'Yes' : 'No'} | User: {user ? 'Yes' : 'No'}
          </p>
          <button
            onClick={handleForceReset}
            className="mt-4 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
          >
            🔄 Force Reset App (Debug)
          </button>
        </div>
      </div>
    )
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <LoginForm />
      </div>
    )
  }

  // Show username setup if authenticated but no user profile
  if (isAuthenticated && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <UsernameSetup />
      </div>
    )
  }

  // Main application
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mx-4 mt-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main>
          {currentView === 'lobby' && <LobbyScreen />}
          {currentView === 'tournament' && <TournamentBracket />}
          {currentView === 'match' && <MatchScreen />}
          {currentView === 'results' && <TournamentBracket />}
          {currentView === 'admin' && user?.is_admin && <AdminDashboard />}
        </main>
      </div>
    </ErrorBoundary>
  )
}

export default App
