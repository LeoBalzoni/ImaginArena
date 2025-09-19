import { supabase } from '../lib/supabase'
import type { Tournament, Match, User } from '../lib/supabase'
import { useStore } from '../store/useStore'

export class TournamentService {
  /**
   * Create a new tournament
   */
  static async createTournament(): Promise<Tournament> {
    const { data, error } = await supabase
      .from('tournaments')
      .insert({
        status: 'lobby'
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  /**
   * Get current active tournament (lobby or in_progress)
   */
  static async getCurrentTournament(): Promise<Tournament | null> {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .in('status', ['lobby', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    
    if (error) throw error
    return data
  }

  /**
   * Join a tournament
   */
  static async joinTournament(tournamentId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('tournament_participants')
      .insert({
        tournament_id: tournamentId,
        user_id: userId
      })
    
    if (error) throw error
  }

  /**
   * Get tournament participants
   */
  static async getTournamentParticipants(tournamentId: string): Promise<User[]> {
    const { data, error } = await supabase
      .rpc('get_tournament_participants', { tournament_uuid: tournamentId })
    
    if (error) throw error
    return data || []
  }

  /**
   * Start tournament (create matches)
   */
  static async startTournament(tournamentId: string): Promise<void> {
    // Get participants
    const participants = await this.getTournamentParticipants(tournamentId)
    
    if (participants.length !== 16) {
      throw new Error('Tournament needs exactly 16 participants to start')
    }

    // Shuffle participants for random matchups
    const shuffledParticipants = [...participants].sort(() => Math.random() - 0.5)
    const participantIds = shuffledParticipants.map(p => p.id)

    // Create matches using the database function
    const { error: matchError } = await supabase
      .rpc('create_tournament_matches', {
        tournament_uuid: tournamentId,
        participants: participantIds
      })
    
    if (matchError) throw matchError

    // Update tournament status
    const { error: updateError } = await supabase
      .from('tournaments')
      .update({ status: 'in_progress' })
      .eq('id', tournamentId)
    
    if (updateError) throw updateError
  }

  /**
   * Get tournament matches
   */
  static async getTournamentMatches(tournamentId: string): Promise<Match[]> {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('round', { ascending: true })
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data || []
  }

  /**
   * Get current round matches
   */
  static async getCurrentRoundMatches(tournamentId: string): Promise<Match[]> {
    const matches = await this.getTournamentMatches(tournamentId)
    
    // Find the current round (lowest round with unfinished matches)
    const unfinishedMatches = matches.filter(m => !m.winner_id)
    if (unfinishedMatches.length === 0) return []
    
    const currentRound = Math.min(...unfinishedMatches.map(m => m.round))
    return matches.filter(m => m.round === currentRound)
  }

  /**
   * Create next round matches
   */
  static async createNextRoundMatches(tournamentId: string): Promise<void> {
    const matches = await this.getTournamentMatches(tournamentId)
    
    // Get the latest completed round
    const completedMatches = matches.filter(m => m.winner_id)
    if (completedMatches.length === 0) return
    
    const latestRound = Math.max(...completedMatches.map(m => m.round))
    const latestRoundMatches = completedMatches.filter(m => m.round === latestRound)
    
    // Check if all matches in the round are completed
    const allRoundMatches = matches.filter(m => m.round === latestRound)
    if (latestRoundMatches.length !== allRoundMatches.length) return
    
    // If only one winner left, tournament is finished
    if (latestRoundMatches.length === 1) {
      await supabase
        .from('tournaments')
        .update({ status: 'finished' })
        .eq('id', tournamentId)
      return
    }

    // Create next round matches
    const winners = latestRoundMatches.map(m => m.winner_id).filter(Boolean)
    const nextRound = latestRound + 1
    
    const prompts = [
      'A magical forest at sunset with glowing mushrooms',
      'A cyberpunk city street in the rain at night',
      'A cozy cabin in the mountains during winter',
      'An underwater palace with colorful coral gardens',
      'A steampunk airship floating above the clouds',
      'A desert oasis with ancient ruins in the background',
      'A space station orbiting a distant planet',
      'A medieval castle on a cliff overlooking the ocean'
    ]

    for (let i = 0; i < winners.length; i += 2) {
      if (i + 1 < winners.length) {
        const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)]
        
        await supabase
          .from('matches')
          .insert({
            tournament_id: tournamentId,
            round: nextRound,
            player1_id: winners[i],
            player2_id: winners[i + 1],
            prompt: randomPrompt
          })
      }
    }
  }

  /**
   * Subscribe to tournament updates
   */
  static subscribeToTournamentUpdates(tournamentId: string) {
    const { setCurrentTournament, setParticipants, setMatches } = useStore.getState()
    
    // Subscribe to tournament changes
    const tournamentSubscription = supabase
      .channel(`tournament-${tournamentId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tournaments',
        filter: `id=eq.${tournamentId}`
      }, async (payload) => {
        if (payload.new) {
          setCurrentTournament(payload.new as Tournament)
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tournament_participants',
        filter: `tournament_id=eq.${tournamentId}`
      }, async () => {
        const participants = await TournamentService.getTournamentParticipants(tournamentId)
        setParticipants(participants)
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'matches',
        filter: `tournament_id=eq.${tournamentId}`
      }, async () => {
        const matches = await TournamentService.getTournamentMatches(tournamentId)
        setMatches(matches)
      })
      .subscribe()
    
    return () => {
      supabase.removeChannel(tournamentSubscription)
    }
  }
}
