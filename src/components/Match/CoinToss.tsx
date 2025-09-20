import React, { useState, useEffect } from "react";
import { Trophy } from "lucide-react";

interface CoinTossProps {
  player1Name: string;
  player2Name: string;
  onComplete: (winnerId: string) => void;
  player1Id: string;
  player2Id: string;
}

export const CoinToss: React.FC<CoinTossProps> = ({
  player1Name,
  player2Name,
  onComplete,
  player1Id,
  player2Id,
}) => {
  const [isFlipping, setIsFlipping] = useState(false);
  const [result, setResult] = useState<"heads" | "tails" | null>(null);
  const [winner, setWinner] = useState<string | null>(null);

  useEffect(() => {
    // Start the coin toss animation
    setIsFlipping(true);

    // Determine winner randomly
    const coinResult = Math.random() < 0.5 ? "heads" : "tails";
    const winnerId = coinResult === "heads" ? player1Id : player2Id;
    const winnerName = coinResult === "heads" ? player1Name : player2Name;

    // Show flipping animation for 3 seconds
    setTimeout(() => {
      setIsFlipping(false);
      setResult(coinResult);
      setWinner(winnerName);

      // Call onComplete after showing result for 2 seconds
      setTimeout(() => {
        onComplete(winnerId);
      }, 5000);
    }, 3000);
  }, [player1Id, player2Id, player1Name, player2Name, onComplete]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          It's a Tie! 🪙
        </h2>
        <p className="text-gray-600 mb-6">
          Flipping a coin to determine the winner...
        </p>

        {/* Coin Animation */}
        <div className="flex justify-center mb-6">
          <div
            className={`
              w-24 h-24 rounded-full border-4 border-yellow-400 bg-gradient-to-br from-yellow-300 to-yellow-500
              flex items-center justify-center text-2xl font-bold text-yellow-800
              ${isFlipping ? "animate-spin" : ""}
              transition-all duration-500
            `}
            style={{
              animation: isFlipping
                ? "spin 0.1s linear infinite, bounce 0.5s ease-in-out infinite alternate"
                : "none",
            }}
          >
            {isFlipping ? "🪙" : result === "heads" ? "HEADS" : "TAILS"}
          </div>
        </div>

        {/* Players */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div
            className={`p-3 rounded-lg border-2 ${
              result === "heads" && !isFlipping
                ? "border-green-500 bg-green-50"
                : "border-gray-200"
            }`}
          >
            <div className="text-sm text-gray-600">Heads</div>
            <div className="font-semibold">{player1Name}</div>
            {result === "heads" && !isFlipping && (
              <Trophy className="w-5 h-5 text-yellow-600 mx-auto mt-1" />
            )}
          </div>
          <div
            className={`p-3 rounded-lg border-2 ${
              result === "tails" && !isFlipping
                ? "border-green-500 bg-green-50"
                : "border-gray-200"
            }`}
          >
            <div className="text-sm text-gray-600">Tails</div>
            <div className="font-semibold">{player2Name}</div>
            {result === "tails" && !isFlipping && (
              <Trophy className="w-5 h-5 text-yellow-600 mx-auto mt-1" />
            )}
          </div>
        </div>

        {/* Result */}
        {!isFlipping && winner && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <Trophy className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-lg font-bold text-gray-900">Winner: {winner}!</p>
            <p className="text-sm text-gray-600 mt-1">
              Coin landed on {result}
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes bounce {
          0% {
            transform: translateY(0px) rotateY(0deg);
          }
          100% {
            transform: translateY(-20px) rotateY(180deg);
          }
        }
      `}</style>
    </div>
  );
};
