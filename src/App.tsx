import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "./store/useStore";
import { AuthService } from "./services/authService";
import { LoginForm } from "./components/Auth/LoginForm";
import { LobbyScreen } from "./components/Lobby/LobbyScreen";
import { TournamentBracket } from "./components/Tournament/TournamentBracket";
import { WinnerScreen } from "./components/Tournament/WinnerScreen";
import { MatchScreen } from "./components/Match/MatchScreen";
import { AdminDashboard } from "./components/Admin/AdminDashboard";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { LoadingSpinner } from "./components/ui";

function App() {
  const { t } = useTranslation();
  const {
    user,
    isAuthenticated,
    currentTournament,
    currentView,
    isLoading,
    error,
    setError,
    setCurrentView,
    participants,
    matches,
  } = useStore();

  const authInitialized = useRef(false);

  // Get tournament champion
  const getChampion = () => {
    if (!matches.length || !currentTournament) return null;

    // Calculate the expected final round based on tournament size
    const tournamentSize = currentTournament.tournament_size || 16;
    const expectedFinalRound = Math.log2(tournamentSize);

    // Find completed matches
    const completedMatches = matches.filter((match) => match.winner_id);
    if (completedMatches.length === 0) return null;

    // Check if we have a completed match in the final round
    const finalRoundMatches = completedMatches.filter(
      (m) => m.round === expectedFinalRound
    );

    // The tournament is complete when there's exactly one completed match in the final round
    if (finalRoundMatches.length !== 1) return null;

    const finalMatch = finalRoundMatches[0];
    return participants.find((p) => p.id === finalMatch.winner_id) || null;
  };

  // Check if tournament has a champion (final match completed)
  const hasTournamentChampion = () => {
    if (!matches.length || !currentTournament) return false;

    // Calculate the expected final round based on tournament size
    const tournamentSize = currentTournament.tournament_size || 16;
    const expectedFinalRound = Math.log2(tournamentSize);

    // Find completed matches in the final round
    const completedMatches = matches.filter((match) => match.winner_id);
    if (completedMatches.length === 0) return false;

    const finalRoundMatches = completedMatches.filter(
      (m) => m.round === expectedFinalRound
    );

    // Tournament has a champion when there's exactly one completed match in the final round
    return finalRoundMatches.length === 1;
  };

  const champion = getChampion();

  const handleBackToLobby = () => {
    setCurrentView("lobby");
  };

  useEffect(() => {
    // Initialize auth listener only once
    if (!authInitialized.current) {
      AuthService.initAuthListener();
      authInitialized.current = true;
    }
  }, []);

  useEffect(() => {
    // Determine current view based on app state
    if (isAuthenticated && user && currentTournament) {
      if (currentTournament.status === "lobby") {
        setCurrentView("lobby");
      } else if (currentTournament.status === "in_progress") {
        // Show winner screen if tournament has a champion, otherwise show tournament bracket
        if (hasTournamentChampion()) {
          setCurrentView("results");
        } else {
          setCurrentView("tournament");
        }
      } else if (currentTournament.status === "finished") {
        setCurrentView("results");
      }
    }
  }, [isAuthenticated, user, currentTournament, matches, setCurrentView]);

  // Show loading spinner during initial load
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-textcolor-secondary">{t("app.loading")}</p>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated or no user profile
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
        <LoginForm />
      </div>
    );
  }

  // Main application
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-background-light to-primary-50 flex flex-col">
        <Header />

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mx-4 mt-4 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700 text-xl font-bold ml-4 transition-colors"
                aria-label="Close error"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1">
          {currentView === "lobby" && <LobbyScreen />}
          {currentView === "tournament" && <TournamentBracket />}
          {currentView === "match" && <MatchScreen />}
          {currentView === "results" && champion && (
            <WinnerScreen
              champion={champion}
              onBackToLobby={handleBackToLobby}
            />
          )}
          {currentView === "results" && !champion && <TournamentBracket />}
          {currentView === "admin" && user?.is_admin && <AdminDashboard />}
        </main>

        <Footer />
      </div>
    </ErrorBoundary>
  );
}

export default App;
