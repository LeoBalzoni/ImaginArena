import { supabase } from "../lib/supabase";
import type { Tournament, Match, User } from "../lib/supabase";
import { useStore } from "../store/useStore";
import { getRandomPrompt } from "../data/prompts";

export class TournamentService {
  /**
   * Create a new tournament
   */
  static async createTournament(): Promise<Tournament> {
    const { data, error } = await supabase
      .from("tournaments")
      .insert({
        status: "lobby",
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get current active tournament (lobby or in_progress)
   */
  static async getCurrentTournament(): Promise<Tournament | null> {
    const { data, error } = await supabase
      .from("tournaments")
      .select("*")
      .in("status", ["lobby", "in_progress"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  /**
   * Join a tournament
   */
  static async joinTournament(
    tournamentId: string,
    userId: string
  ): Promise<void> {
    console.log("TournamentService: Joining tournament", {
      tournamentId,
      userId,
    });
    const { error } = await supabase.from("tournament_participants").insert({
      tournament_id: tournamentId,
      user_id: userId,
    });

    if (error) {
      console.error("TournamentService: Join tournament error:", error);
      throw error;
    }
    console.log("TournamentService: Successfully joined tournament");

    // Manually refresh participants to ensure UI updates immediately
    const { setParticipants } = useStore.getState();
    const participants = await this.getTournamentParticipants(tournamentId);
    setParticipants(participants);
  }

  /**
   * Get tournament participants
   */
  static async getTournamentParticipants(
    tournamentId: string
  ): Promise<User[]> {
    const { data, error } = await supabase.rpc("get_tournament_participants", {
      tournament_uuid: tournamentId,
    });

    if (error) throw error;
    return data || [];
  }

  /**
   * Start tournament (create matches)
   */
  static async startTournament(tournamentId: string): Promise<void> {
    // Get participants
    const participants = await this.getTournamentParticipants(tournamentId);

    if (participants.length < 2) {
      throw new Error("Tournament needs at least 2 participants to start");
    }

    // For tournaments with less than 16 players, we'll pad with byes or adjust bracket size
    if (participants.length > 16) {
      throw new Error("Tournament cannot have more than 16 participants");
    }

    // Shuffle participants for random matchups
    const shuffledParticipants = [...participants].sort(
      () => Math.random() - 0.5
    );
    const participantIds = shuffledParticipants.map((p) => p.id);

    // Create matches using the database function
    const { error: matchError } = await supabase.rpc(
      "create_tournament_matches",
      {
        tournament_uuid: tournamentId,
        participants: participantIds,
      }
    );

    if (matchError) throw matchError;

    // Update tournament status
    const { error: updateError } = await supabase
      .from("tournaments")
      .update({ status: "in_progress" })
      .eq("id", tournamentId);

    if (updateError) throw updateError;

    // Manually update the tournament status and matches in the store to ensure UI updates
    const { setCurrentTournament, setMatches } = useStore.getState();
    const updatedTournament = await supabase
      .from("tournaments")
      .select("*")
      .eq("id", tournamentId)
      .single();

    if (updatedTournament.data) {
      setCurrentTournament(updatedTournament.data);
    }

    // Load the newly created matches
    const matches = await this.getTournamentMatches(tournamentId);
    setMatches(matches);
  }

  /**
   * Get tournament matches
   */
  static async getTournamentMatches(tournamentId: string): Promise<Match[]> {
    const { data, error } = await supabase
      .from("matches")
      .select("*")
      .eq("tournament_id", tournamentId)
      .order("round", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get current round matches
   */
  static async getCurrentRoundMatches(tournamentId: string): Promise<Match[]> {
    const matches = await this.getTournamentMatches(tournamentId);

    // Find the current round (lowest round with unfinished matches)
    const unfinishedMatches = matches.filter((m) => !m.winner_id);
    if (unfinishedMatches.length === 0) return [];

    const currentRound = Math.min(...unfinishedMatches.map((m) => m.round));
    return matches.filter((m) => m.round === currentRound);
  }

  /**
   * Create next round matches
   */
  static async createNextRoundMatches(tournamentId: string): Promise<void> {
    const matches = await this.getTournamentMatches(tournamentId);

    // Get the latest completed round
    const completedMatches = matches.filter((m) => m.winner_id);
    if (completedMatches.length === 0) return;

    const latestRound = Math.max(...completedMatches.map((m) => m.round));
    const latestRoundMatches = completedMatches.filter(
      (m) => m.round === latestRound
    );

    // Check if all matches in the round are completed
    const allRoundMatches = matches.filter((m) => m.round === latestRound);
    if (latestRoundMatches.length !== allRoundMatches.length) return;

    // If only one winner left, tournament is finished
    if (latestRoundMatches.length === 1) {
      await supabase
        .from("tournaments")
        .update({ status: "finished" })
        .eq("id", tournamentId);

      // Manually update the store to ensure UI updates immediately
      const { setCurrentTournament } = useStore.getState();
      const updatedTournament = await supabase
        .from("tournaments")
        .select("*")
        .eq("id", tournamentId)
        .single();

      if (updatedTournament.data) {
        setCurrentTournament(updatedTournament.data);
      }

      return;
    }

    // Create next round matches
    const winners = latestRoundMatches.map((m) => m.winner_id).filter(Boolean);
    const nextRound = latestRound + 1;

    for (let i = 0; i < winners.length; i += 2) {
      if (i + 1 < winners.length) {
        const randomPrompt = getRandomPrompt();

        await supabase.from("matches").insert({
          tournament_id: tournamentId,
          round: nextRound,
          player1_id: winners[i],
          player2_id: winners[i + 1],
          prompt: randomPrompt,
        });
      }
    }
  }

  /**
   * Subscribe to tournament updates with fallback polling
   */
  static subscribeToTournamentUpdates(tournamentId: string) {
    const { setCurrentTournament, setParticipants, setMatches } =
      useStore.getState();

    let isSubscribed = true;
    let pollInterval: NodeJS.Timeout;

    // Fallback polling mechanism
    const startPolling = () => {
      pollInterval = setInterval(async () => {
        if (!isSubscribed) return;

        try {
          const participants =
            await TournamentService.getTournamentParticipants(tournamentId);
          const currentParticipants = useStore.getState().participants;

          // Only update if participants have changed
          if (
            JSON.stringify(participants) !== JSON.stringify(currentParticipants)
          ) {
            setParticipants(participants);
          }
        } catch (error) {
          console.error("Error polling participants:", error);
        }
      }, 2000); // Poll every 2 seconds
    };

    // Subscribe to tournament changes
    const tournamentSubscription = supabase
      .channel(`tournament-${tournamentId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tournaments",
          filter: `id=eq.${tournamentId}`,
        },
        async (payload) => {
          if (payload.new) {
            const newTournament = payload.new as Tournament;
            setCurrentTournament(newTournament);

            // If tournament started, also load the matches
            if (newTournament.status === "in_progress") {
              try {
                const matches = await TournamentService.getTournamentMatches(
                  tournamentId
                );
                setMatches(matches);
              } catch (error) {
                console.error(
                  "Error loading matches after tournament start:",
                  error
                );
              }
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tournament_participants",
          filter: `tournament_id=eq.${tournamentId}`,
        },
        async (payload) => {
          try {
            const participants =
              await TournamentService.getTournamentParticipants(tournamentId);
            setParticipants(participants);
          } catch (error) {
            console.error(
              "Error fetching participants:",
              error,
              "Payload: ",
              payload
            );
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "matches",
          filter: `tournament_id=eq.${tournamentId}`,
        },
        async (payload) => {
          try {
            const matches = await TournamentService.getTournamentMatches(
              tournamentId
            );
            setMatches(matches);
          } catch (error) {
            console.error(
              "Error fetching matches:",
              error,
              "Payload: ",
              payload
            );
          }
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          startPolling();
        }
      });

    // Start polling as backup (will be cleared if real-time works)
    setTimeout(() => {
      if (isSubscribed) {
        startPolling();
      }
    }, 5000); // Start polling after 5 seconds if no real-time updates

    // Also poll tournament status specifically to ensure view changes work
    const tournamentStatusInterval = setInterval(async () => {
      if (!isSubscribed) return;

      try {
        const currentTournament =
          await TournamentService.getCurrentTournament();
        const storeCurrentTournament = useStore.getState().currentTournament;

        // Only update if tournament status has changed
        if (
          currentTournament &&
          storeCurrentTournament &&
          currentTournament.status !== storeCurrentTournament.status
        ) {
          setCurrentTournament(currentTournament);

          // If tournament started, load matches
          if (currentTournament.status === "in_progress") {
            const matches = await TournamentService.getTournamentMatches(
              currentTournament.id
            );
            setMatches(matches);
          }
        }
      } catch (error) {
        console.error("Error polling tournament status:", error);
      }
    }, 3000); // Poll tournament status every 3 seconds

    return () => {
      isSubscribed = false;
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      if (tournamentStatusInterval) {
        clearInterval(tournamentStatusInterval);
      }
      supabase.removeChannel(tournamentSubscription);
    };
  }
}
