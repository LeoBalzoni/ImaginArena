import React, { useState } from "react";
import { Users, ZoomIn, Heart, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MatchService } from "../../services/matchService";
import { useStore } from "../../store/useStore";
import { Button, Card, DarkAwareHeading, Text } from "../ui";
import { ImageModal } from "./ImageModal";
import type { User, Submission, Vote as VoteType } from "../../lib/supabase";

interface VotingInterfaceProps {
  matchId: string;
  player1: User;
  player2: User;
  player1Submission: Submission;
  player2Submission: Submission;
  canVote: boolean;
  votes: VoteType[];
  showVoteCounts?: boolean; // Only show vote counts if true (admin or results phase)
  prompt?: string; // Match prompt for modal display
}

export const VotingInterface: React.FC<VotingInterfaceProps> = ({
  matchId,
  player1,
  player2,
  player1Submission,
  player2Submission,
  canVote,
  votes,
  showVoteCounts = false,
  prompt,
}) => {
  const { user, setError } = useStore();
  const [isVoting, setIsVoting] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(
    null
  );
  const [modalImage, setModalImage] = useState<{
    url: string;
    playerName: string;
  } | null>(null);

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

  const renderSubmissionCard = (
    player: User,
    submission: Submission,
    isPlayer1: boolean
  ) => {
    const hasUserVoted = userVote?.voted_for_submission_id === submission.id;
    const isSelected = selectedSubmission === submission.id;
    const voteCount = getVoteCount(submission.id);

    return (
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: isPlayer1 ? 0.2 : 0.4, duration: 0.5 }}
        className="w-full"
      >
        <Card
          hover={canVote}
          selected={hasUserVoted || isSelected}
          className={`relative overflow-hidden transition-all duration-300 ${
            hasUserVoted
              ? "border-accent shadow-glow-accent bg-gradient-to-br from-accent-50 to-accent-100"
              : isSelected && canVote
              ? "border-primary shadow-glow bg-primary-50"
              : canVote
              ? "hover:border-primary-300 cursor-pointer"
              : ""
          }`}
          onClick={() => {
            if (canVote && !hasUserVoted) {
              setSelectedSubmission(submission.id);
            }
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isPlayer1
                    ? "bg-gradient-to-br from-primary to-primary-600"
                    : "bg-gradient-to-br from-secondary to-secondary-600"
                }`}
              >
                <Users className="w-5 h-5 text-white" />
              </div>
              <DarkAwareHeading
                onDark={true}
                level={4}
                className={hasUserVoted ? "text-accent-800" : ""}
              >
                {player.username}
              </DarkAwareHeading>
            </div>

            {showVoteCounts && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full"
              >
                <Users className="w-4 h-4 text-textcolor-secondary" />
                <Text variant="small" className="font-semibold">
                  {voteCount} votes
                </Text>
              </motion.div>
            )}
          </div>

          {/* Image Container */}
          <div className="relative group">
            <motion.div
              whileHover={canVote ? { scale: 1.02 } : {}}
              className="relative rounded-2xl overflow-hidden"
            >
              <img
                src={submission.image_url}
                alt={`${player.username}'s submission`}
                className="w-full h-64 sm:h-72 object-cover transition-transform duration-300"
              />

              {/* Zoom Button */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="absolute top-3 right-3"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setModalImage({
                      url: submission.image_url,
                      playerName: player.username,
                    });
                  }}
                  className="bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-all backdrop-blur-sm shadow-lg hover:scale-110"
                  title="View full size"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </motion.div>

              {/* Vote Overlay */}
              <AnimatePresence>
                {hasUserVoted && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute inset-0 bg-accent/20 backdrop-blur-sm flex items-center justify-center"
                  >
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="bg-accent text-white px-6 py-3 rounded-2xl shadow-lg flex items-center gap-2"
                    >
                      <Heart className="w-5 h-5 fill-current" />
                      <Text className="font-semibold text-white">
                        Your Vote
                      </Text>
                      <Sparkles className="w-5 h-5" />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Selection Glow */}
              {isSelected && canVote && !hasUserVoted && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-primary/10 backdrop-blur-sm border-2 border-primary rounded-2xl"
                />
              )}
            </motion.div>
          </div>

          {/* Vote Button */}
          {canVote && !hasUserVoted && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mt-6"
            >
              <Button
                variant={isSelected ? "primary" : "outline"}
                size="lg"
                onClick={() => handleVote(submission.id)}
                isLoading={isVoting}
                className="w-full"
              >
                <Heart className="w-5 h-5" />
                Vote for {player.username}
              </Button>
            </motion.div>
          )}
        </Card>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="grid gap-6 md:gap-8 md:grid-cols-2"
    >
      {renderSubmissionCard(player1, player1Submission, true)}
      {renderSubmissionCard(player2, player2Submission, false)}

      {/* Image Modal */}
      <AnimatePresence>
        {modalImage && (
          <ImageModal
            isOpen={true}
            onClose={() => setModalImage(null)}
            imageUrl={modalImage.url}
            playerName={modalImage.playerName}
            prompt={prompt}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
