import { supabase } from "../lib/supabase";
import type { Match, Submission, Vote } from "../lib/supabase";
import { useStore } from "../store/useStore";
import { getRandomPromptExcluding } from "../data/prompts";

export class MatchService {
  /**
   * Get match by ID
   */
  static async getMatch(matchId: string): Promise<Match | null> {
    const { data, error } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Submit image for a match
   */
  static async submitImage(
    matchId: string,
    userId: string,
    imageFile: File
  ): Promise<Submission> {
    // Upload image to Supabase Storage
    const fileExt = imageFile.name.split(".").pop();
    const fileName = `${matchId}-${userId}-${Date.now()}.${fileExt}`;
    const filePath = `submissions/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(filePath, imageFile);

    if (uploadError) throw uploadError;

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("images").getPublicUrl(filePath);

    // Save submission to database
    const { data, error } = await supabase
      .from("submissions")
      .insert({
        match_id: matchId,
        user_id: userId,
        image_url: publicUrl,
      })
      .select()
      .single();

    if (error) throw error;

    // Manually refresh submissions to ensure UI updates immediately
    const { setSubmissions } = useStore.getState();
    const submissions = await this.getMatchSubmissions(matchId);
    setSubmissions(submissions);

    // console.log("Image submitted successfully:", {
    //   submissionId: data.id,
    //   matchId,
    //   userId,
    //   totalSubmissions: submissions.length,
    // });

    // Force refresh after a delay as backup
    setTimeout(async () => {
      try {
        const updatedSubmissions = await this.getMatchSubmissions(matchId);
        setSubmissions(updatedSubmissions);
      } catch (error) {
        console.error("Error force refreshing submissions:", error);
      }
    }, 1000);

    return data;
  }

  /**
   * Get match submissions
   */
  static async getMatchSubmissions(matchId: string): Promise<Submission[]> {
    const { data, error } = await supabase
      .from("submissions")
      .select("*")
      .eq("match_id", matchId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Vote for a submission
   */
  static async voteForSubmission(
    matchId: string,
    voterId: string,
    submissionId: string
  ): Promise<Vote> {
    const { data, error } = await supabase
      .from("votes")
      .insert({
        match_id: matchId,
        voter_id: voterId,
        voted_for_submission_id: submissionId,
      })
      .select()
      .single();

    if (error) throw error;

    // Manually refresh votes to ensure UI updates immediately
    const { setVotes } = useStore.getState();
    const votes = await this.getMatchVotes(matchId);
    setVotes(votes);

    // console.log("Vote submitted successfully:", {
    //   voteId: data.id,
    //   matchId,
    //   voterId,
    //   submissionId,
    //   totalVotes: votes.length,
    // });

    // Force refresh after a delay as backup
    setTimeout(async () => {
      try {
        const updatedVotes = await this.getMatchVotes(matchId);
        setVotes(updatedVotes);
      } catch (error) {
        console.error("Error force refreshing votes:", error);
      }
    }, 1000);

    return data;
  }

  /**
   * Get match votes
   */
  static async getMatchVotes(matchId: string): Promise<Vote[]> {
    const { data, error } = await supabase
      .from("votes")
      .select("*")
      .eq("match_id", matchId);

    if (error) throw error;
    return data || [];
  }

  /**
   * Calculate match winner and update match
   */
  static async calculateMatchWinner(
    matchId: string,
    forcedWinnerId?: string
  ): Promise<string | null> {
    const submissions = await this.getMatchSubmissions(matchId);
    const votes = await this.getMatchVotes(matchId);

    if (submissions.length !== 2) {
      throw new Error(
        "Match must have exactly 2 submissions to calculate winner"
      );
    }

    let winnerId: string;

    if (forcedWinnerId) {
      // Admin forced winner (from coin toss)
      winnerId = forcedWinnerId;
    } else {
      // Count votes for each submission
      const voteCount = submissions.reduce((acc, submission) => {
        acc[submission.id] = votes.filter(
          (v) => v.voted_for_submission_id === submission.id
        ).length;
        return acc;
      }, {} as Record<string, number>);

      // Find winner (submission with most votes)
      const sortedSubmissions = Object.entries(voteCount).sort(
        (a, b) => b[1] - a[1]
      );
      const topVotes = sortedSubmissions[0][1];
      const secondVotes = sortedSubmissions[1][1];

      // Check for tie
      if (topVotes === secondVotes) {
        return null; // Return null to indicate tie - UI will handle coin toss
      }

      const winningSubmissionId = sortedSubmissions[0][0];
      const winningSubmission = submissions.find(
        (s) => s.id === winningSubmissionId
      );
      if (!winningSubmission) return null;

      winnerId = winningSubmission.user_id;
    }

    // Update match with winner
    const { error } = await supabase
      .from("matches")
      .update({ winner_id: winnerId })
      .eq("id", matchId);

    if (error) throw error;

    // Force update the current match state to ensure immediate UI updates
    const { setCurrentMatch } = useStore.getState();
    const updatedMatch = await this.getMatch(matchId);
    if (updatedMatch) {
      setCurrentMatch(updatedMatch);
    }

    return winnerId;
  }

  /**
   * Update match prompt (admin only)
   */
  static async updateMatchPrompt(matchId: string): Promise<string> {
    // Get current match to avoid selecting the same prompt
    const currentMatch = await this.getMatch(matchId);
    if (!currentMatch) {
      throw new Error("Match not found");
    }

    // Get tournament to check language
    const { data: tournament } = await supabase
      .from("tournaments")
      .select("language")
      .eq("id", currentMatch.tournament_id)
      .single();

    const language = tournament?.language || "en";

    // Get a new random prompt that's different from the current one
    const newPrompt = getRandomPromptExcluding(currentMatch.prompt, language);

    // Update the match with the new prompt
    const { error } = await supabase
      .from("matches")
      .update({ prompt: newPrompt })
      .eq("id", matchId);

    if (error) throw error;

    // Force update the current match state to ensure immediate UI updates
    const { setCurrentMatch } = useStore.getState();
    const updatedMatch = await this.getMatch(matchId);
    if (updatedMatch) {
      setCurrentMatch(updatedMatch);
    }

    return newPrompt;
  }

  /**
   * End voting phase (admin only) - reveals results
   */
  static async endVoting(
    matchId: string
  ): Promise<{ winner: string | null; isTie: boolean }> {
    const submissions = await this.getMatchSubmissions(matchId);
    const votes = await this.getMatchVotes(matchId);

    if (submissions.length !== 2) {
      throw new Error("Match must have exactly 2 submissions to end voting");
    }

    // Count votes for each submission
    const voteCount = submissions.reduce((acc, submission) => {
      acc[submission.id] = votes.filter(
        (v) => v.voted_for_submission_id === submission.id
      ).length;
      return acc;
    }, {} as Record<string, number>);

    const sortedSubmissions = Object.entries(voteCount).sort(
      (a, b) => b[1] - a[1]
    );
    const topVotes = sortedSubmissions[0][1];
    const secondVotes = sortedSubmissions[1][1];

    // Check for tie
    if (topVotes === secondVotes) {
      return { winner: null, isTie: true };
    }

    // No tie - calculate winner normally
    const winner = await this.calculateMatchWinner(matchId);
    return { winner, isTie: false };
  }

  /**
   * Check if match is ready for voting (both submissions uploaded)
   */
  static async isMatchReadyForVoting(matchId: string): Promise<boolean> {
    const submissions = await this.getMatchSubmissions(matchId);
    return submissions.length === 2;
  }

  /**
   * Check if voting is complete for a match
   */
  static async isVotingComplete(
    matchId: string,
    totalParticipants: number
  ): Promise<boolean> {
    const votes = await this.getMatchVotes(matchId);
    // Voting is complete when we have votes from all non-competing participants
    // (total participants - 2 competitors)
    const requiredVotes = Math.max(1, totalParticipants - 2);
    return votes.length >= requiredVotes;
  }

  /**
   * Get user's current match (if they're a participant)
   */
  static async getUserCurrentMatch(
    userId: string,
    tournamentId: string
  ): Promise<Match | null> {
    const { data, error } = await supabase
      .from("matches")
      .select("*")
      .eq("tournament_id", tournamentId)
      .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
      .is("winner_id", null)
      .order("round", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  /**
   * Subscribe to match updates with fallback polling
   */
  static subscribeToMatchUpdates(matchId: string) {
    const { setCurrentMatch, setSubmissions, setVotes } = useStore.getState();

    console.log("Setting up real-time subscription for match:", matchId);

    let isSubscribed = true;
    let matchInterval: NodeJS.Timeout;
    let submissionsInterval: NodeJS.Timeout;
    let votesInterval: NodeJS.Timeout;

    // Fallback polling for match state
    const startMatchPolling = () => {
      matchInterval = setInterval(async () => {
        if (!isSubscribed) return;

        try {
          const currentMatch = await MatchService.getMatch(matchId);
          const storeMatch = useStore.getState().currentMatch;

          // Only update if match has changed (especially winner_id)
          if (
            currentMatch &&
            JSON.stringify(currentMatch) !== JSON.stringify(storeMatch)
          ) {
            setCurrentMatch(currentMatch);
          }
        } catch (error) {
          console.error("Error polling match:", error);
        }
      }, 1500); // Poll every 1.5 seconds for faster winner detection
    };

    // Fallback polling for submissions
    const startSubmissionsPolling = () => {
      submissionsInterval = setInterval(async () => {
        if (!isSubscribed) return;

        try {
          const submissions = await MatchService.getMatchSubmissions(matchId);
          const currentSubmissions = useStore.getState().submissions;

          // Only update if submissions have changed
          if (
            JSON.stringify(submissions) !== JSON.stringify(currentSubmissions)
          ) {
            setSubmissions(submissions);
          }
        } catch (error) {
          console.error("Error polling submissions:", error);
        }
      }, 2000); // Poll every 2 seconds
    };

    // Fallback polling for votes
    const startVotesPolling = () => {
      votesInterval = setInterval(async () => {
        if (!isSubscribed) return;

        try {
          const votes = await MatchService.getMatchVotes(matchId);
          const currentVotes = useStore.getState().votes;

          // Only update if votes have changed
          if (JSON.stringify(votes) !== JSON.stringify(currentVotes)) {
            setVotes(votes);
          }
        } catch (error) {
          console.error("Error polling votes:", error);
        }
      }, 2000); // Poll every 2 seconds
    };

    const matchSubscription = supabase
      .channel(`match-${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "matches",
          filter: `id=eq.${matchId}`,
        },
        async (payload) => {
          if (payload.new) {
            const updatedMatch = payload.new as Match;
            setCurrentMatch(updatedMatch);

            // Force a re-fetch of match data to ensure consistency
            if (updatedMatch.winner_id) {
              try {
                const [submissions, votes] = await Promise.all([
                  MatchService.getMatchSubmissions(matchId),
                  MatchService.getMatchVotes(matchId),
                ]);
                setSubmissions(submissions);
                setVotes(votes);
              } catch (error) {
                console.error(
                  "Error refreshing match data after winner update:",
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
          table: "submissions",
          filter: `match_id=eq.${matchId}`,
        },
        async (payload) => {
          try {
            const submissions = await MatchService.getMatchSubmissions(matchId);
            setSubmissions(submissions);
          } catch (error) {
            console.error(
              "Error fetching submissions:",
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
          table: "votes",
          filter: `match_id=eq.${matchId}`,
        },
        async (payload) => {
          try {
            const votes = await MatchService.getMatchVotes(matchId);
            setVotes(votes);
          } catch (error) {
            console.error("Error fetching votes:", error, "Payload: ", payload);
          }
        }
      )
      .subscribe((status) => {
        console.log("Match subscription status:", status);
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          startMatchPolling();
          startSubmissionsPolling();
          startVotesPolling();
        }
      });

    // Start polling as backup after 3 seconds if no real-time updates
    setTimeout(() => {
      if (isSubscribed) {
        startMatchPolling();
        startSubmissionsPolling();
        startVotesPolling();
      }
    }, 3000);

    return () => {
      isSubscribed = false;
      if (matchInterval) {
        clearInterval(matchInterval);
      }
      if (submissionsInterval) {
        clearInterval(submissionsInterval);
      }
      if (votesInterval) {
        clearInterval(votesInterval);
      }
      supabase.removeChannel(matchSubscription);
    };
  }
}
