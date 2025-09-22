import { supabase } from "../lib/supabase";
import { TournamentService } from "./tournamentService";

export class AdminService {
  /**
   * Check if current user is admin
   */
  static async isCurrentUserAdmin(): Promise<boolean> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return false;

      const { data: user } = await supabase
        .from("users")
        .select("is_admin")
        .eq("id", session.user.id)
        .single();

      return user?.is_admin || false;
    } catch (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
  }

  /**
   * Get all tournaments with participant counts
   */
  static async getAllTournaments() {
    try {
      // Add a timestamp to prevent caching issues
      const { data: tournaments, error } = await supabase
        .from("tournaments")
        .select(
          `
          *,
          tournament_participants(count)
        `
        )
        .order("created_at", { ascending: false })
        .limit(1000); // Add limit to ensure fresh query

      if (error) throw error;

      // Transform the data to include participant count
      return (
        tournaments?.map((tournament) => ({
          ...tournament,
          participant_count:
            tournament.tournament_participants?.[0]?.count || 0,
        })) || []
      );
    } catch (error) {
      console.error("Error fetching all tournaments:", error);
      throw error;
    }
  }

  /**
   * Get tournament details with participants and matches
   */
  static async getTournamentDetails(tournamentId: string) {
    try {
      const [tournamentResult, participantsResult, matchesResult] =
        await Promise.all([
          // Get tournament info
          supabase
            .from("tournaments")
            .select("*")
            .eq("id", tournamentId)
            .single(),

          // Get participants
          supabase
            .from("tournament_participants")
            .select(
              `
            *,
            users(id, username, created_at)
          `
            )
            .eq("tournament_id", tournamentId),

          // Get matches
          supabase
            .from("matches")
            .select(
              `
            *,
            player1:users!matches_player1_id_fkey(id, username),
            player2:users!matches_player2_id_fkey(id, username),
            winner:users!matches_winner_id_fkey(id, username)
          `
            )
            .eq("tournament_id", tournamentId)
            .order("round", { ascending: true }),
        ]);

      if (tournamentResult.error) throw tournamentResult.error;
      if (participantsResult.error) throw participantsResult.error;
      if (matchesResult.error) throw matchesResult.error;

      return {
        tournament: tournamentResult.data,
        participants: participantsResult.data,
        matches: matchesResult.data,
      };
    } catch (error) {
      console.error("Error fetching tournament details:", error);
      throw error;
    }
  }

  /**
   * Delete a tournament (admin only)
   */
  static async deleteTournament(tournamentId: string) {
    try {
      // Check if user is admin
      const isAdmin = await AdminService.isCurrentUserAdmin();
      if (!isAdmin) {
        throw new Error("Unauthorized: Admin access required");
      }

      // First, verify the tournament exists
      const { data: existingTournament, error: checkError } = await supabase
        .from("tournaments")
        .select("id, status")
        .eq("id", tournamentId)
        .single();

      if (checkError) {
        console.error(
          "AdminService: Error checking tournament existence:",
          checkError
        );
        throw checkError;
      }

      if (!existingTournament) {
        throw new Error("Tournament not found");
      }

      // Delete the tournament
      const { error } = await supabase
        .from("tournaments")
        .delete()
        .eq("id", tournamentId)
        .select(); // This will return the deleted rows

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error("Error deleting tournament:", error);
      throw error;
    }
  }

  /**
   * Force finish a tournament (admin only)
   */
  static async forceFinishTournament(tournamentId: string) {
    try {
      // Check if user is admin
      const isAdmin = await AdminService.isCurrentUserAdmin();
      if (!isAdmin) {
        throw new Error("Unauthorized: Admin access required");
      }

      const { error } = await supabase
        .from("tournaments")
        .update({ status: "finished" })
        .eq("id", tournamentId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error("Error force finishing tournament:", error);
      throw error;
    }
  }

  /**
   * Reset tournament to lobby (admin only)
   */
  static async resetTournamentToLobby(tournamentId: string) {
    try {
      // Check if user is admin
      const isAdmin = await AdminService.isCurrentUserAdmin();
      if (!isAdmin) {
        throw new Error("Unauthorized: Admin access required");
      }

      // Reset tournament status and clear matches
      const { error: tournamentError } = await supabase
        .from("tournaments")
        .update({ status: "lobby" })
        .eq("id", tournamentId);

      if (tournamentError) throw tournamentError;

      // Delete all matches for this tournament
      const { error: matchesError } = await supabase
        .from("matches")
        .delete()
        .eq("tournament_id", tournamentId);

      if (matchesError) throw matchesError;

      return { success: true };
    } catch (error) {
      console.error("Error resetting tournament:", error);
      throw error;
    }
  }

  /**
   * Get all users (admin only)
   */
  static async getAllUsers() {
    try {
      // Check if user is admin
      const isAdmin = await AdminService.isCurrentUserAdmin();
      if (!isAdmin) {
        throw new Error("Unauthorized: Admin access required");
      }

      const { data: users, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return users;
    } catch (error) {
      console.error("Error fetching all users:", error);
      throw error;
    }
  }

  /**
   * Toggle admin status for a user (admin only)
   */
  static async toggleUserAdminStatus(userId: string, isAdmin: boolean) {
    try {
      // Check if current user is admin
      const currentUserIsAdmin = await AdminService.isCurrentUserAdmin();
      if (!currentUserIsAdmin) {
        throw new Error("Unauthorized: Admin access required");
      }

      const { error } = await supabase
        .from("users")
        .update({ is_admin: isAdmin })
        .eq("id", userId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error("Error updating user admin status:", error);
      throw error;
    }
  }

  /**
   * Assign match winner (admin only) - for debugging/testing purposes
   */
  static async assignMatchWinner(matchId: string, winnerId: string) {
    try {
      // Check if user is admin
      const isAdmin = await AdminService.isCurrentUserAdmin();
      if (!isAdmin) {
        throw new Error("Unauthorized: Admin access required");
      }

      // Verify the match exists and get match details
      const { data: match, error: matchError } = await supabase
        .from("matches")
        .select("id, player1_id, player2_id, winner_id, tournament_id")
        .eq("id", matchId)
        .single();

      if (matchError) throw matchError;
      if (!match) throw new Error("Match not found");

      // Verify the winner is one of the participants
      if (winnerId !== match.player1_id && winnerId !== match.player2_id) {
        throw new Error("Winner must be one of the match participants");
      }

      // Check if match is already finished
      if (match.winner_id) {
        throw new Error("Match already has a winner");
      }

      // Update match with winner
      const { error: updateError } = await supabase
        .from("matches")
        .update({ winner_id: winnerId })
        .eq("id", matchId);

      if (updateError) throw updateError;

      // Create next round matches if this completes a round
      try {
        await TournamentService.createNextRoundMatches(match.tournament_id);
      } catch (nextRoundError) {
        console.error("Error creating next round matches:", nextRoundError);
        // Don't throw here - the winner assignment was successful
      }

      return { success: true, winnerId };
    } catch (error) {
      console.error("Error assigning match winner:", error);
      throw error;
    }
  }

  /**
   * Delete a user (admin only)
   */
  static async deleteUser(userId: string) {
    try {
      // Check if current user is admin
      const currentUserIsAdmin = await AdminService.isCurrentUserAdmin();
      if (!currentUserIsAdmin) {
        throw new Error("Unauthorized: Admin access required");
      }

      // Get current user to prevent self-deletion
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user?.id === userId) {
        throw new Error("Cannot delete your own account");
      }

      // First, verify the user exists
      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("id, username, is_admin")
        .eq("id", userId)
        .single();

      if (checkError) {
        throw checkError;
      }

      if (!existingUser) {
        throw new Error("User not found");
      }

      // Prevent deletion of other admin users for safety
      if (existingUser.is_admin) {
        throw new Error(
          "Cannot delete admin users. Remove admin privileges first."
        );
      }

      // Delete the user from the users table
      // Note: This will not delete the user from auth.users, only from our users table
      const { error } = await supabase.from("users").delete().eq("id", userId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }
}
