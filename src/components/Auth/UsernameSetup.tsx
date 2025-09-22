import React, { useState } from "react";
import { User, Crown, Sparkles, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { AuthService } from "../../services/authService";
import { useStore } from "../../store/useStore";
import { supabase } from "../../lib/supabase";
import { Button, Card, Heading, Text } from "../ui";

export const UsernameSetup: React.FC = () => {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { setError, setUser } = useStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user found");

      const profile = await AuthService.createOrUpdateProfile(
        user.id,
        username.trim()
      );
      setUser(profile);
    } catch (error) {
      if (error instanceof Error && error.message.includes("duplicate key")) {
        setError("Username is already taken. Please choose a different one.");
      } else {
        setError(
          error instanceof Error ? error.message : "Failed to create profile"
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isValidUsername =
    username.trim().length >= 3 && /^[a-zA-Z0-9_-]+$/.test(username.trim());

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-md mx-auto"
    >
      <Card className="overflow-hidden">
        {/* Header with animated elements */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mb-6">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="bg-gradient-to-br from-primary to-primary-600 p-4 rounded-2xl shadow-lg mr-3"
            >
              <Crown className="w-8 h-8 text-white" />
            </motion.div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
              className="bg-gradient-to-br from-secondary to-secondary-600 p-4 rounded-2xl shadow-lg"
            >
              <User className="w-8 h-8 text-white" />
            </motion.div>
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360],
              }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
              className="absolute top-0 right-0"
            >
              <Sparkles className="w-5 h-5 text-accent" />
            </motion.div>
          </div>

          <Heading
            level={1}
            className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-3"
          >
            Choose Your Battle Name
          </Heading>
          <Text className="text-textcolor-secondary">
            This will be your identity in the creative arena. Choose wisely,
            warrior!
          </Text>
        </motion.div>

        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Username Field */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-semibold text-textcolor-light-secondary mb-2"
            >
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`w-full px-4 py-3 pl-12 pr-12 border rounded-xl text-textcolor-light-secondary focus:ring-2 focus:ring-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  username.trim() && isValidUsername
                    ? "border-accent focus:border-accent"
                    : username.trim() && !isValidUsername
                    ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                    : "border-gray-300 focus:border-primary"
                }`}
                placeholder="Enter your username"
                minLength={3}
                maxLength={20}
                pattern="^[a-zA-Z0-9_-]+$"
                title="Username can only contain letters, numbers, underscores, and hyphens"
                required
                disabled={isLoading}
              />
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-textcolor-secondary" />

              {/* Validation Icon */}
              {username.trim() && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2"
                >
                  {isValidUsername ? (
                    <CheckCircle className="w-4 h-4 text-accent" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-red-400" />
                  )}
                </motion.div>
              )}
            </div>

            {/* Helper Text */}
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ delay: 0.6, duration: 0.3 }}
              className="mt-2"
            >
              <Text
                variant="small"
                className={`${
                  username.trim() && !isValidUsername
                    ? "text-red-500"
                    : "text-textcolor-secondary"
                }`}
              >
                3-20 characters, letters, numbers, underscores, and hyphens only
              </Text>
            </motion.div>
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
              disabled={isLoading || !isValidUsername}
              isLoading={isLoading}
              className="w-full"
            >
              {!isLoading && <Crown className="w-4 h-4" />}
              Enter the Arena
            </Button>
          </motion.div>
        </motion.form>

        {/* Motivational Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-8 text-center pt-6 border-t border-gray-200"
        >
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <Text
              variant="small"
              className="text-textcolor-secondary font-medium"
            >
              Ready to showcase your creativity?
            </Text>
            <Sparkles className="w-4 h-4 text-accent" />
          </div>
        </motion.div>
      </Card>
    </motion.div>
  );
};
