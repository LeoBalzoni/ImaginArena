import React, { useEffect, useRef, useState } from "react";
import { Clock, Crown, Loader2, Play, Users, RefreshCw } from "lucide-react";
import { useStore } from "../../store/useStore";
import { TournamentService } from "../../services/tournamentService";

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
  const isLoadingRef = useRef(false);

  useEffect(() => {
    if (!isLoadingRef.current) {
      isLoadingRef.current = true;
      loadTournament().finally(() => {
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

  const loadTournament = async () => {
    setIsLoadingTournament(true);
    try {
      let tournament = await TournamentService.getCurrentTournament();

      if (!tournament) {
        tournament = await TournamentService.createTournament();
      }

      setCurrentTournament(tournament);

      const tournamentParticipants =
        await TournamentService.getTournamentParticipants(tournament.id);
      setParticipants(tournamentParticipants);
    } catch (error) {
      console.error("Failed to load tournament:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load tournament"
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
    if (!currentTournament) return;

    try {
      await TournamentService.startTournament(currentTournament.id);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to start tournament"
      );
    }
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
    const slots = Array.from({ length: 16 }, (_, i) => {
      const participant = participants[i];
      return (
        <div
          key={i}
          className={`
            aspect-square rounded-lg border-2 border-dashed flex items-center justify-center
            ${
              participant
                ? "border-primary-300 bg-primary-50"
                : "border-gray-300 bg-gray-50"
            }
          `}
        >
          {participant ? (
            <div className="text-center">
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-1">
                <Users className="w-4 h-4 text-white" />
              </div>
              <p className="text-xs font-medium text-gray-900 truncate px-1">
                {participant.username}
              </p>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-1">
                <Users className="w-4 h-4 text-gray-500" />
              </div>
              <p className="text-xs text-gray-500">Waiting...</p>
            </div>
          )}
        </div>
      );
    });

    return <div className="grid grid-cols-4 gap-3 mb-8">{slots}</div>;
  };

  if (isLoadingTournament) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <Crown className="w-16 h-16 text-primary-600 mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-gray-900 mb-2">ImaginArena</h1>
        <p className="text-xl text-gray-600">Tournament Lobby</p>
      </div>

      <div className="card mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Players ({participants.length}/16)
          </h2>
          <div className="flex items-center gap-4">
            <button
              onClick={refreshParticipants}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh participant list"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>
                {participants.length >= 2
                  ? "Ready to start!"
                  : "Need at least 2 players..."}
              </span>
            </div>
          </div>
        </div>

        {renderParticipantGrid()}

        <div className="text-center space-y-4">
          {!isUserInTournament() ? (
            <button
              onClick={joinTournament}
              disabled={isJoining || participants.length >= 16}
              className="btn-primary flex items-center gap-2 mx-auto"
            >
              {isJoining ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {participants.length >= 16
                ? "Tournament Full"
                : "Join Tournament"}
            </button>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-center gap-2 text-green-800">
                  <Users className="w-5 h-5" />
                  <span className="font-medium">You're in the tournament!</span>
                </div>
                <p className="text-sm text-green-600 mt-1">
                  {participants.length >= 2
                    ? "Tournament ready to start!"
                    : "Waiting for more players..."}
                </p>
              </div>

              {/* Manual start button */}
              {participants.length >= 2 && (
                <button
                  onClick={startTournament}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 mx-auto"
                >
                  <Crown className="w-4 h-4" />
                  Start Tournament ({participants.length} players)
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          How it works
        </h3>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
              1
            </div>
            <p>At least 2 players join the tournament lobby</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
              2
            </div>
            <p>Tournament starts manually with single-elimination brackets</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
              3
            </div>
            <p>
              Each match has a creative prompt - generate and submit your best
              image
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
              4
            </div>
            <p>
              Other players vote for their favorite - winner advances to the
              next round
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
