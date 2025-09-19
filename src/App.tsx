import React, { useEffect } from 'react'
import { useStore } from './store/useStore'
import { AuthService } from './services/authService'
import { LoginForm } from './components/Auth/LoginForm'
import { UsernameSetup } from './components/Auth/UsernameSetup'
import { LobbyScreen } from './components/Lobby/LobbyScreen'
import { TournamentBracket } from './components/Tournament/TournamentBracket'
import { MatchScreen } from './components/Match/MatchScreen'
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

  useEffect(() => {
    // Initialize auth listener
    AuthService.initAuthListener()
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
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
        </main>
      </div>
    </ErrorBoundary>
  )
}

export default App
