import { supabase } from "../lib/supabase";
import { useStore } from "../store/useStore";

export class AuthService {
  /**
   * Sign in with email and password
   */
  static async signInWithPassword(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Sign up with email and password
   */
  static async signUpWithPassword(
    email: string,
    password: string,
    username: string
  ) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    // If user was created successfully, create their profile
    if (data.user) {
      try {
        await AuthService.createOrUpdateProfile(data.user.id, username);
      } catch (profileError) {
        console.error("Failed to create user profile:", profileError);
        // Don't throw here as the auth user was created successfully
        // The profile creation will be handled by the auth listener
      }
    }

    return data;
  }

  /**
   * Sign out
   */
  static async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    // Clear store state
    const { setUser, setAuthenticated, setCurrentTournament, setCurrentMatch } =
      useStore.getState();
    setAuthenticated(false);
    setUser(null);
    setCurrentTournament(null);
    setCurrentMatch(null);
  }

  /**
   * Get current session
   */
  static async getCurrentSession() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  }

  /**
   * Create or update user profile
   */
  static async createOrUpdateProfile(userId: string, username: string) {
    const { data, error } = await supabase
      .from("users")
      .upsert({
        id: userId,
        username,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get user profile
   */
  static async getUserProfile(userId: string) {
    console.log("getUserProfile: Starting query for userId:", userId);

    // Add timeout to prevent hanging due to RLS issues
    const queryPromise = supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              "Database query timeout after 2 seconds - likely RLS policy issue"
            )
          ),
        2000
      )
    );

    try {
      console.log("getUserProfile: Executing query with timeout...");
      const { data, error } = (await Promise.race([
        queryPromise,
        timeoutPromise,
      ])) as any;

      console.log(
        "getUserProfile: Query completed. Data:",
        data,
        "Error:",
        error
      );

      if (error) {
        console.error("getUserProfile: Database error:", error);
        throw error;
      }

      console.log("getUserProfile: Returning data:", data);
      return data;
    } catch (err) {
      console.error("getUserProfile: Caught exception:", err);
      throw err;
    }
  }

  /**
   * Initialize auth listener
   */
  static initAuthListener() {
    let isInitialized = false;
    let lastUserId: string | null = null;

    supabase.auth.onAuthStateChange(async (event, session) => {
      const {
        setUser,
        setAuthenticated,
        setLoading,
        setError,
        user: currentUser,
      } = useStore.getState();

      console.log(
        "Auth event:",
        event,
        "User ID:",
        session?.user?.id,
        "Current user exists:",
        !!currentUser,
        "Last user ID:",
        lastUserId
      );

      // If we already have a user and this is the same user ID, ignore SIGNED_IN events
      if (
        event === "SIGNED_IN" &&
        currentUser &&
        session?.user?.id === lastUserId
      ) {
        console.log("Ignoring duplicate SIGNED_IN event for existing user");
        return;
      }

      // Only process certain events to avoid unnecessary triggers
      const shouldProcess =
        event === "SIGNED_IN" ||
        event === "SIGNED_OUT" ||
        event === "INITIAL_SESSION" ||
        (!isInitialized && session?.user);

      if (!shouldProcess) {
        console.log("Ignoring auth event:", event);
        return;
      }

      // Track the user ID to prevent duplicate processing
      if (session?.user?.id) {
        lastUserId = session.user.id;
      }

      // Only show loading for actual sign in/out, not for initial session recovery
      const shouldShowLoading = event === "SIGNED_IN" || event === "SIGNED_OUT";

      if (shouldShowLoading) {
        setLoading(true);
      }
      setError(null);

      try {
        if (session?.user) {
          console.log("User authenticated, checking for profile...");

          // User is authenticated (has Supabase session)
          setAuthenticated(true);

          // Only fetch profile if we don't have a user or this is a fresh sign-in
          const shouldFetchProfile =
            !currentUser || (event === "SIGNED_IN" && !currentUser);

          if (shouldFetchProfile) {
            console.log("Attempting to fetch user profile...");

            try {
              // Add a race condition with timeout to prevent hanging
              const profilePromise = AuthService.getUserProfile(
                session.user.id
              );
              const timeoutPromise = new Promise((_, reject) =>
                setTimeout(
                  () => reject(new Error("Profile fetch timeout")),
                  2000
                )
              );

              const profile = await Promise.race([
                profilePromise,
                timeoutPromise,
              ]);
              console.log("Profile found:", profile);
              setUser(profile as any);
            } catch (error) {
              console.log("Profile query failed. Error:", error);
            }
          } else {
            console.log(
              "User profile already exists, skipping fetch for event:",
              event
            );
          }
        } else {
          console.log("No session, clearing user and auth state");
          setAuthenticated(false);
          setUser(null);
        }

        isInitialized = true;
      } catch (error) {
        console.error("Auth state change error:", error);
        setError(
          error instanceof Error ? error.message : "Authentication error"
        );
        setAuthenticated(false);
        setUser(null);
      } finally {
        // Only hide loading if we showed it
        if (shouldShowLoading) {
          setLoading(false);
        }
      }
    });
  }
}
