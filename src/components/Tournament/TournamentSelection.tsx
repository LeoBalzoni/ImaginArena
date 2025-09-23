import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Plus, Play, Clock, Trophy } from "lucide-react";
import {
  Button,
  Card,
  Container,
  DarkAwareHeading,
  DarkAwareText,
  LoadingSpinner,
} from "../ui";
import { TournamentService } from "../../services/tournamentService";
import { useStore } from "../../store/useStore";
import type { Tournament } from "../../lib/supabase";

interface TournamentSelectionProps {
  onTournamentSelected: (tournament: Tournament) => void;
}

export const TournamentSelection: React.FC<TournamentSelectionProps> = ({
  onTournamentSelected,
}) => {
  const { user } = useStore();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [participantCounts, setParticipantCounts] = useState<
    Record<string, number>
  >({});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState<string | null>(null);

  const loadTournaments = async () => {
    try {
      const availableTournaments =
        await TournamentService.getAvailableTournaments();
      setTournaments(availableTournaments);

      // Load participant counts for each tournament
      const counts: Record<string, number> = {};
      for (const tournament of availableTournaments) {
        const participants = await TournamentService.getTournamentParticipants(
          tournament.id
        );
        counts[tournament.id] = participants.length;
      }
      setParticipantCounts(counts);
    } catch (error) {
      console.error("Error loading tournaments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTournaments();
  }, []);

  const handleCreateTournament = async (size: 2 | 4 | 8 | 16 | 32) => {
    if (!user) return;

    setCreating(true);
    try {
      const tournament = await TournamentService.createTournament(
        size,
        user.id
      );
      await TournamentService.joinTournament(tournament.id, user.id);
      onTournamentSelected(tournament);
    } catch (error) {
      console.error("Error creating tournament:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleJoinTournament = async (tournament: Tournament) => {
    if (!user) return;

    setJoining(tournament.id);
    try {
      await TournamentService.joinTournament(tournament.id, user.id);
      onTournamentSelected(tournament);
    } catch (error) {
      console.error("Error joining tournament:", error);
    } finally {
      setJoining(null);
    }
  };

  const getTournamentSizeIcon = (size: number) => {
    switch (size) {
      case 2:
        return "🥊";
      case 4:
        return "🏆";
      case 8:
        return "🎯";
      case 16:
        return "🏟️";
      case 32:
        return "🌟";
      default:
        return "🎮";
    }
  };

  if (loading) {
    return (
      <Container className="py-8">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <DarkAwareText className="mt-4">Loading tournaments...</DarkAwareText>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <div className="text-center mb-8">
        <DarkAwareHeading level={1} className="text-4xl font-bold mb-4">
          Choose Your Tournament
        </DarkAwareHeading>
        <DarkAwareText className="text-lg text-textcolor-secondary">
          Join an existing tournament or create a new one
        </DarkAwareText>
      </div>

      {/* Create New Tournament Section */}
      {user?.is_admin && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="p-6">
            <DarkAwareHeading
              onDark={true}
              level={2}
              className="text-xl font-semibold mb-4 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create New Tournament (Admin)
            </DarkAwareHeading>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[2, 4, 8, 16, 32].map((size) => (
                <Button
                  key={size}
                  variant="outline"
                  onClick={() =>
                    handleCreateTournament(size as 2 | 4 | 8 | 16 | 32)
                  }
                  disabled={creating}
                  className="flex flex-col items-center gap-2 h-auto py-4"
                >
                  <span className="text-2xl">
                    {getTournamentSizeIcon(size)}
                  </span>
                  <span className="font-semibold">{size} Players</span>
                </Button>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Available Tournaments */}
      <div className="space-y-4">
        <DarkAwareHeading level={2} className="text-2xl font-semibold mb-4">
          Available Tournaments
        </DarkAwareHeading>

        {tournaments.length === 0 ? (
          <Card className="p-8 text-center">
            <Trophy className="w-12 h-12 text-textcolor-secondary mx-auto mb-4" />
            <DarkAwareHeading
              onDark={true}
              level={3}
              className="text-xl font-semibold mb-2"
            >
              No tournaments available
            </DarkAwareHeading>
            <DarkAwareText className="text-textcolor-secondary">
              {user?.is_admin
                ? "Create a new tournament to get started!"
                : "Wait for an admin to create a tournament."}
            </DarkAwareText>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tournaments.map((tournament) => {
              const participantCount = participantCounts[tournament.id] || 0;
              const isFull = participantCount >= tournament.tournament_size;
              const isJoining = joining === tournament.id;

              return (
                <motion.div
                  key={tournament.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className={`p-6 ${isFull ? "opacity-75" : ""}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">
                          {getTournamentSizeIcon(tournament.tournament_size)}
                        </span>
                        <div>
                          <DarkAwareHeading
                            level={3}
                            className="text-lg font-semibold"
                          >
                            {tournament.tournament_size}-Player Tournament
                          </DarkAwareHeading>
                          <div className="flex items-center gap-2 text-sm text-textcolor-secondary">
                            <Clock className="w-4 h-4" />
                            {new Date(
                              tournament.created_at
                            ).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-textcolor-secondary" />
                        <DarkAwareText className="text-sm">
                          {participantCount}/{tournament.tournament_size}{" "}
                          players
                        </DarkAwareText>
                      </div>
                      <div className="w-full max-w-24 bg-gray-200 rounded-full h-2 ml-4">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${
                              (participantCount / tournament.tournament_size) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    <Button
                      onClick={() => handleJoinTournament(tournament)}
                      disabled={isFull || isJoining}
                      className="w-full"
                      variant={isFull ? "ghost" : "primary"}
                    >
                      {isJoining ? (
                        <>
                          <LoadingSpinner size="sm" />
                          Joining...
                        </>
                      ) : isFull ? (
                        "Tournament Full"
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Join Tournament
                        </>
                      )}
                    </Button>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </Container>
  );
};
