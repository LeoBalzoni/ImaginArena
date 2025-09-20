import React, { useState } from "react";
import { Mail, Github, Chrome, Loader2 } from "lucide-react";
import { AuthService } from "../../services/authService";
import { useStore } from "../../store/useStore";

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const { setError } = useStore();

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError(null);

    try {
      await AuthService.signInWithMagicLink(email);
      setMagicLinkSent(true);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to send magic link"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGitHub = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await AuthService.signInWithGitHub();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to sign in with GitHub"
      );
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await AuthService.signInWithGoogle();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to sign in with Google"
      );
      setIsLoading(false);
    }
  };

  if (magicLinkSent) {
    return (
      <div className="card max-w-md mx-auto">
        <div className="text-center">
          <Mail className="w-12 h-12 text-primary-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Check your email
          </h2>
          <p className="text-gray-600 mb-4">
            We've sent a magic link to <strong>{email}</strong>
          </p>
          <p className="text-sm text-gray-500">
            Click the link in your email to sign in to Prompt Battles
          </p>
          <button
            onClick={() => setMagicLinkSent(false)}
            className="mt-4 text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            Try a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to Prompt Battles
        </h1>
        <p className="text-gray-600">
          Sign in to join the creative competition
        </p>
      </div>

      <form onSubmit={handleMagicLink} className="space-y-4 mb-6">
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
        <button
          type="submit"
          disabled={isLoading || !email}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Mail className="w-4 h-4" />
          )}
          Send Magic Link
        </button>
      </form>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleGitHub}
          disabled={isLoading}
          className="btn-secondary w-full flex items-center justify-center gap-2"
        >
          <Github className="w-4 h-4" />
          Continue with GitHub
        </button>
        <button
          onClick={handleGoogle}
          disabled={isLoading}
          className="btn-secondary w-full flex items-center justify-center gap-2"
        >
          <Chrome className="w-4 h-4" />
          Continue with Google
        </button>
      </div>
    </div>
  );
};
