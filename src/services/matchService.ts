import { supabase } from "../lib/supabase";
import type { Match, Submission, Vote } from "../lib/supabase";
import { useStore } from "../store/useStore";

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
  static async calculateMatchWinner(matchId: string): Promise<string | null> {
    const submissions = await this.getMatchSubmissions(matchId);
    const votes = await this.getMatchVotes(matchId);

    if (submissions.length !== 2) {
      throw new Error(
        "Match must have exactly 2 submissions to calculate winner"
      );
    }

    // Count votes for each submission
    const voteCount = submissions.reduce((acc, submission) => {
      acc[submission.id] = votes.filter(
        (v) => v.voted_for_submission_id === submission.id
      ).length;
      return acc;
    }, {} as Record<string, number>);

    // Find winner (submission with most votes)
    const winningSubmissionId = Object.entries(voteCount).reduce((a, b) =>
      voteCount[a[0]] > voteCount[b[0]] ? a : b
    )[0];

    const winningSubmission = submissions.find(
      (s) => s.id === winningSubmissionId
    );
    if (!winningSubmission) return null;

    // Update match with winner
    const { error } = await supabase
      .from("matches")
      .update({ winner_id: winningSubmission.user_id })
      .eq("id", matchId);

    if (error) throw error;

    return winningSubmission.user_id;
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
    let submissionsInterval: NodeJS.Timeout;
    let votesInterval: NodeJS.Timeout;

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
            setCurrentMatch(payload.new as Match);
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
          startSubmissionsPolling();
          startVotesPolling();
        }
      });

    // Start polling as backup after 5 seconds if no real-time updates
    setTimeout(() => {
      if (isSubscribed) {
        startSubmissionsPolling();
        startVotesPolling();
      }
    }, 5000);

    return () => {
      isSubscribed = false;
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
