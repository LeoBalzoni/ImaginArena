import { supabase } from '../lib/supabase'
import type { Match, Submission, Vote } from '../lib/supabase'
import { useStore } from '../store/useStore'

export class MatchService {
  /**
   * Get match by ID
   */
  static async getMatch(matchId: string): Promise<Match | null> {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single()
    
    if (error) throw error
    return data
  }

  /**
   * Submit image for a match
   */
  static async submitImage(matchId: string, userId: string, imageFile: File): Promise<Submission> {
    // Upload image to Supabase Storage
    const fileExt = imageFile.name.split('.').pop()
    const fileName = `${matchId}-${userId}-${Date.now()}.${fileExt}`
    const filePath = `submissions/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, imageFile)

    if (uploadError) throw uploadError

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath)

    // Save submission to database
    const { data, error } = await supabase
      .from('submissions')
      .insert({
        match_id: matchId,
        user_id: userId,
        image_url: publicUrl
      })
      .select()
      .single()

    if (error) throw error
    
    // Manually refresh submissions to ensure UI updates immediately
    const { setSubmissions } = useStore.getState()
    const submissions = await this.getMatchSubmissions(matchId)
    setSubmissions(submissions)
    
    return data
  }

  /**
   * Get match submissions
   */
  static async getMatchSubmissions(matchId: string): Promise<Submission[]> {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  }

  /**
   * Vote for a submission
   */
  static async voteForSubmission(matchId: string, voterId: string, submissionId: string): Promise<Vote> {
    const { data, error } = await supabase
      .from('votes')
      .insert({
        match_id: matchId,
        voter_id: voterId,
        voted_for_submission_id: submissionId
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Get match votes
   */
  static async getMatchVotes(matchId: string): Promise<Vote[]> {
    const { data, error } = await supabase
      .from('votes')
      .select('*')
      .eq('match_id', matchId)

    if (error) throw error
    return data || []
  }

  /**
   * Calculate match winner and update match
   */
  static async calculateMatchWinner(matchId: string): Promise<string | null> {
    const submissions = await this.getMatchSubmissions(matchId)
    const votes = await this.getMatchVotes(matchId)

    if (submissions.length !== 2) {
      throw new Error('Match must have exactly 2 submissions to calculate winner')
    }

    // Count votes for each submission
    const voteCount = submissions.reduce((acc, submission) => {
      acc[submission.id] = votes.filter(v => v.voted_for_submission_id === submission.id).length
      return acc
    }, {} as Record<string, number>)

    // Find winner (submission with most votes)
    const winningSubmissionId = Object.entries(voteCount).reduce((a, b) => 
      voteCount[a[0]] > voteCount[b[0]] ? a : b
    )[0]

    const winningSubmission = submissions.find(s => s.id === winningSubmissionId)
    if (!winningSubmission) return null

    // Update match with winner
    const { error } = await supabase
      .from('matches')
      .update({ winner_id: winningSubmission.user_id })
      .eq('id', matchId)

    if (error) throw error

    return winningSubmission.user_id
  }

  /**
   * Check if match is ready for voting (both submissions uploaded)
   */
  static async isMatchReadyForVoting(matchId: string): Promise<boolean> {
    const submissions = await this.getMatchSubmissions(matchId)
    return submissions.length === 2
  }

  /**
   * Check if voting is complete for a match
   */
  static async isVotingComplete(matchId: string, totalParticipants: number): Promise<boolean> {
    const votes = await this.getMatchVotes(matchId)
    // Voting is complete when we have votes from all non-competing participants
    // (total participants - 2 competitors)
    const requiredVotes = Math.max(1, totalParticipants - 2)
    return votes.length >= requiredVotes
  }

  /**
   * Get user's current match (if they're a participant)
   */
  static async getUserCurrentMatch(userId: string, tournamentId: string): Promise<Match | null> {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('tournament_id', tournamentId)
      .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
      .is('winner_id', null)
      .order('round', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return data
  }

  /**
   * Subscribe to match updates
   */
  static subscribeToMatchUpdates(matchId: string) {
    const { setCurrentMatch, setSubmissions, setVotes } = useStore.getState()

    const matchSubscription = supabase
      .channel(`match-${matchId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'matches',
        filter: `id=eq.${matchId}`
      }, async (payload) => {
        if (payload.new) {
          setCurrentMatch(payload.new as Match)
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'submissions',
        filter: `match_id=eq.${matchId}`
      }, async () => {
        const submissions = await MatchService.getMatchSubmissions(matchId)
        setSubmissions(submissions)
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'votes',
        filter: `match_id=eq.${matchId}`
      }, async () => {
        const votes = await MatchService.getMatchVotes(matchId)
        setVotes(votes)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(matchSubscription)
    }
  }
}
