import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Trophy,
  Users,
  Image,
  Vote,
  Sparkles,
  ArrowLeft,
  Github,
  Linkedin,
  Instagram,
  Mail,
} from "lucide-react";
import {
  Button,
  Card,
  Container,
  Heading,
  DarkAwareText,
  DarkAwareHeading,
} from "../ui";

interface AboutPageProps {
  onBack: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onBack }) => {
  const { t } = useTranslation();

  const features = [
    {
      icon: Users,
      titleKey: "about.features.multiplayer.title",
      descKey: "about.features.multiplayer.desc",
      color: "text-primary",
    },
    {
      icon: Trophy,
      titleKey: "about.features.tournament.title",
      descKey: "about.features.tournament.desc",
      color: "text-secondary",
    },
    {
      icon: Image,
      titleKey: "about.features.creative.title",
      descKey: "about.features.creative.desc",
      color: "text-accent",
    },
    {
      icon: Vote,
      titleKey: "about.features.voting.title",
      descKey: "about.features.voting.desc",
      color: "text-purple-500",
    },
  ];

  const socialLinks = [
    {
      icon: Github,
      label: "GitHub",
      url: "https://github.com/LeoBalzoni",
      color: "hover:text-gray-900",
    },
    {
      icon: Linkedin,
      label: "LinkedIn",
      url: "https://www.linkedin.com/in/leonardo-balzoni/",
      color: "hover:text-blue-600",
    },
    {
      icon: Instagram,
      label: "Instagram",
      url: "https://www.instagram.com/leo_balzoni/",
      color: "hover:text-pink-600",
    },
    {
      icon: Mail,
      label: "Email",
      url: "mailto:leonardo.balzoni@gmail.com",
      color: "hover:text-red-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50">
      <Container className="py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-4 hover:bg-white/50"
          >
            <ArrowLeft className="w-5 h-5" />
            {t("about.backToApp")}
          </Button>

          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-block mb-4"
            >
              <div className="bg-gradient-to-br from-primary to-secondary p-6 rounded-full shadow-xl">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
            </motion.div>

            <Heading
              level={1}
              className="text-4xl sm:text-5xl font-bold text-gray-800 mb-4"
            >
              {t("about.title")}
            </Heading>
            <DarkAwareText className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t("about.subtitle")}
            </DarkAwareText>
          </div>
        </motion.div>

        {/* What is ImaginArena */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-12"
        >
          <Card className="bg-white/90 backdrop-blur-sm shadow-xl">
            <Heading
              level={2}
              className="text-2xl font-bold text-gray-800 mb-4"
            >
              {t("about.whatIs.title")}
            </Heading>
            <DarkAwareText className="text-gray-700 leading-relaxed mb-4">
              {t("about.whatIs.description")}
            </DarkAwareText>
            <DarkAwareText className="text-gray-700 leading-relaxed">
              {t("about.whatIs.purpose")}
            </DarkAwareText>
          </Card>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-12"
        >
          <Heading
            level={2}
            className="text-3xl font-bold text-gray-800 text-center mb-8"
          >
            {t("about.features.title")}
          </Heading>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.titleKey}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
              >
                <Card className="bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow h-full">
                  <div className="flex items-start gap-4">
                    <div
                      className={`${feature.color} bg-gray-100 p-3 rounded-lg`}
                    >
                      <feature.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <Heading
                        level={3}
                        className="text-lg font-semibold text-gray-800 mb-2"
                      >
                        {t(feature.titleKey)}
                      </Heading>
                      <DarkAwareText className="text-gray-600 text-sm">
                        {t(feature.descKey)}
                      </DarkAwareText>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* How to Play */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mb-12"
        >
          <Card className="bg-white/90 backdrop-blur-sm shadow-xl">
            <Heading
              level={2}
              className="text-2xl font-bold text-gray-800 mb-6"
            >
              {t("about.howToPlay.title")}
            </Heading>

            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((step) => (
                <div key={step} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-primary to-secondary text-white rounded-full flex items-center justify-center font-bold">
                    {step}
                  </div>
                  <DarkAwareText className="text-gray-700 flex-1">
                    {t(`about.howToPlay.step${step}`)}
                  </DarkAwareText>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Tech Stack */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="mb-12"
        >
          <Card className="bg-white/90 backdrop-blur-sm shadow-xl">
            <Heading
              level={2}
              className="text-2xl font-bold text-gray-800 mb-4"
            >
              {t("about.techStack.title")}
            </Heading>
            <DarkAwareText className="text-gray-700 mb-4">
              {t("about.techStack.description")}
            </DarkAwareText>
            <div className="flex flex-wrap gap-2">
              {[
                "React",
                "TypeScript",
                "Vite",
                "TailwindCSS",
                "Supabase",
                "Framer Motion",
                "Zustand",
              ].map((tech) => (
                <span
                  key={tech}
                  className="px-3 py-1 bg-gradient-to-r from-primary/10 to-secondary/10 text-gray-700 rounded-full text-sm font-medium"
                >
                  {tech}
                </span>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Creator Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 backdrop-blur-sm shadow-xl">
            <div className="text-center">
              <DarkAwareHeading
                onDark={true}
                level={2}
                className="text-2xl font-bold mb-4"
              >
                {t("about.creator.title")}
              </DarkAwareHeading>
              <DarkAwareText onDark={true} className="mb-6 max-w-2xl mx-auto">
                {t("about.creator.description")}
              </DarkAwareText>

              {/* Social Links */}
              <div className="flex justify-center gap-4 flex-wrap">
                {socialLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all ${link.color}`}
                  >
                    <link.icon className="w-5 h-5" />
                    <span className="font-medium">{link.label}</span>
                  </a>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.1 }}
          className="flex justify-center"
        >
          <Button
            onClick={onBack}
            size="lg"
            className="bg-gradient-to-r from-primary to-secondary hover:from-primary-600 hover:to-secondary-600 text-white shadow-lg"
          >
            <Trophy className="w-5 h-5" />
            {t("about.joinTournament")}
          </Button>
        </motion.div>
      </Container>
    </div>
  );
};
