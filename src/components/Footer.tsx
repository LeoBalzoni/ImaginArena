import { useTranslation } from "react-i18next";
import {
  Github,
  Instagram,
  Linkedin,
  Mail,
  Heart,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { Container, Text } from "./ui";

/**
 * Footer component displaying creator information and social links
 */
export const Footer = () => {
  const { t } = useTranslation();
  const socialLinks = [
    {
      href: "https://github.com/LeoBalzoni",
      icon: Github,
      label: t("footer.github"),
      hoverColor: "hover:text-gray-900 hover:bg-gray-100",
    },
    {
      href: "https://www.linkedin.com/in/leobalzoni/",
      icon: Linkedin,
      label: t("footer.linkedin"),
      hoverColor: "hover:text-blue-600 hover:bg-blue-50",
    },
    {
      href: "https://www.instagram.com/leo_balzoni/",
      icon: Instagram,
      label: t("footer.instagram"),
      hoverColor: "hover:text-pink-600 hover:bg-pink-50",
    },
    {
      href: "mailto:l.balzoni@gmail.com",
      icon: Mail,
      label: t("footer.email"),
      hoverColor: "hover:text-accent hover:bg-accent-50",
    },
  ];

  return (
    <motion.footer
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white/95 backdrop-blur-sm border-t border-primary-100 py-8 mt-auto"
    >
      <Container>
        <div className="flex flex-col items-center justify-center space-y-6">
          {/* Creator Info */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Text className="text-textcolor-secondary">
                {t("footer.builtWith")}
              </Text>
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3,
                }}
              >
                <Heart className="w-4 h-4 text-red-500 fill-current" />
              </motion.div>
              <Text className="text-textcolor-secondary">{t("footer.by")}</Text>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Text className="font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Leonardo Balzoni
              </Text>
              <motion.div
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatDelay: 2,
                }}
              >
                <Sparkles className="w-4 h-4 text-accent" />
              </motion.div>
            </div>
          </motion.div>

          {/* Social Links */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="flex items-center flex-wrap justify-center gap-3"
          >
            {socialLinks.map((link, index) => {
              const Icon = link.icon;
              return (
                <motion.a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    delay: 0.8 + index * 0.1,
                    duration: 0.3,
                    type: "spring",
                    stiffness: 200,
                  }}
                  whileHover={{
                    scale: 1.05,
                    y: -2,
                  }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-textcolor-secondary transition-all duration-200 ${link.hoverColor}`}
                >
                  <Icon className="w-4 h-4" />
                  <Text variant="small" className="font-medium">
                    {link.label}
                  </Text>
                </motion.a>
              );
            })}
          </motion.div>

          {/* Copyright */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="text-center pt-4 border-t border-primary-100 w-full"
          >
            <Text variant="small" className="text-textcolor-secondary">
              {t("footer.copyright")}
            </Text>
          </motion.div>
        </div>
      </Container>
    </motion.footer>
  );
};
