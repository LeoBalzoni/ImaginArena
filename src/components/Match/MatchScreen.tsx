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
} from "lucide-react";
import { useStore } from "../../store/useStore";
import { MatchService } from "../../services/matchService";
import { TournamentService } from "../../services/tournamentService";
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

  if (!currentMatch) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No match selected</p>
        <button
          onClick={() => setCurrentView("tournament")}
          className="btn-primary mt-4"
        >
          View Tournament Bracket
        </button>
      </div>
    );
  }

  const player1 = getPlayer1();
  const player2 = getPlayer2();
  const winner = getWinner();
  const player1Submission = getSubmissionForPlayer(currentMatch.player1_id);
  const player2Submission = getSubmissionForPlayer(currentMatch.player2_id);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-600" />
            <span className="font-medium">{player1?.username}</span>
          </div>
          <div className="text-2xl font-bold text-gray-400">VS</div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-600" />
            <span className="font-medium">{player2?.username}</span>
          </div>
        </div>

        {/* Refresh button */}
        <div className="flex justify-center mb-4">
          <button
            onClick={refreshMatchData}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh match data"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {matchPhase === "results" && winner && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <Trophy className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <h2 className="text-xl font-bold text-gray-900">
              Winner: {winner.username}!
            </h2>
          </div>
        )}
      </div>

      {/* Prompt */}
      <div className="card mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Creative Prompt
        </h3>
        <p className="text-gray-700 text-lg italic">"{currentMatch.prompt}"</p>
      </div>

      {/* Match Content */}
      {matchPhase === "submission" && (
        <div className="space-y-8">
          <div className="text-center">
            <Clock className="w-8 h-8 text-primary-600 mx-auto mb-2" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Submission Phase
            </h2>
            <p className="text-gray-600">
              Players are creating and submitting their images
            </p>
          </div>

          {isUserParticipant() && !getCurrentUserSubmission() && (
            <ImageSubmission matchId={currentMatch.id} />
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <div className="card">
              <h4 className="font-semibold text-gray-900 mb-4">
                {player1?.username}
              </h4>
              {player1Submission ? (
                <div className="text-center">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-green-600 font-medium">Submitted!</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Waiting for submission...</p>
                </div>
              )}
            </div>

            <div className="card">
              <h4 className="font-semibold text-gray-900 mb-4">
                {player2?.username}
              </h4>
              {player2Submission ? (
                <div className="text-center">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-green-600 font-medium">Submitted!</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Waiting for submission...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {matchPhase === "voting" && (
        <div className="space-y-8">
          <div className="text-center">
            <Vote className="w-8 h-8 text-primary-600 mx-auto mb-2" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Voting Phase
            </h2>
            <p className="text-gray-600">
              {canUserVote()
                ? "Vote for your favorite image!"
                : isUserParticipant()
                ? "Other players are voting on your match"
                : "You have already voted"}
            </p>

            {/* Admin End Voting Button */}
            {user?.is_admin && (
              <div className="mt-4">
                <button
                  onClick={endVoting}
                  disabled={isEndingVoting}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 mx-auto"
                >
                  {isEndingVoting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                  {isEndingVoting
                    ? "Ending Voting..."
                    : "End Voting & Reveal Results"}
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  Admin only - Click to reveal votes and determine winner
                </p>
              </div>
            )}
          </div>

          <VotingInterface
            matchId={currentMatch.id}
            player1={player1!}
            player2={player2!}
            player1Submission={player1Submission!}
            player2Submission={player2Submission!}
            canVote={canUserVote()}
            votes={votes}
            showVoteCounts={user?.is_admin || false}
          />
        </div>
      )}

      {matchPhase === "results" && (
        <div className="space-y-8">
          <div className="grid md:grid-cols-2 gap-6">
            <div
              className={`card ${
                winner?.id === player1?.id ? "border-green-500 bg-green-50" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">
                  {player1?.username}
                </h4>
                {winner?.id === player1?.id && (
                  <Trophy className="w-5 h-5 text-yellow-600" />
                )}
              </div>
              {player1Submission && (
                <div>
                  <img
                    src={player1Submission.image_url}
                    alt={`${player1?.username}'s submission`}
                    className="w-full h-64 object-cover rounded-lg mb-2"
                  />
                  <p className="text-sm text-gray-600">
                    Votes: {getVoteCount(player1Submission.id)}
                  </p>
                </div>
              )}
            </div>

            <div
              className={`card ${
                winner?.id === player2?.id ? "border-green-500 bg-green-50" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">
                  {player2?.username}
                </h4>
                {winner?.id === player2?.id && (
                  <Trophy className="w-5 h-5 text-yellow-600" />
                )}
              </div>
              {player2Submission && (
                <div>
                  <img
                    src={player2Submission.image_url}
                    alt={`${player2?.username}'s submission`}
                    className="w-full h-64 object-cover rounded-lg mb-2"
                  />
                  <p className="text-sm text-gray-600">
                    Votes: {getVoteCount(player2Submission.id)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="text-center mt-8">
        <button
          onClick={() => setCurrentView("tournament")}
          className="btn-secondary"
        >
          Back to Tournament Bracket
        </button>
      </div>

      {/* Coin Toss Modal */}
      {showCoinToss && player1 && player2 && (
        <CoinToss
          player1Name={player1.username}
          player2Name={player2.username}
          player1Id={player1.id}
          player2Id={player2.id}
          onComplete={handleCoinTossComplete}
        />
      )}
    </div>
  );
};
