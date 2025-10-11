import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Crown,
  LogOut,
  User,
  Trophy,
  Users,
  Settings,
  Sparkles,
  Info,
  Lightbulb,
} from "lucide-react";
import { motion } from "framer-motion";
import { useStore } from "../store/useStore";
import { AuthService } from "../services/authService";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Button, Container, Heading, Text } from "./ui";

export const Header: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, currentTournament, participants, setCurrentView, currentView } =
    useStore();

  const handleSignOut = async () => {
    try {
      await AuthService.signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const getStatusText = () => {
    if (!currentTournament) return t("header.noActiveTournament");

    switch (currentTournament.status) {
      case "lobby":
        return t("header.lobbyStatus", {
          count: participants.length,
          total: currentTournament.tournament_size,
        });
      case "in_progress":
        return t("header.tournamentInProgress");
      case "finished":
        return t("header.tournamentFinished");
      default:
        return t("header.unknownStatus");
    }
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-primary-100"
    >
      <Container>
        <motion.div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo and Title */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
                className="bg-gradient-to-br from-primary to-primary-600 p-2 rounded-xl shadow-lg"
              >
                <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </motion.div>
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="absolute -top-1 -right-1"
              >
                <Sparkles className="w-3 h-3 text-accent" />
              </motion.div>
            </div>
            <div>
              <Heading
                level={2}
                className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
              >
                {t("app.title")}
              </Heading>
              <Text variant="small" className="text-textcolor-secondary">
                {getStatusText()}
              </Text>
            </div>
          </motion.div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            <LanguageSwitcher />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/about")}
              className="transition-all duration-200"
            >
              <Info className="w-4 h-4" />
              {t("footer.about")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/tips")}
              className="transition-all duration-200"
            >
              <Lightbulb className="w-4 h-4" />
              {t("header.tips")}
            </Button>

            {/* Only show Lobby button when tournament is in lobby status or no tournament */}
            {(!currentTournament ||
              currentTournament.status === "lobby" ||
              currentTournament.status === "finished") && (
              <Button
                variant={currentView === "lobby" ? "primary" : "ghost"}
                size="sm"
                onClick={() => setCurrentView("lobby")}
                className="transition-all duration-200"
              >
                <Users className="w-4 h-4" />
                {t("header.lobby")}
              </Button>
            )}

            {currentTournament && currentTournament.status !== "lobby" && (
              <Button
                variant={
                  currentView === "tournament" || currentView === "results"
                    ? "primary"
                    : "ghost"
                }
                size="sm"
                onClick={() => setCurrentView("tournament")}
                className="transition-all duration-200"
              >
                <Trophy className="w-4 h-4" />
                {t("header.tournament")}
              </Button>
            )}

            {/* Admin Navigation - Only show for admin users */}
            {user?.is_admin && (
              <Button
                variant={currentView === "admin" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setCurrentView("admin")}
                className="transition-all duration-200"
              >
                <Settings className="w-4 h-4" />
                {t("header.admin")}
              </Button>
            )}
          </nav>

          {/* User Menu */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex items-center gap-2"
          >
            {/* Desktop username */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-primary-50 rounded-xl">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <Text className="font-semibold text-textcolor-primary">
                {user?.username}
              </Text>
            </div>

            {/* Mobile username - compact */}
            <div className="sm:hidden flex items-center gap-1.5 px-2 py-1 bg-primary-50 rounded-lg max-w-[100px]">
              <div className="w-5 h-5 bg-gradient-to-br from-primary to-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-3 h-3 text-white" />
              </div>
              <Text
                variant="small"
                className="font-semibold text-textcolor-primary text-xs truncate"
              >
                {user?.username}
              </Text>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="p-2 hover:bg-red-50 hover:text-red-600 transition-colors"
              title={t("header.signOut")}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </motion.div>
        </motion.div>
      </Container>

      {/* Mobile Navigation */}
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="md:hidden border-t border-primary-100 bg-gradient-to-r from-primary-25 to-secondary-25"
      >
        <Container>
          <div className="py-2 flex items-center gap-1.5">
            <LanguageSwitcher />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/about")}
              className="flex-1 px-2 py-1.5 justify-center"
            >
              <Info className="w-4 h-4" />
              <span className="text-xs">{t("footer.about")}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/tips")}
              className="flex-1 px-2 py-1.5 justify-center"
            >
              <Lightbulb className="w-4 h-4" />
              <span className="text-xs">{t("header.tips")}</span>
            </Button>

            {/* Only show Lobby button when tournament is in lobby status or no tournament */}
            {(!currentTournament || currentTournament.status === "lobby") && (
              <Button
                variant={currentView === "lobby" ? "primary" : "ghost"}
                size="sm"
                onClick={() => setCurrentView("lobby")}
                className="flex-1 px-2 py-1.5 justify-center"
              >
                <Users className="w-4 h-4" />
                <span className="text-xs">{t("header.lobby")}</span>
              </Button>
            )}

            {currentTournament && currentTournament.status !== "lobby" && (
              <Button
                variant={
                  currentView === "tournament" || currentView === "results"
                    ? "primary"
                    : "ghost"
                }
                size="sm"
                onClick={() => setCurrentView("tournament")}
                className="flex-1 px-2 py-1.5 justify-center"
              >
                <Trophy className="w-4 h-4" />
                <span className="text-xs">{t("header.tournament")}</span>
              </Button>
            )}

            {/* Admin Navigation - Mobile */}
            {user?.is_admin && (
              <Button
                variant={currentView === "admin" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setCurrentView("admin")}
                className="flex-1 px-2 py-1.5 justify-center"
              >
                <Settings className="w-4 h-4" />
                <span className="text-xs">{t("header.admin")}</span>
              </Button>
            )}
          </div>
        </Container>
      </motion.div>
    </motion.header>
  );
};
