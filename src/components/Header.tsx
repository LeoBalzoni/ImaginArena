import React from 'react'
import { Crown, LogOut, User, Trophy, Users } from 'lucide-react'
import { useStore } from '../store/useStore'
import { AuthService } from '../services/authService'

export const Header: React.FC = () => {
  const { user, currentTournament, participants, setCurrentView, currentView } = useStore()

  const handleSignOut = async () => {
    try {
      await AuthService.signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const getStatusText = () => {
    if (!currentTournament) return 'No active tournament'
    
    switch (currentTournament.status) {
      case 'lobby':
        return `Lobby (${participants.length}/16 players)`
      case 'in_progress':
        return 'Tournament in progress'
      case 'finished':
        return 'Tournament finished'
      default:
        return 'Unknown status'
    }
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 text-primary-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Prompt Battles</h1>
              <p className="text-xs text-gray-500">{getStatusText()}</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-4">
            <button
              onClick={() => setCurrentView('lobby')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'lobby'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Users className="w-4 h-4 inline mr-1" />
              Lobby
            </button>
            
            {currentTournament && currentTournament.status !== 'lobby' && (
              <button
                onClick={() => setCurrentView('tournament')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'tournament' || currentView === 'results'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Trophy className="w-4 h-4 inline mr-1" />
                Tournament
              </button>
            )}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <User className="w-4 h-4" />
              <span className="font-medium">{user?.username}</span>
            </div>
            
            <button
              onClick={handleSignOut}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-200 bg-gray-50">
        <div className="px-4 py-2 flex gap-2">
          <button
            onClick={() => setCurrentView('lobby')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentView === 'lobby'
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Users className="w-4 h-4 inline mr-1" />
            Lobby
          </button>
          
          {currentTournament && currentTournament.status !== 'lobby' && (
            <button
              onClick={() => setCurrentView('tournament')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'tournament' || currentView === 'results'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Trophy className="w-4 h-4 inline mr-1" />
              Tournament
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
