import { create } from 'zustand'
import type { User, Tournament, Match, Submission, Vote } from '../lib/supabase'

interface AppState {
  // Auth state
  user: User | null
  isAuthenticated: boolean
  
  // Tournament state
  currentTournament: Tournament | null
  tournaments: Tournament[]
  participants: User[]
  
  // Match state
  currentMatch: Match | null
  matches: Match[]
  submissions: Submission[]
  votes: Vote[]
  
  // UI state
  isLoading: boolean
  error: string | null
  currentView: 'lobby' | 'tournament' | 'match' | 'results' | 'admin'
  
  // Actions
  setUser: (user: User | null) => void
  setCurrentTournament: (tournament: Tournament | null) => void
  setTournaments: (tournaments: Tournament[]) => void
  setParticipants: (participants: User[]) => void
  setCurrentMatch: (match: Match | null) => void
  setMatches: (matches: Match[]) => void
  setSubmissions: (submissions: Submission[]) => void
  setVotes: (votes: Vote[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setCurrentView: (view: 'lobby' | 'tournament' | 'match' | 'results' | 'admin') => void
  
  // Computed getters
  isUserInTournament: () => boolean
  getCurrentUserSubmission: () => Submission | null
  hasUserVoted: (matchId: string) => boolean
  getMatchWinner: (matchId: string) => User | null
}

export const useStore = create<AppState>((set, get) => ({
  // Initial state
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
  currentView: 'lobby',
  
  // Actions
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setCurrentTournament: (tournament) => set({ currentTournament: tournament }),
  setTournaments: (tournaments) => set({ tournaments }),
  setParticipants: (participants) => set({ participants }),
  setCurrentMatch: (match) => set({ currentMatch: match }),
  setMatches: (matches) => set({ matches }),
  setSubmissions: (submissions) => set({ submissions }),
  setVotes: (votes) => set({ votes }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setCurrentView: (view) => set({ currentView: view }),
  
  // Computed getters
  isUserInTournament: () => {
    const { user, participants } = get()
    return !!user && participants.some(p => p.id === user.id)
  },
  
  getCurrentUserSubmission: () => {
    const { user, currentMatch, submissions } = get()
    if (!user || !currentMatch) return null
    return submissions.find(s => s.user_id === user.id && s.match_id === currentMatch.id) || null
  },
  
  hasUserVoted: (matchId: string) => {
    const { user, votes } = get()
    if (!user) return false
    return votes.some(v => v.voter_id === user.id && v.match_id === matchId)
  },
  
  getMatchWinner: (matchId: string) => {
    const { matches, participants } = get()
    const match = matches.find(m => m.id === matchId)
    if (!match || !match.winner_id) return null
    return participants.find(p => p.id === match.winner_id) || null
  }
}))
