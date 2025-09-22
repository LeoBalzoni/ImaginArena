import { useEffect, useRef } from "react";
import { useStore } from "./store/useStore";
import { AuthService } from "./services/authService";
import { LoginForm } from "./components/Auth/LoginForm";
import { UsernameSetup } from "./components/Auth/UsernameSetup";
import { LobbyScreen } from "./components/Lobby/LobbyScreen";
import { TournamentBracket } from "./components/Tournament/TournamentBracket";
import { WinnerScreen } from "./components/Tournament/WinnerScreen";
import { MatchScreen } from "./components/Match/MatchScreen";
import { AdminDashboard } from "./components/Admin/AdminDashboard";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { LoadingSpinner } from "./components/ui";
import { TournamentService } from "./services/tournamentService";

function App() {
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
    if (currentTournament?.status !== "finished" || !matches.length)
      return null;

    const finalMatch = matches.find(
      (match) => match.round === 1 && match.winner_id
    );

    if (!finalMatch?.winner_id) return null;

    return participants.find((p) => p.id === finalMatch.winner_id) || null;
  };

  const champion = getChampion();

  const handleBackToLobby = async () => {
    try {
      await TournamentService.leaveTournament();
      setCurrentView("lobby");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to return to lobby"
      );
    }
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
        setCurrentView("tournament");
      } else if (currentTournament.status === "finished") {
        setCurrentView("results");
      }
    }
  }, [isAuthenticated, user, currentTournament, setCurrentView]);

  // Show loading spinner during initial load
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-textcolor-secondary">Loading ImaginArena...</p>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
        <LoginForm />
      </div>
    );
  }

  // Show username setup if authenticated but no user profile
  if (isAuthenticated && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
        <UsernameSetup />
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
