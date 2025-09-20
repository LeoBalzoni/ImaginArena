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
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    return data
  }

  /**
   * Initialize auth listener
   */
  static initAuthListener() {
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.id)
      const { setUser, setLoading, setError } = useStore.getState()
      
      setLoading(true)
      setError(null)
      
      try {
        if (session?.user) {
          console.log('User authenticated, checking profile...')
          // Try to get existing profile
          try {
            console.log('Calling getUserProfile for user:', session.user.id)
            // Add timeout to prevent hanging
            const profilePromise = AuthService.getUserProfile(session.user.id)
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Profile lookup timeout')), 5000)
            )
            const profile = await Promise.race([profilePromise, timeoutPromise])
            console.log('Profile found:', profile)
            setUser(profile)
            console.log('User state updated, isAuthenticated should be true')
          } catch (error) {
            console.log('Profile not found, user needs to create one:', error)
            console.log('Error details:', error)
            // Profile doesn't exist, but user is authenticated
            // Set user to null but keep them authenticated so they can create a profile
            setUser(null)
            // Manually set authenticated state since user is null
            useStore.setState({ isAuthenticated: true })
            console.log('Set isAuthenticated to true manually')
          }
        } else {
          console.log('No session, user not authenticated')
          setUser(null) // This will also set isAuthenticated to false
        }
      } catch (error) {
        console.error('Auth state change error:', error)
        setError(`Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        setUser(null)
      } finally {
        setLoading(false)
      }
    })
  }
}
