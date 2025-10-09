import { supabase } from "../lib/supabase";
import type { Tournament, Match, User } from "../lib/supabase";
import { useStore } from "../store/useStore";
import { getRandomPromptIndex } from "../data/prompts";
import { BotService } from "./botService";

export class TournamentService {
  /**
   * Create a new tournament
   */
  static async createTournament(
    tournamentSize: 2 | 4 | 8 | 16 | 32 = 16,
    createdBy?: string
  ): Promise<Tournament> {
    const { data, error } = await supabase
      .from("tournaments")
      .insert({
        status: "lobby",
        tournament_size: tournamentSize,
        created_by: createdBy,
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
   * Get all available tournaments (lobby status)
   */
  static async getAvailableTournaments(): Promise<Tournament[]> {
    const { data, error } = await supabase
      .from("tournaments")
      .select("*")
      .eq("status", "lobby")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
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
   * Fill tournament with bots to reach target size - Admin only
   */
  static async fillTournamentWithBots(tournamentId: string): Promise<void> {
    // Get tournament info
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .select("*")
      .eq("id", tournamentId)
      .single();

    if (tournamentError) throw tournamentError;
    if (!tournament) throw new Error("Tournament not found");

    // Get current participants
    const participants = await this.getTournamentParticipants(tournamentId);

    if (participants.length >= tournament.tournament_size) {
      throw new Error("Tournament is already full");
    }

    // Fill with bots
    await BotService.fillTournamentWithBots(
      tournamentId,
      participants.length,
      tournament.tournament_size
    );

    // Update participants in store
    const { setParticipants } = useStore.getState();
    const updatedParticipants = await this.getTournamentParticipants(
      tournamentId
    );
    setParticipants(updatedParticipants);

    return;
  }

  /**
   * Start tournament (create matches) - Admin only
   */
  static async startTournament(
    tournamentId: string,
    fillWithBots: boolean = false
  ): Promise<void> {
    // Get tournament info
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .select("*")
      .eq("id", tournamentId)
      .single();

    if (tournamentError) throw tournamentError;
    if (!tournament) throw new Error("Tournament not found");

    // Get participants
    let participants = await this.getTournamentParticipants(tournamentId);

    if (participants.length < 2) {
      throw new Error("Tournament needs at least 2 participants to start");
    }

    // If fillWithBots is true and we don't have enough participants, fill with bots
    if (fillWithBots && participants.length < tournament.tournament_size) {
      await this.fillTournamentWithBots(tournamentId);
      participants = await this.getTournamentParticipants(tournamentId);
    }

    // Check if we have the right number of participants for the tournament size
    if (participants.length !== tournament.tournament_size) {
      throw new Error(
        `Tournament requires exactly ${
          tournament.tournament_size
        } participants, but has ${participants.length}. ${
          !fillWithBots
            ? "Enable 'Fill with Bots' to start with fewer players."
            : ""
        }`
      );
    }

    // Shuffle participants for random matchups
    const shuffledParticipants = [...participants].sort(
      () => Math.random() - 0.5
    );

    // Create first round matches with prompt indices
    const numMatches = shuffledParticipants.length / 2;
    for (let i = 0; i < numMatches; i++) {
      const player1 = shuffledParticipants[i * 2];
      const player2 = shuffledParticipants[i * 2 + 1];
      const promptIndex = getRandomPromptIndex();

      const { error: matchError } = await supabase.from("matches").insert({
        tournament_id: tournamentId,
        round: 1,
        player1_id: player1.id,
        player2_id: player2.id,
        prompt_index: promptIndex,
      });

      if (matchError) throw matchError;
    }

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

    // If only one winner left, tournament final is complete but don't auto-finish
    // Admin will manually end the tournament from the winner screen
    if (latestRoundMatches.length === 1) {
      // Tournament stays in "in_progress" status until admin manually ends it
      return;
    }

    // Create next round matches
    const winners = latestRoundMatches.map((m) => m.winner_id).filter(Boolean);
    const nextRound = latestRound + 1;

    for (let i = 0; i < winners.length; i += 2) {
      if (i + 1 < winners.length) {
        const promptIndex = getRandomPromptIndex();

        await supabase.from("matches").insert({
          tournament_id: tournamentId,
          round: nextRound,
          player1_id: winners[i],
          player2_id: winners[i + 1],
          prompt_index: promptIndex,
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

  /**
   * End tournament manually (Admin only)
   */
  static async endTournament(tournamentId: string): Promise<void> {
    const { error } = await supabase
      .from("tournaments")
      .update({
        status: "finished",
        admin_ended: true,
      })
      .eq("id", tournamentId);

    if (error) throw error;

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
  }

  /**
   * Toggle anonymous voting for tournament (Admin only)
   */
  static async toggleAnonymousVoting(
    tournamentId: string,
    anonymousVoting: boolean
  ): Promise<void> {
    const { error } = await supabase
      .from("tournaments")
      .update({
        anonymous_voting: anonymousVoting,
      })
      .eq("id", tournamentId);

    if (error) throw error;

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
  }
}
