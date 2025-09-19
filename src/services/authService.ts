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
    const { setUser, setLoading } = useStore.getState()
    
    supabase.auth.onAuthStateChange(async (event, session) => {
      setLoading(true)
      
      try {
        if (session?.user) {
          // Try to get existing profile
          try {
            const profile = await AuthService.getUserProfile(session.user.id)
            setUser(profile)
          } catch (error) {
            // Profile doesn't exist, user needs to create one
            setUser(null)
          }
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('Auth state change error:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    })
  }
}
