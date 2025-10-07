import React, { useEffect, useState } from "react";
import {
  CheckCircle,
  Clock,
  Trophy,
  Upload,
  Users,
  Vote,
  RefreshCw,
  Eye,
  Shuffle,
  Zap,
  Sparkles,
  Crown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../../store/useStore";
import { MatchService } from "../../services/matchService";
import { TournamentService } from "../../services/tournamentService";
import { AdminService } from "../../services/adminService";
import {
  Button,
  Card,
  Container,
  Heading,
  Text,
  LoadingSpinner,
  DarkAwareHeading,
  DarkAwareText,
} from "../ui";
import { ImageSubmission } from "./ImageSubmission";
import { VotingInterface } from "./VotingInterface";
import { CoinToss } from "./CoinToss";

export const MatchScreen: React.FC = () => {
  const {
    user,
    currentMatch,
    currentTournament,
    participants,
    submissions,
    votes,
    setSubmissions,
    setVotes,
    setCurrentView,
    getCurrentUserSubmission,
    hasUserVoted,
  } = useStore();

  const [matchPhase, setMatchPhase] = useState<
    "submission" | "voting" | "results" | "revealing"
  >("submission");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCoinToss, setShowCoinToss] = useState(false);
  const [isEndingVoting, setIsEndingVoting] = useState(false);
  const [isChangingPrompt, setIsChangingPrompt] = useState(false);
  const [isAssigningWinner, setIsAssigningWinner] = useState(false);

  useEffect(() => {
    if (currentMatch) {
      loadMatchData();
      return MatchService.subscribeToMatchUpdates(currentMatch.id);
    }
  }, [currentMatch?.id]); // Only depend on match ID to avoid unnecessary re-subscriptions

  useEffect(() => {
    if (currentMatch) {
      determineMatchPhase();
    }
  }, [currentMatch, submissions, votes, participants]);

  // Additional effect to specifically handle winner updates
  useEffect(() => {
    if (currentMatch?.winner_id && matchPhase !== "results") {
      setMatchPhase("results");
    }
  }, [currentMatch?.winner_id, matchPhase]);

  // Force periodic phase check as additional safeguard
  useEffect(() => {
    if (!currentMatch) return;

    const phaseCheckInterval = setInterval(() => {
      if (currentMatch.winner_id && matchPhase !== "results") {
        setMatchPhase("results");
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(phaseCheckInterval);
  }, [currentMatch?.id, currentMatch?.winner_id, matchPhase]);

  const loadMatchData = async () => {
    if (!currentMatch) return;

    try {
      const [matchSubmissions, matchVotes] = await Promise.all([
        MatchService.getMatchSubmissions(currentMatch.id),
        MatchService.getMatchVotes(currentMatch.id),
      ]);

      setSubmissions(matchSubmissions);
      setVotes(matchVotes);
    } catch (error) {
      console.error("Failed to load match data:", error);
    }
  };

  const determineMatchPhase = async () => {
    if (!currentMatch) return;

    // If match has a winner, show results
    if (currentMatch.winner_id) {
      setMatchPhase("results");
      return;
    }

    // Check if both players have submitted
    const isReadyForVoting = await MatchService.isMatchReadyForVoting(
      currentMatch.id
    );

    if (!isReadyForVoting) {
      setMatchPhase("submission");
      return;
    }

    // If ready for voting, stay in voting phase until admin ends it
    setMatchPhase("voting");
  };

  const isUserParticipant = () => {
    if (!user || !currentMatch) return false;
    return (
      currentMatch.player1_id === user.id || currentMatch.player2_id === user.id
    );
  };

  const canUserVote = () => {
    if (!user || !currentMatch) return false;
    return !isUserParticipant() && !hasUserVoted(currentMatch.id);
  };

  const getPlayer1 = () =>
    participants.find((p) => p.id === currentMatch?.player1_id);
  const getPlayer2 = () =>
    participants.find((p) => p.id === currentMatch?.player2_id);
  const getWinner = () =>
    currentMatch?.winner_id
      ? participants.find((p) => p.id === currentMatch.winner_id)
      : null;

  const getSubmissionForPlayer = (playerId: string) => {
    return submissions.find((s) => s.user_id === playerId);
  };

  const getVoteCount = (submissionId: string) => {
    return votes.filter((v) => v.voted_for_submission_id === submissionId)
      .length;
  };

  const refreshMatchData = async () => {
    if (!currentMatch) return;

    setIsRefreshing(true);
    try {
      const [matchSubmissions, matchVotes] = await Promise.all([
        MatchService.getMatchSubmissions(currentMatch.id),
        MatchService.getMatchVotes(currentMatch.id),
      ]);

      setSubmissions(matchSubmissions);
      setVotes(matchVotes);
    } catch (error) {
      console.error("Error refreshing match data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const endVoting = async () => {
    if (!currentMatch || !user?.is_admin) return;

    setIsEndingVoting(true);
    try {
      const result = await MatchService.endVoting(currentMatch.id);

      if (result.isTie) {
        // Show coin toss animation
        setShowCoinToss(true);
      } else {
        // No tie - proceed to results
        setMatchPhase("results");
        if (currentTournament) {
          await TournamentService.createNextRoundMatches(currentTournament.id);
        }
      }
    } catch (error) {
      console.error("Failed to end voting:", error);
    } finally {
      setIsEndingVoting(false);
    }
  };

  const handleCoinTossComplete = async (winnerId: string) => {
    if (!currentMatch) return;

    try {
      // Set the winner from coin toss
      await MatchService.calculateMatchWinner(currentMatch.id, winnerId);
      setShowCoinToss(false);
      setMatchPhase("results");

      // Create next round matches
      if (currentTournament) {
        await TournamentService.createNextRoundMatches(currentTournament.id);
      }

      // Refresh match data to show the winner
      await refreshMatchData();
    } catch (error) {
      console.error("Failed to set coin toss winner:", error);
    }
  };

  const handleChangePrompt = async () => {
    if (!currentMatch || !user?.is_admin) return;

    setIsChangingPrompt(true);
    try {
      await MatchService.updateMatchPrompt(currentMatch.id);
      // The match state will be updated automatically via the subscription system
    } catch (error) {
      console.error("Failed to change prompt:", error);
    } finally {
      setIsChangingPrompt(false);
    }
  };

  const handleAssignWinner = async (winnerId: string) => {
    if (!currentMatch || !user?.is_admin) return;

    setIsAssigningWinner(true);
    try {
      await AdminService.assignMatchWinner(currentMatch.id, winnerId);
      // Refresh match data to show updated state
      await loadMatchData();
    } catch (error) {
      console.error("Error assigning winner:", error);
    } finally {
      setIsAssigningWinner(false);
    }
  };

  if (!currentMatch) {
    return (
      <Container className="py-12">
        <div className="text-center">
          <LoadingSpinner size="lg" text="No match selected" />
          <div className="mt-8">
            <Button
              variant="primary"
              size="lg"
              onClick={() => setCurrentView("tournament")}
            >
              View Tournament Bracket
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  const player1 = getPlayer1();
  const player2 = getPlayer2();
  const winner = getWinner();
  const player1Submission = getSubmissionForPlayer(currentMatch.player1_id);
  const player2Submission = getSubmissionForPlayer(currentMatch.player2_id);

  return (
    <Container size="lg" className="py-6 sm:py-8 lg:py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8 sm:mb-12"
      >
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mb-6">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 p-4 bg-primary-50 rounded-2xl shadow-sm"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-600 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <Text className="font-semibold text-primary-800">
              {player1?.username || "Player 1"}
            </Text>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-secondary-100 to-secondary-200 rounded-2xl shadow-sm"
          >
            <Zap className="w-5 h-5 text-secondary-600" />
            <Text className="text-xl font-bold text-secondary-800">VS</Text>
            <Zap className="w-5 h-5 text-secondary-600" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 p-4 bg-accent-50 rounded-2xl shadow-sm"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-accent to-accent-600 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <Text className="font-semibold text-accent-800">
              {player2?.username || "Player 2"}
            </Text>
          </motion.div>
        </div>

        {/* Refresh button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex justify-center mb-6"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshMatchData}
            isLoading={isRefreshing}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Match Data
          </Button>
        </motion.div>

        <AnimatePresence>
          {matchPhase === "results" && winner && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -30 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="mb-8"
            >
              <Card className="gradient-accent text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
                <div className="relative z-10 text-center">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 2,
                    }}
                  >
                    <Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-white mx-auto mb-4" />
                  </motion.div>
                  <Heading level={2} className="text-white mb-2">
                    🏆 Winner: {winner.username}! 🏆
                  </Heading>
                  <Text className="text-white/90">
                    Congratulations on advancing to the next round!
                  </Text>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Prompt */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="mb-8"
      >
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-accent" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <DarkAwareHeading
                onDark={true}
                level={3}
                className="text-lg sm:text-xl"
              >
                Creative Prompt
              </DarkAwareHeading>
            </div>
            {user?.is_admin && matchPhase === "submission" && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleChangePrompt}
                isLoading={isChangingPrompt}
              >
                <Shuffle className="w-4 h-4" />
                {isChangingPrompt ? "Changing..." : "New Prompt"}
              </Button>
            )}
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 border-l-4 border-primary"
          >
            <Text className="text-lg sm:text-xl italic font-medium text-textcolor-primary leading-relaxed">
              "{currentMatch.prompt}"
            </Text>
          </motion.div>
          {user?.is_admin && matchPhase === "submission" && (
            <Text variant="caption" color="secondary" className="mt-3">
              Admin: Click "New Prompt" to generate a different creative prompt
              for this match
            </Text>
          )}
        </Card>
      </motion.div>

      {/* Match Content */}
      <AnimatePresence mode="wait">
        {matchPhase === "submission" && (
          <motion.div
            key="submission"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary-600 rounded-full shadow-glow mb-4">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <Heading level={2} className="mb-2">
                Submission Phase
              </Heading>
              <Text color="secondary" className="text-lg">
                Players are creating and submitting their images
              </Text>
            </motion.div>

            {isUserParticipant() && !getCurrentUserSubmission() && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <ImageSubmission matchId={currentMatch.id} />
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="grid gap-6 md:grid-cols-2"
            >
              <Card
                className={`text-center ${
                  player1Submission ? "border-accent shadow-glow-accent" : ""
                }`}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-600 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <DarkAwareHeading
                    onDark={true}
                    level={4}
                    className="text-primary-800"
                  >
                    {player1?.username}
                  </DarkAwareHeading>
                </div>
                {player1Submission ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-accent to-accent-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow-accent">
                      <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                    <DarkAwareText
                      onDark={true}
                      className="text-accent-600 font-semibold text-lg"
                    >
                      ✨ Submitted!
                    </DarkAwareText>
                  </motion.div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <Upload className="w-8 h-8 text-gray-400" />
                    </div>
                    <Text color="secondary">Waiting for submission...</Text>
                  </div>
                )}
              </Card>

              <Card
                className={`text-center ${
                  player2Submission ? "border-accent shadow-glow-accent" : ""
                }`}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-accent to-accent-600 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <DarkAwareHeading
                    onDark={true}
                    level={4}
                    className="text-accent-800"
                  >
                    {player2?.username}
                  </DarkAwareHeading>
                </div>
                {player2Submission ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-accent to-accent-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow-accent">
                      <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                    <DarkAwareText
                      onDark={true}
                      className="text-accent-600 font-semibold text-lg"
                    >
                      ✨ Submitted!
                    </DarkAwareText>
                  </motion.div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <Upload className="w-8 h-8 text-gray-400" />
                    </div>
                    <Text color="secondary">Waiting for submission...</Text>
                  </div>
                )}
              </Card>
            </motion.div>

            {/* Admin Winner Assignment Controls - Submission Phase */}
            {user?.is_admin && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mt-8"
              >
                <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-2">
                      <Crown className="w-5 h-5 text-red-600" />
                      <Text
                        variant="small"
                        color="secondary"
                        className="font-medium text-red-700"
                      >
                        Admin: Quick Winner Assignment (Debug)
                      </Text>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleAssignWinner(currentMatch.player1_id)
                        }
                        isLoading={isAssigningWinner}
                        disabled={isAssigningWinner}
                        className="flex-1 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                      >
                        <Crown className="w-4 h-4" />
                        {player1?.username || "Player 1"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleAssignWinner(currentMatch.player2_id)
                        }
                        isLoading={isAssigningWinner}
                        disabled={isAssigningWinner}
                        className="flex-1 bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
                      >
                        <Crown className="w-4 h-4" />
                        {player2?.username || "Player 2"}
                      </Button>
                    </div>
                    <Text
                      variant="caption"
                      color="secondary"
                      className="text-red-600"
                    >
                      Skip submissions and voting - instantly assign winner
                    </Text>
                  </div>
                </Card>
              </motion.div>
            )}
          </motion.div>
        )}

        {matchPhase === "voting" && (
          <motion.div
            key="voting"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-secondary to-secondary-600 rounded-full shadow-glow-secondary mb-4">
                <Vote className="w-8 h-8 text-white" />
              </div>
              <Heading level={2} className="mb-2">
                Voting Phase
              </Heading>
              <Text color="secondary" className="text-lg">
                {canUserVote()
                  ? "Vote for your favorite image!"
                  : isUserParticipant()
                  ? "Other players are voting on your match"
                  : "You have already voted"}
              </Text>

              {/* Admin End Voting Button */}
              {user?.is_admin && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mt-6 space-y-4"
                >
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={endVoting}
                    isLoading={isEndingVoting}
                    className="bg-red-600 hover:bg-red-700 text-white w-full"
                  >
                    <Eye className="w-5 h-5" />
                    {isEndingVoting
                      ? "Ending Voting..."
                      : "End Voting & Reveal Results"}
                  </Button>
                  <Text
                    variant="caption"
                    color="secondary"
                    className="text-center"
                  >
                    Admin only - Click to reveal votes and determine winner
                  </Text>

                  {/* Admin Winner Assignment Controls */}
                  <div className="border-t border-gray-200 pt-4">
                    <Text
                      variant="small"
                      color="secondary"
                      className="text-center mb-3 font-medium"
                    >
                      Quick Winner Assignment (Debug)
                    </Text>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleAssignWinner(currentMatch.player1_id)
                        }
                        isLoading={isAssigningWinner}
                        disabled={isAssigningWinner}
                        className="flex-1 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                      >
                        <Crown className="w-4 h-4" />
                        {player1?.username || "Player 1"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleAssignWinner(currentMatch.player2_id)
                        }
                        isLoading={isAssigningWinner}
                        disabled={isAssigningWinner}
                        className="flex-1 bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
                      >
                        <Crown className="w-4 h-4" />
                        {player2?.username || "Player 2"}
                      </Button>
                    </div>
                    <Text
                      variant="caption"
                      color="secondary"
                      className="text-center mt-2"
                    >
                      Instantly assign winner without voting calculation
                    </Text>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {player1Submission && player2Submission && player1 && player2 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <VotingInterface
                  matchId={currentMatch.id}
                  player1={player1}
                  player2={player2}
                  player1Submission={player1Submission}
                  player2Submission={player2Submission}
                  canVote={canUserVote()}
                  votes={votes}
                  showVoteCounts={user?.is_admin || false}
                  prompt={currentMatch.prompt}
                />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="text-center py-8"
              >
                <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-white" />
                  </div>
                  <Heading level={3} className="text-yellow-800 mb-2">
                    Waiting for Submissions
                  </Heading>
                  <Text color="secondary" className="mb-4">
                    Both players need to submit their images before voting can
                    begin.
                  </Text>
                  <div className="space-y-2">
                    {!player1Submission && (
                      <Text variant="small" color="secondary">
                        • Waiting for {player1?.username || "Player 1"}
                      </Text>
                    )}
                    {!player2Submission && (
                      <Text variant="small" color="secondary">
                        • Waiting for {player2?.username || "Player 2"}
                      </Text>
                    )}
                  </div>
                </Card>
              </motion.div>
            )}
          </motion.div>
        )}

        {matchPhase === "results" && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="grid gap-6 md:grid-cols-2"
            >
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card
                  className={`relative overflow-hidden ${
                    winner?.id === player1?.id
                      ? "border-accent shadow-glow-accent bg-gradient-to-br from-accent-50 to-accent-100"
                      : "hover:shadow-card"
                  }`}
                >
                  {winner?.id === player1?.id && (
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-accent to-accent-600" />
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-600 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <DarkAwareHeading
                        onDark={winner?.id !== player1?.id}
                        level={4}
                        className={
                          winner?.id === player1?.id ? "text-accent-800" : ""
                        }
                      >
                        {player1?.username}
                      </DarkAwareHeading>
                    </div>
                    {winner?.id === player1?.id && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                          delay: 0.6,
                          type: "spring",
                          stiffness: 200,
                        }}
                        className="flex items-center gap-2 px-3 py-1 bg-accent rounded-full"
                      >
                        <Trophy className="w-4 h-4 text-white" />
                        <Text
                          variant="small"
                          className="text-white font-semibold"
                        >
                          Winner
                        </Text>
                      </motion.div>
                    )}
                  </div>
                  {player1Submission && (
                    <div>
                      <motion.img
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.8 }}
                        src={player1Submission.image_url}
                        alt={`${player1?.username}'s submission`}
                        className="w-full h-64 object-cover rounded-xl mb-4 shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() =>
                          window.open(player1Submission.image_url, "_blank")
                        }
                      />
                      <div className="flex items-center justify-between">
                        <Text variant="small" color="secondary">
                          Votes: {getVoteCount(player1Submission.id)}
                        </Text>
                        {winner?.id === player1?.id && (
                          <Text
                            variant="small"
                            className="text-accent-600 font-semibold"
                          >
                            🎉 Advanced!
                          </Text>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card
                  className={`relative overflow-hidden ${
                    winner?.id === player2?.id
                      ? "border-accent shadow-glow-accent bg-gradient-to-br from-accent-50 to-accent-100"
                      : "hover:shadow-card"
                  }`}
                >
                  {winner?.id === player2?.id && (
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-accent to-accent-600" />
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-accent to-accent-600 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <DarkAwareHeading
                        onDark={winner?.id !== player2?.id}
                        level={4}
                        className={
                          winner?.id === player2?.id ? "text-accent-800" : ""
                        }
                      >
                        {player2?.username}
                      </DarkAwareHeading>
                    </div>
                    {winner?.id === player2?.id && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                          delay: 0.6,
                          type: "spring",
                          stiffness: 200,
                        }}
                        className="flex items-center gap-2 px-3 py-1 bg-accent rounded-full"
                      >
                        <Trophy className="w-4 h-4 text-white" />
                        <Text
                          variant="small"
                          className="text-white font-semibold"
                        >
                          Winner
                        </Text>
                      </motion.div>
                    )}
                  </div>
                  {player2Submission && (
                    <div>
                      <motion.img
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.8 }}
                        src={player2Submission.image_url}
                        alt={`${player2?.username}'s submission`}
                        className="w-full h-64 object-cover rounded-xl mb-4 shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() =>
                          window.open(player2Submission.image_url, "_blank")
                        }
                      />
                      <div className="flex items-center justify-between">
                        <Text variant="small" color="secondary">
                          Votes: {getVoteCount(player2Submission.id)}
                        </Text>
                        {winner?.id === player2?.id && (
                          <Text
                            variant="small"
                            className="text-accent-600 font-semibold"
                          >
                            🎉 Advanced!
                          </Text>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="text-center mt-12"
      >
        <Button
          variant="secondary"
          size="lg"
          onClick={() => setCurrentView("tournament")}
          className="w-full sm:w-auto"
        >
          Back to Tournament Bracket
        </Button>
      </motion.div>

      {/* Coin Toss Modal */}
      <AnimatePresence>
        {showCoinToss && player1 && player2 && (
          <CoinToss
            player1Name={player1.username}
            player2Name={player2.username}
            player1Id={player1.id}
            player2Id={player2.id}
            onComplete={handleCoinTossComplete}
          />
        )}
      </AnimatePresence>
    </Container>
  );
};
