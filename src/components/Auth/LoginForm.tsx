import React, { useState } from "react";
import { Mail, Eye, EyeOff, Crown, Sparkles, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthService } from "../../services/authService";
import { useStore } from "../../store/useStore";
import { Button, Card, Heading, Text } from "../ui";

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { setError } = useStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isSignUp && !username)) return;

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
              <Heading level={2} className="text-xl mb-2">
                {isSignUp ? "Join the Arena" : "Welcome Back"}
              </Heading>
              <Text className="text-textcolor-secondary">
                {isSignUp
                  ? "Create an account to join the creative competition"
                  : "Sign in to continue your creative journey"}
              </Text>
            </motion.div>
          </AnimatePresence>
        </motion.div>

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
              className="block text-sm font-semibold text-textcolor-primary mb-2"
            >
              Email address
            </label>
            <div className="relative">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Enter your email"
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
                  className="block text-sm font-semibold text-textcolor-primary mb-2"
                >
                  Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Choose a username"
                    required={isSignUp}
                    disabled={isLoading}
                    minLength={3}
                    maxLength={20}
                  />
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-textcolor-secondary" />
                </div>
                <Text variant="small" className="text-textcolor-secondary mt-1">
                  Username must be 3-20 characters long
                </Text>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Password Field */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-textcolor-primary mb-2"
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder={
                  isSignUp ? "Create a password" : "Enter your password"
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
                Password must be at least 6 characters long
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
                isLoading || !email || !password || (isSignUp && !username)
              }
              isLoading={isLoading}
              className="w-full"
            >
              {!isLoading && <Mail className="w-4 h-4" />}
              {isSignUp ? "Create Account" : "Sign In"}
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
            variant="ghost"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setPassword("");
              setUsername("");
              setError(null);
            }}
            disabled={isLoading}
            className="text-textcolor-secondary hover:text-textcolor-primary"
          >
            {isSignUp
              ? "Already have an account? Sign in"
              : "Don't have an account? Sign up"}
          </Button>
        </motion.div>
      </Card>
    </motion.div>
  );
};
