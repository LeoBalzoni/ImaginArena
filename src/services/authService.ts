import { supabase } from '../lib/supabase'
import { useStore } from '../store/useStore'

export class AuthService {
  /**
   * Sign in with magic link
   */
  static async signInWithMagicLink(email: string) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })
    
    if (error) throw error
    return { success: true }
  }

  /**
   * Sign in with GitHub
   */
  static async signInWithGitHub() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    
    if (error) throw error
  }

  /**
   * Sign in with Google
   */
  static async signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    
    if (error) throw error
  }

  /**
   * Sign out
   */
  static async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    
    // Clear store state
    const { setUser, setCurrentTournament, setCurrentMatch } = useStore.getState()
    setUser(null)
    setCurrentTournament(null)
    setCurrentMatch(null)
  }

  /**
   * Get current session
   */
  static async getCurrentSession() {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  }

  /**
   * Create or update user profile
   */
  static async createOrUpdateProfile(userId: string, username: string) {
    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: userId,
        username
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  /**
   * Get user profile
   */
  static async getUserProfile(userId: string) {
    console.log('getUserProfile: Starting query for userId:', userId)
    
    try {
      // Add timeout to prevent hanging
      const queryPromise = supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout after 5 seconds')), 5000)
      )
      
      console.log('getUserProfile: Executing query with timeout...')
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any
      
      console.log('getUserProfile: Query completed. Data:', data, 'Error:', error)
      
      if (error) {
        console.error('getUserProfile: Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        throw error
      }
      
      console.log('getUserProfile: Returning data:', data)
      return data
    } catch (err) {
      console.error('getUserProfile: Caught exception:', err)
      throw err
    }
  }

  /**
   * Initialize auth listener
   */
  static initAuthListener() {
    let isInitialLoad = true

    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.id)
      const { setUser, setLoading, setError, user: currentUser } = useStore.getState()

      // Only show loading on initial load or significant auth events
      const shouldShowLoading = isInitialLoad || event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED'

      if (shouldShowLoading) {
        setLoading(true)
      }
      setError(null)

      try {
        if (session?.user) {
          console.log('User authenticated, checking profile...')

          // If we already have a user profile and this is just a token refresh or tab focus,
          // don't refetch unless it's a new user
          if (currentUser && currentUser.id === session.user.id && !isInitialLoad && event !== 'SIGNED_IN') {
            console.log('User profile already exists, skipping refetch')
            return
          }
          
          // Try to get existing profile
          try {
            console.log('Calling getUserProfile for user:', session.user.id, '(', session.user.email, ')')
            const profile = await AuthService.getUserProfile(session.user.id)
            console.log('Profile found:', profile)
            setUser(profile)
            console.log('User state updated, isAuthenticated should be true')
          } catch (error) {
            console.error('Profile not found or error occurred:', error)
          }
        } else {
          console.log('No session, user not authenticated')
          setUser(null) // This will also set isAuthenticated to false
        }
      } catch (error) {
        console.error('Auth state change error:', error)
        setError(`Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        if (!currentUser) {
          setUser(null)
        }
      } finally {
        if (shouldShowLoading) {
          setLoading(false)
        }
        isInitialLoad = false
      }
    })
  }
}
