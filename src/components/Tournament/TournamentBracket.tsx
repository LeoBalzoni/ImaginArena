import React, { useEffect } from "react";
import { Trophy, Users, Crown, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../../store/useStore";
import { TournamentService } from "../../services/tournamentService";
import { BotService } from "../../services/botService";
import { Button, Card, Container, Heading, Text, LoadingSpinner } from "../ui";
import type { Match, User } from "../../lib/supabase";

interface BracketMatchProps {
  match: Match | null;
  participants: User[];
  isActive?: boolean;
  onClick?: () => void;
}

const BracketMatch: React.FC<BracketMatchProps> = ({
  match,
  participants,
  isActive,
  onClick,
}) => {
  if (!match) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-4 min-h-[100px] flex items-center justify-center"
      >
        <Text variant="small" color="secondary" className="font-medium">
          TBD
        </Text>
      </motion.div>
    );
  }

  const player1 = participants.find((p) => p.id === match.player1_id);
  const player2 = participants.find((p) => p.id === match.player2_id);
  const winner = match.winner_id
    ? participants.find((p) => p.id === match.winner_id)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        border-2 rounded-2xl p-4 cursor-pointer transition-all duration-200 min-h-[100px] w-full max-w-[280px]
        ${
          isActive
            ? "border-primary shadow-glow bg-primary-50"
            : winner
            ? "border-accent shadow-glow-accent bg-accent-50"
            : "border-gray-300 bg-white hover:border-gray-400 hover:shadow-card"
        }
      `}
      onClick={onClick}
    >
      <div className="space-y-3">
        <motion.div
          className={`flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
            winner?.id === player1?.id
              ? "bg-gradient-to-r from-accent-100 to-accent-200 shadow-sm"
              : "bg-gray-50 hover:bg-gray-100"
          }`}
        >
          <Text
            variant="small"
            className={`truncate font-medium ${
              winner?.id === player1?.id
                ? "text-accent-800"
                : "text-textcolor-primary"
            }`}
          >
            {player1 ? BotService.getBotDisplayName(player1) : "Player 1"}
          </Text>
          {winner?.id === player1?.id && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Crown className="w-4 h-4 text-accent-600" />
            </motion.div>
          )}
        </motion.div>

        <div className="flex items-center justify-center">
          <div className="w-8 h-0.5 bg-gray-300 rounded-full" />
          <Text variant="caption" color="secondary" className="mx-2 font-bold">
            VS
          </Text>
          <div className="w-8 h-0.5 bg-gray-300 rounded-full" />
        </div>

        <motion.div
          className={`flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
            winner?.id === player2?.id
              ? "bg-gradient-to-r from-accent-100 to-accent-200 shadow-sm"
              : "bg-gray-50 hover:bg-gray-100"
          }`}
        >
          <Text
            variant="small"
            className={`truncate font-medium ${
              winner?.id === player2?.id
                ? "text-accent-800"
                : "text-textcolor-primary"
            }`}
          >
            {player2 ? BotService.getBotDisplayName(player2) : "Player 2"}
          </Text>
          {winner?.id === player2?.id && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Crown className="w-4 h-4 text-accent-600" />
            </motion.div>
          )}
        </motion.div>
      </div>

      {!winner && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center mt-3 px-3 py-2 bg-secondary-50 rounded-xl"
        >
          <Zap className="w-3 h-3 text-secondary mr-2" />
          <Text variant="caption" className="text-secondary font-medium">
            In Progress
          </Text>
        </motion.div>
      )}
    </motion.div>
  );
};

export const TournamentBracket: React.FC = () => {
  const {
    currentTournament,
    matches,
    participants,
    setMatches,
    setCurrentMatch,
    setCurrentView,
  } = useStore();

  useEffect(() => {
    if (currentTournament) {
      loadMatches();
    }
  }, [currentTournament]);

  const loadMatches = async () => {
    if (!currentTournament) return;

    try {
      const tournamentMatches = await TournamentService.getTournamentMatches(
        currentTournament.id
      );
      setMatches(tournamentMatches);
    } catch (error) {
      console.error("Failed to load matches:", error);
    }
  };

  const handleMatchClick = (match: Match) => {
    setCurrentMatch(match);
    setCurrentView("match");
  };

  const getMatchesByRound = (round: number): Match[] => {
    return matches.filter((m) => m.round === round);
  };

  const getRoundName = (round: number, matchCount: number): string => {
    switch (matchCount) {
      case 8:
        return "Round 1";
      case 4:
        return "Quarterfinals";
      case 2:
        return "Semifinals";
      case 1:
        return "Final";
      default:
        return `Round ${round}`;
    }
  };

  const renderRound = (round: number) => {
    const roundMatches = getMatchesByRound(round);
    if (roundMatches.length === 0) return null;

    return (
      <motion.div
        key={round}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: round * 0.1, duration: 0.5 }}
        className="flex flex-col items-center min-w-[300px]"
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: round * 0.1 + 0.2 }}
          className="mb-6"
        >
          <div
            className={`
            px-6 py-3 rounded-2xl shadow-sm text-center
            ${
              round === 1
                ? "bg-gradient-to-r from-primary-100 to-primary-200 text-primary-800"
                : ""
            }
            ${
              round === 2
                ? "bg-gradient-to-r from-secondary-100 to-secondary-200 text-secondary-800"
                : ""
            }
            ${
              round === 3
                ? "bg-gradient-to-r from-accent-100 to-accent-200 text-accent-800"
                : ""
            }
            ${
              round === 4
                ? "bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800"
                : ""
            }
          `}
          >
            <Heading
              level={4}
              className={`
              ${round === 1 ? "text-primary-800" : ""}
              ${round === 2 ? "text-secondary-800" : ""}
              ${round === 3 ? "text-accent-800" : ""}
              ${round === 4 ? "text-yellow-800" : ""}
            `}
            >
              {getRoundName(round, roundMatches.length)}
            </Heading>
          </div>
        </motion.div>
        <div className="space-y-6 flex flex-col items-center">
          {roundMatches.map((match, index) => (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: round * 0.1 + 0.3 + index * 0.1 }}
            >
              <BracketMatch
                match={match}
                participants={participants}
                onClick={() => handleMatchClick(match)}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  };

  const champion =
    currentTournament?.status === "finished"
      ? (() => {
          const finalMatch = matches.find(
            (m) => m.round === Math.max(...matches.map((m) => m.round))
          );
          return finalMatch?.winner_id
            ? participants.find((p) => p.id === finalMatch.winner_id)
            : null;
        })()
      : null;

  if (!currentTournament) {
    return (
      <Container className="py-12">
        <div className="text-center">
          <LoadingSpinner size="lg" text="No active tournament" />
        </div>
      </Container>
    );
  }

  return (
    <Container size="xl" className="py-6 sm:py-8 lg:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8 sm:mb-12"
      >
        <motion.div
          initial={{ scale: 0.8, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-3xl shadow-glow mb-6"
        >
          <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
        </motion.div>
        <Heading level={1} className="mb-3">
          Tournament Bracket
        </Heading>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-textcolor-secondary" />
            <Text variant="body" color="secondary">
              {participants.length} Players
            </Text>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-textcolor-secondary" />
            <Text variant="body" color="secondary" className="capitalize">
              {currentTournament.status}
            </Text>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {champion && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -50 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="mb-8 sm:mb-12"
          >
            <Card className="text-center gradient-primary text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
              <div className="relative z-10">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Trophy className="w-16 h-16 sm:w-20 sm:h-20 text-white mx-auto mb-4" />
                </motion.div>
                <Heading level={2} className="text-white mb-2">
                  🎉 Tournament Champion! 🎉
                </Heading>
                <Text className="text-xl sm:text-2xl font-bold text-white">
                  {BotService.getBotDisplayName(champion)}
                </Text>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <div className="flex gap-6 sm:gap-8 lg:gap-12 min-w-max pb-4 px-4">
            {[1, 2, 3, 4].map((round) => renderRound(round)).filter(Boolean)}
          </div>
        </div>
      </Card>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-8 text-center"
      >
        <Button
          variant="secondary"
          size="lg"
          onClick={() => setCurrentView("lobby")}
          className="w-full sm:w-auto"
        >
          Back to Lobby
        </Button>
      </motion.div>
    </Container>
  );
};
