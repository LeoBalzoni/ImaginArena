import React, { useState } from "react";
import { Mail, Eye, EyeOff, Loader2 } from "lucide-react";
import { AuthService } from "../../services/authService";
import { useStore } from "../../store/useStore";

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
    <div className="card max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {isSignUp ? "Join" : "Welcome to"} ImaginArena
        </h1>
        <p className="text-gray-600">
          {isSignUp
            ? "Create an account to join the creative competition"
            : "Sign in to join the creative competition"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Email address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            placeholder="Enter your email"
            required
            disabled={isLoading}
          />
        </div>

        {isSignUp && (
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
              placeholder="Choose a username"
              required={isSignUp}
              disabled={isLoading}
              minLength={3}
              maxLength={20}
            />
            <p className="text-xs text-gray-500 mt-1">
              Username must be 3-20 characters long
            </p>
          </div>
        )}

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field pr-10"
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
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
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
            <p className="text-xs text-gray-500 mt-1">
              Password must be at least 6 characters long
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || !email || !password || (isSignUp && !username)}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Mail className="w-4 h-4" />
          )}
          {isSignUp ? "Create Account" : "Sign In"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={() => {
            setIsSignUp(!isSignUp);
            setPassword("");
            setUsername("");
            setError(null);
          }}
          className="text-sm text-gray-600 hover:text-gray-800"
          disabled={isLoading}
        >
          {isSignUp
            ? "Already have an account? Sign in"
            : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  );
};
