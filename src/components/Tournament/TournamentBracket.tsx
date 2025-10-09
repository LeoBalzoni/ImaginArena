import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ChevronLeft,
  ChevronRight,
  Crown,
  RefreshCw,
  Trophy,
  Users,
  Vote,
  Zap,
  Eye,
  EyeOff,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "../../store/useStore";
import { TournamentService } from "../../services/tournamentService";
import { BotService } from "../../services/botService";
import { MatchService } from "../../services/matchService";
import {
  Card,
  Container,
  DarkAwareText,
  Heading,
  LoadingSpinner,
  Text,
} from "../ui";
import type { Match, Submission, User } from "../../lib/supabase";

interface BracketMatchProps {
  match: Match | null;
  participants: User[];
  isActive?: boolean;
  onClick?: () => void;
  matchSubmissions?: Submission[];
}

const BracketMatch: React.FC<BracketMatchProps> = ({
  match,
  participants,
  isActive,
  onClick,
  matchSubmissions = [],
}) => {
  const { t } = useTranslation();
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

  // Check if match is in voting phase (both submissions exist but no winner)
  const isVotingOpen = !winner && matchSubmissions.length === 2;

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
          className={`flex items-center justify-center mt-3 px-3 py-2 rounded-xl ${
            isVotingOpen ? "bg-accent-50" : "bg-secondary-50"
          }`}
        >
          {isVotingOpen ? (
            <Vote className="w-3 h-3 text-accent-600 mr-2" />
          ) : (
            <Zap className="w-3 h-3 text-secondary mr-2" />
          )}
          <Text
            variant="caption"
            className={`font-medium ${
              isVotingOpen ? "text-accent-600" : "text-secondary"
            }`}
          >
            {isVotingOpen ? t("match.votingPhase") : t("tournament.inProgress")}
          </Text>
        </motion.div>
      )}
    </motion.div>
  );
};

export const TournamentBracket: React.FC = () => {
  const { t } = useTranslation();
  const {
    currentTournament,
    matches,
    participants,
    setMatches,
    setCurrentMatch,
    setCurrentView,
  } = useStore();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTogglingAnonymous, setIsTogglingAnonymous] = useState(false);
  const [allSubmissions, setAllSubmissions] = useState<
    Record<string, Submission[]>
  >({});

  useEffect(() => {
    if (currentTournament) {
      loadMatches();
    }
  }, [currentTournament]);

  useEffect(() => {
    // Delay to ensure DOM is fully rendered
    const timeoutId = setTimeout(() => {
      checkScrollIndicators();
    }, 100);

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScrollIndicators);
      window.addEventListener("resize", checkScrollIndicators);
      return () => {
        clearTimeout(timeoutId);
        container.removeEventListener("scroll", checkScrollIndicators);
        window.removeEventListener("resize", checkScrollIndicators);
      };
    }
  }, [matches]);

  const checkScrollIndicators = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const hasScrollableContent = scrollWidth > clientWidth;

    setShowLeftScroll(hasScrollableContent && scrollLeft > 10);
    setShowRightScroll(
      hasScrollableContent && scrollLeft < scrollWidth - clientWidth - 10
    );
  };

  const scrollToDirection = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 400;
    const targetScroll =
      direction === "left"
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: targetScroll,
      behavior: "smooth",
    });
  };

  const loadMatches = async () => {
    if (!currentTournament) return;

    try {
      const tournamentMatches = await TournamentService.getTournamentMatches(
        currentTournament.id
      );
      setMatches(tournamentMatches);

      // Load submissions for all matches
      const submissionsMap: Record<string, Submission[]> = {};
      await Promise.all(
        tournamentMatches.map(async (match) => {
          submissionsMap[match.id] = await MatchService.getMatchSubmissions(
            match.id
          );
        })
      );
      setAllSubmissions(submissionsMap);
    } catch (error) {
      console.error("Failed to load matches:", error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadMatches();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleToggleAnonymous = async () => {
    if (!currentTournament) return;

    setIsTogglingAnonymous(true);
    try {
      await TournamentService.toggleAnonymousVoting(
        currentTournament.id,
        !currentTournament.anonymous_voting
      );
    } catch (error) {
      console.error("Error toggling anonymous voting:", error);
    } finally {
      setIsTogglingAnonymous(false);
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
      case 16:
        return t("tournament.round32");
      case 8:
        return t("tournament.round16");
      case 4:
        return t("tournament.quarterFinal");
      case 2:
        return t("tournament.semiFinal");
      case 1:
        return t("tournament.final");
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
            ${
              round === 5
                ? "bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800"
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
              ${round === 5 ? "text-purple-800" : ""}
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
                matchSubmissions={allSubmissions[match.id] || []}
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
          <LoadingSpinner size="lg" text={t("header.noActiveTournament")} />
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
          {t("tournament.bracket")}
        </Heading>
        <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-6">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-textcolor-secondary" />
            <Text variant="body" color="secondary">
              {t("tournamentSelection.players", { count: participants.length })}
            </Text>
          </div>
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-textcolor-secondary" />
            <Text variant="body" color="secondary">
              {currentTournament.status === "lobby"
                ? t("header.lobby")
                : currentTournament.status === "in_progress"
                ? t("tournamentSelection.inProgress")
                : t("admin.finished")}
            </Text>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-primary text-white rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                isRefreshing ? "animate-spin" : ""
              }`}
            />
            <span className="text-sm font-medium">{t("lobby.refresh")}</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Admin Anonymous Voting Toggle */}
      {useStore.getState().user?.is_admin &&
        currentTournament.status === "in_progress" && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6 flex justify-center"
          >
            <Card className="inline-block">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center gap-3">
                  {currentTournament.anonymous_voting ? (
                    <EyeOff className="w-5 h-5 text-purple-600" />
                  ) : (
                    <Eye className="w-5 h-5 text-purple-600" />
                  )}
                  <div>
                    <DarkAwareText onDark={true} className="font-semibold">
                      {currentTournament.anonymous_voting
                        ? t("tournament.anonymousVotingOn")
                        : t("tournament.anonymousVotingOff")}
                    </DarkAwareText>
                    <Text variant="caption" color="secondary">
                      {currentTournament.anonymous_voting
                        ? t("tournament.votersWillSeeSubmissions")
                        : t("tournament.votersWillSeeNames")}
                    </Text>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleToggleAnonymous}
                  disabled={isTogglingAnonymous}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md whitespace-nowrap"
                >
                  {currentTournament.anonymous_voting ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium">
                    {currentTournament.anonymous_voting
                      ? t("match.showNames")
                      : t("match.hideNames")}
                  </span>
                </motion.button>
              </div>
            </Card>
          </motion.div>
        )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="text-center mb-8 sm:mb-12"
      ></motion.div>

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
                  🎉 {t("winner.champion")} 🎉
                </Heading>
                <Text className="text-xl sm:text-2xl font-bold text-white">
                  {BotService.getBotDisplayName(champion)}
                </Text>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="overflow-hidden relative !px-0">
        <AnimatePresence>
          {showLeftScroll && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0.7, 0.9, 0.7],
              }}
              exit={{ opacity: 0 }}
              transition={{
                opacity: {
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              }}
              className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none bg-gradient-to-r from-gray-50 via-gray-50/40 to-transparent"
            >
              <motion.button
                initial={{ x: -20, opacity: 0 }}
                animate={{
                  x: 0,
                  opacity: 1,
                  scale: [1, 1.05, 1],
                }}
                exit={{ x: -20, opacity: 0 }}
                transition={{
                  scale: {
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  },
                }}
                whileHover={{ scale: 1.15 }}
                onClick={() => scrollToDirection("left")}
                className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-auto bg-white/95 backdrop-blur-sm shadow-lg rounded-full p-3 transition-all duration-200 border border-gray-200 hover:border-primary-300 hover:shadow-glow"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-6 h-6 text-primary" />
              </motion.button>
            </motion.div>
          )}
          {showRightScroll && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0.7, 0.9, 0.7],
              }}
              exit={{ opacity: 0 }}
              transition={{
                opacity: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              }}
              className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none bg-gradient-to-l from-gray-50 via-gray-50/40 to-transparent"
            >
              <motion.button
                initial={{ x: 20, opacity: 0 }}
                animate={{
                  x: 0,
                  opacity: 1,
                  scale: [1, 1.05, 1],
                }}
                exit={{ x: 20, opacity: 0 }}
                transition={{
                  scale: {
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  },
                }}
                whileHover={{ scale: 1.15 }}
                onClick={() => scrollToDirection("right")}
                className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-auto bg-white/95 backdrop-blur-sm shadow-lg rounded-full p-3 transition-all duration-200 border border-gray-200 hover:border-primary-300 hover:shadow-glow"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-6 h-6 text-primary" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="overflow-x-auto" ref={scrollContainerRef}>
          <div className="flex gap-6 sm:gap-8 lg:gap-12 min-w-max pb-4 px-4">
            {[1, 2, 3, 4, 5].map((round) => renderRound(round)).filter(Boolean)}
          </div>
        </div>
      </Card>
    </Container>
  );
};
