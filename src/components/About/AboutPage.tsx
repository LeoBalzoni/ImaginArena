import React from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Sparkles,
  Users,
  Image as ImageIcon,
  Vote,
  Zap,
  ArrowRight,
  X,
} from "lucide-react";
import { Button, Card, Container, Heading, Text } from "../ui";

interface AboutPageProps {
  onClose?: () => void;
  onGetStarted?: () => void;
}

/**
 * Landing/About page explaining ImaginArena
 * Perfect for sharing with birthday party invitees
 */
export const AboutPage: React.FC<AboutPageProps> = ({
  onClose,
  onGetStarted,
}) => {
  const features = [
    {
      icon: Users,
      title: "Join Tournaments",
      description:
        "Compete with friends in real-time tournaments of 2-32 players",
      color: "text-primary",
      bgColor: "bg-primary-50",
    },
    {
      icon: Sparkles,
      title: "Creative Prompts",
      description:
        "Get unique AI prompts and create stunning images to match them",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      icon: ImageIcon,
      title: "Submit Your Art",
      description: "Upload your AI-generated masterpieces and compete head-to-head",
      color: "text-accent",
      bgColor: "bg-accent-50",
    },
    {
      icon: Vote,
      title: "Community Voting",
      description: "Vote for your favorite creations and help decide the winners",
      color: "text-secondary",
      bgColor: "bg-secondary-50",
    },
    {
      icon: Trophy,
      title: "Climb the Bracket",
      description:
        "Win matches to advance through the tournament bracket to victory",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      icon: Zap,
      title: "Real-time Updates",
      description: "Experience live match updates and instant results",
      color: "text-pink-600",
      bgColor: "bg-pink-50",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-accent relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              scale: 0,
            }}
            animate={{
              scale: [0, 1, 0],
              rotate: [0, 180, 360],
              opacity: [0, 0.3, 0],
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              delay: Math.random() * 5,
              repeat: Infinity,
            }}
            className="absolute"
          >
            <Sparkles
              className={`w-6 h-6 ${
                ["text-white", "text-yellow-300", "text-pink-300"][i % 3]
              }`}
            />
          </motion.div>
        ))}
      </div>

      {/* Close Button */}
      {onClose && (
        <div className="absolute top-4 right-4 z-50">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      )}

      <Container className="relative z-10 py-12 sm:py-20">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              duration: 0.6,
              delay: 0.2,
              type: "spring",
              stiffness: 200,
            }}
            className="mb-6"
          >
            <div className="inline-block bg-white/20 backdrop-blur-sm p-6 rounded-3xl">
              <Trophy className="w-16 h-16 sm:w-20 sm:h-20 text-yellow-300" />
            </div>
          </motion.div>

          <Heading
            level={1}
            className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 drop-shadow-lg"
          >
            ImaginArena
          </Heading>

          <Text className="text-xl sm:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
            Where creativity meets competition! Battle your friends in
            tournament-style AI image generation contests. Create, vote, and
            conquer!
          </Text>

          {onGetStarted && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Button
                size="lg"
                onClick={onGetStarted}
                className="bg-white text-primary hover:bg-white/90 shadow-2xl text-lg px-8 py-6"
              >
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          )}
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mb-16"
        >
          <Heading
            level={2}
            className="text-3xl sm:text-4xl font-bold text-white text-center mb-12"
          >
            How It Works
          </Heading>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-shadow h-full">
                  <div
                    className={`${feature.bgColor} w-14 h-14 rounded-2xl flex items-center justify-center mb-4`}
                  >
                    <feature.icon className={`w-7 h-7 ${feature.color}`} />
                  </div>
                  <Heading level={3} className="text-xl font-bold mb-3 text-gray-800">
                    {feature.title}
                  </Heading>
                  <Text className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </Text>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center"
        >
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl max-w-2xl mx-auto">
            <Sparkles className="w-12 h-12 text-accent mx-auto mb-4" />
            <Heading level={2} className="text-3xl font-bold mb-4 text-gray-800">
              Ready to Battle?
            </Heading>
            <Text className="text-lg text-gray-600 mb-6 leading-relaxed">
              Join the arena and prove your creative prowess! Compete with
              friends, showcase your AI artistry, and claim the championship
              trophy.
            </Text>
            {onGetStarted && (
              <Button
                size="lg"
                onClick={onGetStarted}
                className="bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 shadow-lg"
              >
                Enter the Arena
                <Trophy className="w-5 h-5 ml-2" />
              </Button>
            )}
          </Card>
        </motion.div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center mt-12"
        >
          <Text className="text-white/70 text-sm">
            Built with ❤️ for creative competitions
          </Text>
        </motion.div>
      </Container>
    </div>
  );
};
