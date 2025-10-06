import React, { useEffect, useRef, useState } from "react";
import {
  Clock,
  Crown,
  Play,
  Users,
  RefreshCw,
  Settings,
  Bot,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../../store/useStore";
import { TournamentService } from "../../services/tournamentService";
import { TournamentSelection } from "../Tournament/TournamentSelection";
import { BotService } from "../../services/botService";
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
import type { Tournament } from "../../lib/supabase";

export const LobbyScreen: React.FC = () => {
  const {
    user,
    currentTournament,
    participants,
    setCurrentTournament,
    setParticipants,
    setError,
    isUserInTournament,
  } = useStore();

  const [isJoining, setIsJoining] = useState(false);
  const [isLoadingTournament, setIsLoadingTournament] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isFilling, setIsFilling] = useState(false);
  const [fillWithBots, setFillWithBots] = useState(false);
  const [showTournamentSelection, setShowTournamentSelection] = useState(false);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    if (!isLoadingRef.current) {
      isLoadingRef.current = true;
      checkCurrentTournament().finally(() => {
        isLoadingRef.current = false;
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (currentTournament) {
      const unsubscribe = TournamentService.subscribeToTournamentUpdates(
        currentTournament.id
      );

      return () => {
        unsubscribe();
      };
    }
  }, [currentTournament]);

  const checkCurrentTournament = async () => {
    setIsLoadingTournament(true);
    try {
      const tournament = await TournamentService.getCurrentTournament();

      if (tournament) {
        setCurrentTournament(tournament);
        const tournamentParticipants =
          await TournamentService.getTournamentParticipants(tournament.id);
        setParticipants(tournamentParticipants);
      } else {
        // No active tournament, show tournament selection
        setShowTournamentSelection(true);
      }
    } catch (error) {
      console.error("Failed to check tournament:", error);
      setError(
        error instanceof Error ? error.message : "Failed to check tournament"
      );
    } finally {
      setIsLoadingTournament(false);
    }
  };

  const joinTournament = async () => {
    if (!user || !currentTournament) {
      console.error("Cannot join tournament: missing user or tournament", {
        user: !!user,
        currentTournament: !!currentTournament,
      });
      return;
    }

    console.log("Attempting to join tournament:", {
      tournamentId: currentTournament.id,
      userId: user.id,
      currentParticipants: participants.length,
    });
    setIsJoining(true);
    try {
      await TournamentService.joinTournament(currentTournament.id, user.id);
      console.log("Successfully joined tournament");

      // Force refresh participants as backup
      setTimeout(async () => {
        try {
          const updatedParticipants =
            await TournamentService.getTournamentParticipants(
              currentTournament.id
            );
          setParticipants(updatedParticipants);
        } catch (error) {
          console.error("Error force refreshing participants:", error);
        }
      }, 1000);
    } catch (error) {
      console.error("Failed to join tournament:", error);
      setError(
        error instanceof Error ? error.message : "Failed to join tournament"
      );
    } finally {
      setIsJoining(false);
    }
  };

  const startTournament = async () => {
    if (!currentTournament || !user?.is_admin) return;

    setIsStarting(true);
    try {
      await TournamentService.startTournament(
        currentTournament.id,
        fillWithBots
      );
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to start tournament"
      );
    } finally {
      setIsStarting(false);
    }
  };

  const fillTournamentWithBots = async () => {
    if (!currentTournament || !user?.is_admin) return;

    setIsFilling(true);
    try {
      await TournamentService.fillTournamentWithBots(currentTournament.id);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to fill tournament with bots"
      );
    } finally {
      setIsFilling(false);
    }
  };

  const handleTournamentSelected = (tournament: Tournament) => {
    setCurrentTournament(tournament);
    setShowTournamentSelection(false);
  };

  const handleBackToSelection = () => {
    setCurrentTournament(null);
    setParticipants([]);
    setShowTournamentSelection(true);
  };

  const refreshParticipants = async () => {
    if (!currentTournament) return;

    setIsRefreshing(true);
    try {
      const updatedParticipants =
        await TournamentService.getTournamentParticipants(currentTournament.id);
      setParticipants(updatedParticipants);
    } catch (error) {
      console.error("Error refreshing participants:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to refresh participants"
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  const renderParticipantGrid = () => {
    const tournamentSize = currentTournament?.tournament_size || 16;
    const slots = Array.from({ length: tournamentSize }, (_, i) => {
      const participant = participants[i];
      return (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
          className={`
            aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-2 transition-all duration-200
            ${
              participant
                ? "border-primary-300 bg-primary-50 shadow-sm hover:shadow-glow"
                : "border-gray-300 bg-gray-50"
            }
          `}
        >
          {participant ? (
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm ${
                    BotService.isBot(participant)
                      ? "bg-gradient-to-br from-orange-400 to-orange-600"
                      : "bg-gradient-to-br from-primary to-primary-600"
                  }`}
                >
                  {BotService.isBot(participant) ? (
                    <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  ) : (
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  )}
                </div>
                <p className="text-xs sm:text-sm font-semibold text-textcolor-primary truncate px-1">
                  {BotService.isBot(participant) ? (
                    <span className="flex items-center justify-center gap-1">
                      <span className="text-xs">🤖</span>
                      {participant.username.replace(
                        /^AI_|^CreativeBot_|^PixelMaster_|_\d+$/g,
                        ""
                      )}
                    </span>
                  ) : (
                    participant.username
                  )}
                </p>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="text-center opacity-60">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
              </div>
              <p className="text-xs sm:text-sm text-textcolor-secondary">
                Waiting...
              </p>
            </div>
          )}
        </motion.div>
      );
    });

    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4 mb-8">
        {slots}
      </div>
    );
  };

  if (isLoadingTournament) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading tournament..." />
      </div>
    );
  }

  // Show tournament selection if no current tournament
  if (showTournamentSelection || !currentTournament) {
    return (
      <TournamentSelection onTournamentSelected={handleTournamentSelected} />
    );
  }

  return (
    <Container size="lg" className="py-6 sm:py-8 lg:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8 sm:mb-12"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-primary to-primary-600 rounded-3xl shadow-glow mb-6"
        >
          <Crown className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
        </motion.div>
        <Heading level={1} className="mb-3">
          ImaginArena
        </Heading>
        <div className="flex items-center justify-center gap-3 mb-2">
          <Text variant="body" className="text-lg sm:text-xl">
            Tournament Lobby
          </Text>
          {currentTournament && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
              className="flex items-center gap-2 bg-gradient-to-r from-primary-50 to-secondary-50 border-2 border-primary-200 rounded-full px-4 py-2 shadow-sm"
            >
              <Text className="font-medium text-primary-700">
                Prompt language:
              </Text>
              <span className="text-2xl">
                {currentTournament.language === "it" ? "🇮🇹" : "🇬🇧"}
              </span>
            </motion.div>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <Card className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <DarkAwareHeading
              onDark={true}
              level={2}
              className="text-xl sm:text-2xl"
            >
              Players ({participants.length}/
              {currentTournament?.tournament_size || 16})
            </DarkAwareHeading>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshParticipants}
                isLoading={isRefreshing}
                className="self-start sm:self-auto"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-textcolor-secondary" />
                <Text variant="small" color="secondary">
                  {participants.length >= 2
                    ? "Ready to start!"
                    : "Need at least 2 players..."}
                </Text>
              </div>
            </div>
          </div>

          {renderParticipantGrid()}

          <div className="text-center space-y-6">
            {!isUserInTournament() ? (
              <Button
                variant="primary"
                size="lg"
                onClick={joinTournament}
                isLoading={isJoining}
                disabled={
                  participants.length >=
                  (currentTournament?.tournament_size || 16)
                }
                className="w-full sm:w-auto"
              >
                <Play className="w-5 h-5" />
                {participants.length >=
                (currentTournament?.tournament_size || 16)
                  ? "Tournament Full"
                  : "Join Tournament"}
              </Button>
            ) : (
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gradient-to-r from-accent-50 to-accent-100 border-2 border-accent-200 rounded-2xl p-6"
                >
                  <div className="flex items-center justify-center gap-3 text-accent-800 mb-2">
                    <Users className="w-6 h-6" />
                    <Text className="font-semibold text-lg text-accent-800">
                      You're in the tournament!
                    </Text>
                  </div>
                  <Text variant="small" className="text-accent-700">
                    {participants.length >= 2
                      ? "Tournament ready to start!"
                      : "Waiting for more players..."}
                  </Text>
                </motion.div>

                {/* Admin Controls */}
                {user?.is_admin && participants.length >= 2 && (
                  <div className="space-y-4">
                    {/* Admin Options */}
                    {participants.length <
                      currentTournament?.tournament_size && (
                      <Card className="bg-orange-50 border-orange-200 p-4">
                        <div className="text-center mb-4">
                          <Bot className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                          <DarkAwareHeading
                            level={3}
                            className="text-lg font-semibold text-orange-800"
                          >
                            Admin Controls
                          </DarkAwareHeading>
                          <DarkAwareText className="text-sm text-orange-700">
                            Tournament needs{" "}
                            {(currentTournament?.tournament_size || 16) -
                              participants.length}{" "}
                            more players
                          </DarkAwareText>
                        </div>

                        <div className="space-y-3">
                          <Button
                            onClick={fillTournamentWithBots}
                            disabled={isFilling}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                            size="sm"
                          >
                            {isFilling ? (
                              <>
                                <LoadingSpinner size="sm" />
                                Adding Bots...
                              </>
                            ) : (
                              <>
                                <Bot className="w-4 h-4" />
                                Fill with Bots (
                                {(currentTournament?.tournament_size || 16) -
                                  participants.length}{" "}
                                needed)
                              </>
                            )}
                          </Button>

                          <div className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              id="fillWithBots"
                              checked={fillWithBots}
                              onChange={(e) =>
                                setFillWithBots(e.target.checked)
                              }
                              className="rounded border-orange-300 text-orange-600 focus:ring-orange-500"
                            />
                            <label
                              htmlFor="fillWithBots"
                              className="text-orange-700 cursor-pointer"
                            >
                              Auto-fill with bots when starting
                            </label>
                          </div>
                        </div>
                      </Card>
                    )}

                    {/* Start Tournament Button */}
                    {(participants.length ===
                      currentTournament?.tournament_size ||
                      fillWithBots) && (
                      <Button
                        variant="accent"
                        size="lg"
                        onClick={startTournament}
                        isLoading={isStarting}
                        className="w-full sm:w-auto"
                      >
                        <Crown className="w-5 h-5" />
                        {fillWithBots &&
                        participants.length <
                          (currentTournament?.tournament_size || 16)
                          ? `Start Tournament (${
                              participants.length
                            } players + ${
                              (currentTournament?.tournament_size || 16) -
                              participants.length
                            } bots)`
                          : `Start Tournament (${participants.length} players)`}
                      </Button>
                    )}
                  </div>
                )}

                {participants.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToSelection}
                    className="w-full sm:w-auto"
                  >
                    <Settings className="w-4 h-4" />
                    Choose Different Tournament
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <Card>
          <DarkAwareHeading
            onDark={true}
            level={3}
            className="mb-6 text-center sm:text-left"
          >
            How it works
          </DarkAwareHeading>
          <div className="space-y-4 sm:space-y-6">
            {[
              {
                step: 1,
                text: "At least 2 players join the tournament lobby",
                color: "primary",
              },
              {
                step: 2,
                text: "Tournament starts manually with single-elimination brackets",
                color: "secondary",
              },
              {
                step: 3,
                text: "Each match has a creative prompt - generate and submit your best image",
                color: "accent",
              },
              {
                step: 4,
                text: "Other players vote for their favorite - winner advances to the next round",
                color: "primary",
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1, duration: 0.3 }}
                className="flex items-start gap-4"
              >
                <div
                  className={`
                    w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-bold text-white shadow-sm flex-shrink-0 mt-1
                    ${
                      item.color === "primary"
                        ? "bg-gradient-to-br from-primary to-primary-600"
                        : ""
                    }
                    ${
                      item.color === "secondary"
                        ? "bg-gradient-to-br from-secondary to-secondary-600"
                        : ""
                    }
                    ${
                      item.color === "accent"
                        ? "bg-gradient-to-br from-accent to-accent-600"
                        : ""
                    }
                  `}
                >
                  {item.step}
                </div>
                <DarkAwareText onDark={true} className="flex-1 pt-1 sm:pt-2">
                  {item.text}
                </DarkAwareText>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>
    </Container>
  );
};
