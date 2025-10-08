import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Crown,
  Sparkles,
  Star,
  ArrowLeft,
  Share2,
  Settings,
  Instagram,
  Twitter,
  Link2,
  Check,
} from "lucide-react";
import {
  Button,
  Card,
  Container,
  DarkAwareHeading,
  DarkAwareText,
  Heading,
  LoadingSpinner,
} from "../ui";
import type { User } from "../../lib/supabase";
import { TournamentService } from "../../services/tournamentService";
import { useStore } from "../../store/useStore";
import {
  shareToInstagramStory,
  shareToTwitter,
  shareVictory,
  copyShareLink,
} from "../../lib/shareUtils";

interface WinnerScreenProps {
  champion: User;
  onBackToLobby: () => void;
}

export const WinnerScreen: React.FC<WinnerScreenProps> = ({
  champion,
  onBackToLobby,
}) => {
  const { user, currentTournament } = useStore();
  const [showConfetti, setShowConfetti] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0);
  const [endingTournament, setEndingTournament] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  useEffect(() => {
    // Trigger confetti animation
    const timer1 = setTimeout(() => setShowConfetti(true), 500);
    const timer2 = setTimeout(() => setAnimationPhase(1), 1000);
    const timer3 = setTimeout(() => setAnimationPhase(2), 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const handleEndTournament = async () => {
    if (!currentTournament || !user?.is_admin) return;

    setEndingTournament(true);
    try {
      await TournamentService.endTournament(currentTournament.id);
      // The tournament status will be updated via the subscription
      // and the app will automatically navigate back to lobby
    } catch (error) {
      console.error("Error ending tournament:", error);
    } finally {
      setEndingTournament(false);
    }
  };

  const confettiPieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 3 + Math.random() * 2,
    rotation: Math.random() * 360,
    color: [
      "text-primary",
      "text-secondary",
      "text-accent",
      "text-yellow-400",
      "text-pink-400",
    ][Math.floor(Math.random() * 5)],
  }));

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Gradient Background */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-accent"
      >
        {/* Animated gradient overlay */}
        <motion.div
          animate={{
            background: [
              "radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.3) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 20%, rgba(249, 115, 22, 0.3) 0%, transparent 50%)",
              "radial-gradient(circle at 40% 80%, rgba(16, 185, 129, 0.3) 0%, transparent 50%)",
              "radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.3) 0%, transparent 50%)",
            ],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0"
        />
      </motion.div>

      {/* Confetti Animation */}
      <AnimatePresence>
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {confettiPieces.map((piece) => (
              <motion.div
                key={piece.id}
                initial={{
                  y: -20,
                  x: `${piece.x}%`,
                  rotate: piece.rotation,
                  opacity: 0,
                }}
                animate={{
                  y: "100vh",
                  rotate: piece.rotation + 360,
                  opacity: [0, 1, 1, 0],
                }}
                transition={{
                  duration: piece.duration,
                  delay: piece.delay,
                  ease: "easeOut",
                }}
                className="absolute"
              >
                <Sparkles className={`w-4 h-4 ${piece.color}`} />
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <Container className="relative z-10 py-8 sm:py-16">
        <div className="text-center">
          {/* Trophy Animation */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              duration: 1,
              delay: 0.5,
              type: "spring",
              stiffness: 200,
              damping: 15,
            }}
            className="mb-8"
          >
            <div className="relative inline-block">
              <motion.div
                animate={{
                  rotate: [0, -10, 10, -10, 10, 0],
                  scale: [1, 1.1, 1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  delay: 1.5,
                  repeat: Infinity,
                  repeatDelay: 3,
                }}
                className="bg-gradient-to-br from-yellow-400 to-yellow-600 p-8 rounded-full shadow-2xl"
              >
                <Trophy className="w-16 h-16 sm:w-24 sm:h-24 text-white" />
              </motion.div>

              {/* Sparkle effects around trophy */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 2,
                    delay: 2 + i * 0.2,
                    repeat: Infinity,
                    repeatDelay: 4,
                  }}
                  className="absolute"
                  style={{
                    top: `${20 + Math.sin((i * Math.PI) / 4) * 60}%`,
                    left: `${50 + Math.cos((i * Math.PI) / 4) * 60}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <Star className="w-4 h-4 text-yellow-300 fill-current" />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Champion Announcement */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="mb-8"
          >
            <Heading
              level={1}
              className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white mb-4 drop-shadow-lg"
            >
              🎉 CHAMPION! 🎉
            </Heading>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 1.5 }}
              className="relative"
            >
              <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl max-w-md mx-auto">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Crown className="w-8 h-8 text-yellow-500" />
                  <DarkAwareHeading
                    level={2}
                    className="text-2xl sm:text-3xl text-gray-800"
                  >
                    {champion.username}
                  </DarkAwareHeading>
                  <Crown className="w-8 h-8 text-yellow-500" />
                </div>

                <DarkAwareText className="text-gray-600 text-lg">
                  {user?.id === champion.id
                    ? "Congratulations on your victory!"
                    : "Won the tournament!"}
                </DarkAwareText>
              </Card>
            </motion.div>
          </motion.div>

          {/* Celebration Message */}
          <AnimatePresence>
            {animationPhase >= 1 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.6 }}
                className="mb-8"
              >
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl max-w-2xl mx-auto">
                  <div className="text-center">
                    <Sparkles className="w-8 h-8 text-accent mx-auto mb-4" />
                    <DarkAwareText className="text-lg text-gray-700 leading-relaxed">
                      {user?.id === champion.id
                        ? "You've conquered the tournament and proven yourself as the ultimate creative champion! Your artistic vision and skill have earned you this well-deserved victory."
                        : `${champion.username} has conquered the tournament and proven themselves as the ultimate creative champion! Thank you for participating and showcasing your creativity. Every submission made this tournament amazing!`}
                    </DarkAwareText>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <AnimatePresence>
            {animationPhase >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-4"
              >
                {/* Admin Controls */}
                {user?.is_admin &&
                  currentTournament?.status === "in_progress" && (
                    <div className="flex justify-center mb-6">
                      <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl p-4">
                        <div className="text-center mb-4">
                          <Settings className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                          <Heading
                            level={3}
                            className="text-lg font-semibold text-gray-800"
                          >
                            Admin Controls
                          </Heading>
                          <DarkAwareText className="text-sm text-gray-600">
                            End this tournament and return all players to lobby
                          </DarkAwareText>
                        </div>
                        <Button
                          onClick={handleEndTournament}
                          disabled={endingTournament}
                          className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                          size="lg"
                        >
                          {endingTournament ? (
                            <>
                              <LoadingSpinner size="sm" />
                              Ending Tournament...
                            </>
                          ) : (
                            <>
                              <Trophy className="w-5 h-5" />
                              End Tournament
                            </>
                          )}
                        </Button>
                      </Card>
                    </div>
                  )}

                {/* Regular Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={onBackToLobby}
                    className="bg-white/90 hover:bg-white text-gray-800 border-0 shadow-lg"
                    disabled={currentTournament?.status === "in_progress"}
                  >
                    <ArrowLeft className="w-5 h-5" />
                    {currentTournament?.status === "in_progress"
                      ? "Tournament Active"
                      : "Back to Lobby"}
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                    onClick={() => setShowShareModal(true)}
                  >
                    <Share2 className="w-5 h-5" />
                    Share Victory
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Container>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="bg-gradient-to-br from-primary to-accent p-4 rounded-full inline-block mb-4">
                  <Share2 className="w-8 h-8 text-white" />
                </div>
                <Heading level={3} className="text-2xl font-bold text-gray-800 mb-2">
                  Share Your Victory!
                </Heading>
                <DarkAwareText className="text-gray-600">
                  Let everyone know you conquered the arena
                </DarkAwareText>
              </div>

              {shareSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 flex items-center gap-2"
                >
                  <Check className="w-5 h-5 text-green-600" />
                  <DarkAwareText className="text-green-800 text-sm">
                    Copied to clipboard! Paste it in your story
                  </DarkAwareText>
                </motion.div>
              )}

              <div className="space-y-3">
                {/* Instagram Story */}
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
                  onClick={async () => {
                    const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
                    await shareToInstagramStory({
                      championName: champion.username,
                      tournamentSize: currentTournament?.tournament_size || 16,
                      appUrl: `${appUrl}/about`,
                    });
                    setShareSuccess(true);
                    setTimeout(() => setShareSuccess(false), 3000);
                  }}
                >
                  <Instagram className="w-5 h-5" />
                  Share to Instagram Story
                </Button>

                {/* Twitter/X */}
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full bg-black hover:bg-gray-800 text-white border-0"
                  onClick={() => {
                    const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
                    shareToTwitter({
                      championName: champion.username,
                      tournamentSize: currentTournament?.tournament_size || 16,
                      appUrl: `${appUrl}/about`,
                    });
                  }}
                >
                  <Twitter className="w-5 h-5" />
                  Share on X (Twitter)
                </Button>

                {/* Copy Link */}
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300"
                  onClick={async () => {
                    const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
                    const success = await copyShareLink(`${appUrl}/about`);
                    if (success) {
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }
                  }}
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-5 h-5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Link2 className="w-5 h-5" />
                      Copy Link
                    </>
                  )}
                </Button>

                {/* Generic Share (Mobile) */}
                {navigator.share && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full bg-primary hover:bg-primary-600 text-white border-0"
                    onClick={async () => {
                      const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
                      await shareVictory({
                        championName: champion.username,
                        tournamentSize: currentTournament?.tournament_size || 16,
                        appUrl: `${appUrl}/about`,
                      });
                    }}
                  >
                    <Share2 className="w-5 h-5" />
                    Share...
                  </Button>
                )}
              </div>

              <Button
                variant="ghost"
                size="lg"
                className="w-full mt-4"
                onClick={() => setShowShareModal(false)}
              >
                Close
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            initial={{
              x: Math.random() * window.innerWidth,
              y: window.innerHeight + 100,
              rotate: 0,
              opacity: 0,
            }}
            animate={{
              y: -100,
              rotate: 360,
              opacity: [0, 0.7, 0],
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              delay: Math.random() * 5,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute"
          >
            <div
              className={`w-3 h-3 rounded-full ${
                [
                  "bg-yellow-400",
                  "bg-pink-400",
                  "bg-blue-400",
                  "bg-green-400",
                  "bg-purple-400",
                ][i % 5]
              }`}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
};
