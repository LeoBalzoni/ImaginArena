import React from "react";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { motion } from "framer-motion";

/**
 * Language switcher component that toggles between English and Italian
 */
export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "it" : "en";
    i18n.changeLanguage(newLang);
    localStorage.setItem("language", newLang);
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary-50 border border-gray-200 hover:border-primary hover:bg-primary-100 transition-all duration-200 shadow-sm"
      title={i18n.language === "en" ? "Switch to Italian" : "Passa all'Inglese"}
    >
      <Globe className="w-4 h-4 text-primary" />
      <span className="text-sm font-semibold text-primary">
        {i18n.language === "en" ? "🇬🇧 EN" : "🇮🇹 IT"}
      </span>
    </motion.button>
  );
};
