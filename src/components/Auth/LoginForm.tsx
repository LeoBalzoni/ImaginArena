import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Mail,
  Eye,
  EyeOff,
  Crown,
  Sparkles,
  User,
  Check,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthService } from "../../services/authService";
import { useStore } from "../../store/useStore";
import { Button, Card, DarkAwareHeading, Heading, Text } from "../ui";

export const LoginForm: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");
  const { setError, error } = useStore();

  // Debounced username availability check
  const checkUsernameAvailability = useCallback(
    async (usernameToCheck: string) => {
      if (!usernameToCheck || usernameToCheck.length < 3) {
        setUsernameStatus("invalid");
        return;
      }

      setUsernameStatus("checking");

      try {
        const isAvailable = await AuthService.isUsernameAvailable(
          usernameToCheck
        );
        setUsernameStatus(isAvailable ? "available" : "taken");
      } catch (error) {
        console.error("Error checking username availability:", error);
        setUsernameStatus("idle");
      }
    },
    []
  );

  // Debounce username checking
  useEffect(() => {
    if (!isSignUp || !username) {
      setUsernameStatus("idle");
      return;
    }

    const timeoutId = setTimeout(() => {
      checkUsernameAvailability(username);
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [username, isSignUp, checkUsernameAvailability]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isSignUp && !username)) return;

    // Prevent submission if username is not available
    if (isSignUp && usernameStatus === "taken") {
      setError(t("auth.chooseDifferentUsername"));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        await AuthService.signUpWithPassword(email, password, username);
      } else {
        await AuthService.signInWithPassword(email, password);
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : `Failed to ${isSignUp ? "sign up" : "sign in"}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-md mx-auto"
    >
      <Card className="overflow-hidden">
        {/* Header with animated logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mb-4">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="bg-gradient-to-br from-primary to-primary-600 p-3 rounded-2xl shadow-lg mr-3"
            >
              <Crown className="w-8 h-8 text-white" />
            </motion.div>
            <div className="relative">
              <Heading
                level={1}
                className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
              >
                ImaginArena
              </Heading>
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 180, 360],
                }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                className="absolute -top-2 -right-6"
              >
                <Sparkles className="w-4 h-4 text-accent" />
              </motion.div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={isSignUp ? "signup" : "signin"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <DarkAwareHeading
                onDark={true}
                level={2}
                className="text-xl mb-2"
              >
                {isSignUp ? t("auth.joinArena") : t("auth.welcomeBack")}
              </DarkAwareHeading>
              <Text className="text-textcolor-secondary">
                {isSignUp ? t("auth.signUpSubtitle") : t("auth.signInSubtitle")}
              </Text>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <Text className="text-red-800 font-medium text-sm leading-relaxed">
                    {error}
                  </Text>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-600 transition-colors"
                  type="button"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Email Field */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-textcolor-light-secondary mb-2"
            >
              {t("auth.emailAddress")}
            </label>
            <div className="relative">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-textcolor-light-secondary text-textcolor-light-secondary"
                placeholder={t("auth.emailPlaceholder")}
                required
                disabled={isLoading}
              />
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-textcolor-secondary" />
            </div>
          </div>

          {/* Username Field (Sign Up Only) */}
          <AnimatePresence>
            {isSignUp && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <label
                  htmlFor="username"
                  className="block text-sm font-semibold text-textcolor-light-secondary mb-2"
                >
                  {t("auth.username")}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={`w-full px-4 py-3 pl-12 pr-12 border rounded-xl focus:ring-2 focus:ring-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-textcolor-light-secondary text-textcolor-light-secondary ${
                      usernameStatus === "available"
                        ? "border-green-300 focus:border-green-500"
                        : usernameStatus === "taken"
                        ? "border-red-300 focus:border-red-500"
                        : "border-gray-300 focus:border-primary"
                    }`}
                    placeholder={t("auth.usernamePlaceholder")}
                    required={isSignUp}
                    disabled={isLoading}
                    minLength={3}
                    maxLength={20}
                  />
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-textcolor-secondary" />

                  {/* Username status indicator */}
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    {usernameStatus === "checking" && (
                      <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                    )}
                    {usernameStatus === "available" && (
                      <Check className="w-4 h-4 text-green-500" />
                    )}
                    {usernameStatus === "taken" && (
                      <X className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
                <div className="mt-1 space-y-1">
                  <Text variant="small" className="text-textcolor-secondary">
                    {t("auth.usernameLength")}
                  </Text>
                  {usernameStatus === "available" && (
                    <div className="text-green-500 text-sm flex items-center gap-1 font-medium">
                      <Check className="w-3 h-3" />
                      {t("auth.usernameAvailable")}
                    </div>
                  )}
                  {usernameStatus === "taken" && (
                    <div className="text-red-500 text-sm flex items-center gap-1 font-medium">
                      <X className="w-3 h-3" />
                      {t("auth.usernameTaken")}
                    </div>
                  )}
                  {usernameStatus === "checking" && (
                    <div className="text-gray-300 text-sm flex items-center gap-1 font-medium">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {t("auth.checkingAvailability")}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Password Field */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-textcolor-light-secondary mb-2"
            >
              {t("auth.password")}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-textcolor-light-secondary text-textcolor-light-secondary"
                placeholder={
                  isSignUp ? t("auth.createPassword") : t("auth.enterPassword")
                }
                required
                disabled={isLoading}
                minLength={isSignUp ? 6 : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-textcolor-secondary hover:text-textcolor-primary transition-colors"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {isSignUp && (
              <Text variant="small" className="text-textcolor-secondary mt-1">
                {t("auth.passwordLength")}
              </Text>
            )}
          </div>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={
                isLoading ||
                !email ||
                !password ||
                (isSignUp &&
                  (!username ||
                    usernameStatus === "taken" ||
                    usernameStatus === "checking"))
              }
              isLoading={isLoading}
              className="w-full"
            >
              {!isLoading && <Mail className="w-4 h-4" />}
              {isSignUp ? t("auth.createAccount") : t("auth.signIn")}
            </Button>
          </motion.div>
        </motion.form>

        {/* Toggle Sign Up/Sign In */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-8 text-center pt-6 border-t border-gray-200"
        >
          <Button
            variant="outline"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setPassword("");
              setUsername("");
              setError(null);
            }}
            disabled={isLoading}
            className="text-primary hover:text-primary-600 font-semibold transition-colors duration-200 mx-auto"
          >
            {isSignUp
              ? t("auth.alreadyHaveAccount")
              : t("auth.dontHaveAccount")}
          </Button>
        </motion.div>
      </Card>
    </motion.div>
  );
};
