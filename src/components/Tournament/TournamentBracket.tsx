import React, { useEffect } from 'react'
import { Trophy, Users, Clock, CheckCircle } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { TournamentService } from '../../services/tournamentService'
import type { Match, User } from '../../lib/supabase'

interface BracketMatchProps {
  match: Match | null
  participants: User[]
  isActive?: boolean
  onClick?: () => void
}

const BracketMatch: React.FC<BracketMatchProps> = ({ match, participants, isActive, onClick }) => {
  if (!match) {
    return (
      <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-3 min-h-[80px] flex items-center justify-center">
        <span className="text-gray-500 text-sm">TBD</span>
      </div>
    )
  }

  const player1 = participants.find(p => p.id === match.player1_id)
  const player2 = participants.find(p => p.id === match.player2_id)
  const winner = match.winner_id ? participants.find(p => p.id === match.winner_id) : null

  return (
    <div
      className={`
        border-2 rounded-lg p-3 cursor-pointer transition-all
        ${isActive 
          ? 'border-primary-500 bg-primary-50 shadow-md' 
          : winner 
            ? 'border-green-300 bg-green-50' 
            : 'border-gray-300 bg-white hover:border-gray-400'
        }
      `}
      onClick={onClick}
    >
      <div className="space-y-2">
        <div className={`flex items-center justify-between p-2 rounded ${
          winner?.id === player1?.id ? 'bg-green-100 font-semibold' : 'bg-gray-50'
        }`}>
          <span className="text-sm truncate">{player1?.username || 'Player 1'}</span>
          {winner?.id === player1?.id && <CheckCircle className="w-4 h-4 text-green-600" />}
        </div>
        <div className={`flex items-center justify-between p-2 rounded ${
          winner?.id === player2?.id ? 'bg-green-100 font-semibold' : 'bg-gray-50'
        }`}>
          <span className="text-sm truncate">{player2?.username || 'Player 2'}</span>
          {winner?.id === player2?.id && <CheckCircle className="w-4 h-4 text-green-600" />}
        </div>
      </div>
      {!winner && (
        <div className="flex items-center justify-center mt-2 text-xs text-gray-500">
          <Clock className="w-3 h-3 mr-1" />
          In Progress
        </div>
      )}
    </div>
  )
}

export const TournamentBracket: React.FC = () => {
  const {
    currentTournament,
    matches,
    participants,
    setMatches,
    setCurrentMatch,
    setCurrentView
  } = useStore()

  useEffect(() => {
    if (currentTournament) {
      loadMatches()
    }
  }, [currentTournament])

  const loadMatches = async () => {
    if (!currentTournament) return

    try {
      const tournamentMatches = await TournamentService.getTournamentMatches(currentTournament.id)
      setMatches(tournamentMatches)
    } catch (error) {
      console.error('Failed to load matches:', error)
    }
  }

  const handleMatchClick = (match: Match) => {
    setCurrentMatch(match)
    setCurrentView('match')
  }

  const getMatchesByRound = (round: number): Match[] => {
    return matches.filter(m => m.round === round)
  }

  const getRoundName = (round: number, matchCount: number): string => {
    switch (matchCount) {
      case 8: return 'Round 1'
      case 4: return 'Quarterfinals'
      case 2: return 'Semifinals'
      case 1: return 'Final'
      default: return `Round ${round}`
    }
  }

  const renderRound = (round: number) => {
    const roundMatches = getMatchesByRound(round)
    if (roundMatches.length === 0) return null

    return (
      <div key={round} className="flex flex-col items-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {getRoundName(round, roundMatches.length)}
        </h3>
        <div className="space-y-4">
          {roundMatches.map((match) => (
            <BracketMatch
              key={match.id}
              match={match}
              participants={participants}
              onClick={() => handleMatchClick(match)}
            />
          ))}
        </div>
      </div>
    )
  }

  const champion = currentTournament?.status === 'finished' 
    ? (() => {
        const finalMatch = matches.find(m => m.round === Math.max(...matches.map(m => m.round)))
        return finalMatch?.winner_id ? participants.find(p => p.id === finalMatch.winner_id) : null
      })()
    : null

  if (!currentTournament) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No active tournament</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="text-center mb-8">
        <Trophy className="w-12 h-12 text-primary-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tournament Bracket</h1>
        <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{participants.length} Players</span>
          </div>
          <div className="flex items-center gap-1">
            <Trophy className="w-4 h-4" />
            <span className="capitalize">{currentTournament.status}</span>
          </div>
        </div>
      </div>

      {champion && (
        <div className="card mb-8 text-center bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300">
          <Trophy className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Tournament Champion!</h2>
          <p className="text-xl text-gray-700">{champion.username}</p>
        </div>
      )}

      <div className="card overflow-x-auto">
        <div className="flex gap-8 min-w-max pb-4">
          {[1, 2, 3, 4].map(round => renderRound(round)).filter(Boolean)}
        </div>
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={() => setCurrentView('lobby')}
          className="btn-secondary"
        >
          Back to Lobby
        </button>
      </div>
    </div>
  )
}
