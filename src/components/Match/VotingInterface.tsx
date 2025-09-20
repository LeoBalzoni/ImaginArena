import React, { useState } from "react";
import { Vote, Loader2, Users } from "lucide-react";
import { MatchService } from "../../services/matchService";
import { useStore } from "../../store/useStore";
import type { User, Submission, Vote as VoteType } from "../../lib/supabase";

interface VotingInterfaceProps {
  matchId: string;
  player1: User;
  player2: User;
  player1Submission: Submission;
  player2Submission: Submission;
  canVote: boolean;
  votes: VoteType[];
}

export const VotingInterface: React.FC<VotingInterfaceProps> = ({
  matchId,
  player1,
  player2,
  player1Submission,
  player2Submission,
  canVote,
  votes,
}) => {
  const { user, setError } = useStore();
  const [isVoting, setIsVoting] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(
    null
  );

  const handleVote = async (submissionId: string) => {
    if (!user || !canVote) return;

    setIsVoting(true);
    setError(null);

    try {
      await MatchService.voteForSubmission(matchId, user.id, submissionId);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to submit vote"
      );
    } finally {
      setIsVoting(false);
    }
  };

  const getVoteCount = (submissionId: string) => {
    return votes.filter((v) => v.voted_for_submission_id === submissionId)
      .length;
  };

  // const hasUserVoted = () => {
  //   return votes.some((v) => v.voter_id === user?.id);
  // };

  const getUserVote = () => {
    return votes.find((v) => v.voter_id === user?.id);
  };

  const userVote = getUserVote();

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Player 1 Submission */}
      <div
        className={`card transition-all ${
          userVote?.voted_for_submission_id === player1Submission.id
            ? "border-green-500 bg-green-50"
            : canVote && selectedSubmission === player1Submission.id
            ? "border-primary-500 bg-primary-50"
            : ""
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-900">{player1.username}</h4>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>{getVoteCount(player1Submission.id)} votes</span>
          </div>
        </div>

        <div
          className={`relative cursor-pointer rounded-lg overflow-hidden ${
            canVote ? "hover:ring-2 hover:ring-primary-300" : ""
          }`}
          onClick={() => canVote && setSelectedSubmission(player1Submission.id)}
        >
          <img
            src={player1Submission.image_url}
            alt={`${player1.username}'s submission`}
            className="w-full h-64 object-cover"
          />
          {userVote?.voted_for_submission_id === player1Submission.id && (
            <div className="absolute inset-0 bg-green-500 bg-opacity-20 flex items-center justify-center">
              <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                Your Vote
              </div>
            </div>
          )}
        </div>

        {canVote && (
          <button
            onClick={() => handleVote(player1Submission.id)}
            disabled={isVoting}
            className={`btn-primary w-full mt-4 flex items-center justify-center gap-2 ${
              selectedSubmission === player1Submission.id
                ? "ring-2 ring-primary-300"
                : ""
            }`}
          >
            {isVoting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Vote className="w-4 h-4" />
            )}
            Vote for {player1.username}
          </button>
        )}
      </div>

      {/* Player 2 Submission */}
      <div
        className={`card transition-all ${
          userVote?.voted_for_submission_id === player2Submission.id
            ? "border-green-500 bg-green-50"
            : canVote && selectedSubmission === player2Submission.id
            ? "border-primary-500 bg-primary-50"
            : ""
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-900">{player2.username}</h4>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>{getVoteCount(player2Submission.id)} votes</span>
          </div>
        </div>

        <div
          className={`relative cursor-pointer rounded-lg overflow-hidden ${
            canVote ? "hover:ring-2 hover:ring-primary-300" : ""
          }`}
          onClick={() => canVote && setSelectedSubmission(player2Submission.id)}
        >
          <img
            src={player2Submission.image_url}
            alt={`${player2.username}'s submission`}
            className="w-full h-64 object-cover"
          />
          {userVote?.voted_for_submission_id === player2Submission.id && (
            <div className="absolute inset-0 bg-green-500 bg-opacity-20 flex items-center justify-center">
              <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                Your Vote
              </div>
            </div>
          )}
        </div>

        {canVote && (
          <button
            onClick={() => handleVote(player2Submission.id)}
            disabled={isVoting}
            className={`btn-primary w-full mt-4 flex items-center justify-center gap-2 ${
              selectedSubmission === player2Submission.id
                ? "ring-2 ring-primary-300"
                : ""
            }`}
          >
            {isVoting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Vote className="w-4 h-4" />
            )}
            Vote for {player2.username}
          </button>
        )}
      </div>
    </div>
  );
};
