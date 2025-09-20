import React, { useState } from "react";
import { User, Loader2 } from "lucide-react";
import { AuthService } from "../../services/authService";
import { useStore } from "../../store/useStore";
import { supabase } from "../../lib/supabase";

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

  return (
    <div className="card max-w-md mx-auto">
      <div className="text-center mb-8">
        <User className="w-12 h-12 text-primary-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Choose your username
        </h2>
        <p className="text-gray-600">
          This will be displayed to other players during battles
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="username"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Username
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input-field"
            placeholder="Enter your username"
            minLength={3}
            maxLength={20}
            pattern="^[a-zA-Z0-9_-]+$"
            title="Username can only contain letters, numbers, underscores, and hyphens"
            required
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500 mt-1">
            3-20 characters, letters, numbers, underscores, and hyphens only
          </p>
        </div>
        <button
          type="submit"
          disabled={isLoading || !username.trim()}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <User className="w-4 h-4" />
          )}
          Create Profile
        </button>
      </form>
    </div>
  );
};
