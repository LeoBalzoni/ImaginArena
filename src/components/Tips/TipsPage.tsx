import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Lightbulb,
  ArrowLeft,
  Sparkles,
  Image as ImageIcon,
} from "lucide-react";
import { Button, Card, Container, Heading, DarkAwareText } from "../ui";

interface TipsPageProps {
  onBack: () => void;
}

export const TipsPage: React.FC<TipsPageProps> = ({ onBack }) => {
  const { t } = useTranslation();

  // Example prompts for each category
  const categoryExamples: Record<string, string> = {
    Medium: "A bluebird as..",
    Material: "A pineapple made of..",
    Photography: "A man wearing a blue suit shot with..",
    Lighting: "A woman wearing a blue suit in..",
  };

  // Style categories with their items
  const styleCategories = [
    {
      name: "Medium",
      items: [
        { name: "Stencil", hasImage: true },
        { name: "Watercolor", hasImage: true },
        { name: "Papercraft", hasImage: true },
        { name: "Marker illustration", hasImage: true },
        { name: "Graffiti", hasImage: false },
        { name: "Photograph", hasImage: false },
        { name: "Manga", hasImage: false },
        { name: "Charcoal", hasImage: false },
        { name: "Oil painting", hasImage: false },
        { name: "Collage", hasImage: false },
        { name: "Origami", hasImage: false },
        { name: "Puppet", hasImage: false },
      ],
    },
    {
      name: "Material",
      items: [
        { name: "Porcelain", hasImage: true },
        { name: "Light", hasImage: true },
        { name: "Candy", hasImage: true },
        { name: "Bubbles", hasImage: true },
        { name: "Crystals", hasImage: true },
        { name: "Ceramic", hasImage: false },
        { name: "Plastic", hasImage: false },
        { name: "Wood", hasImage: false },
        { name: "Metal", hasImage: false },
        { name: "Water", hasImage: false },
        { name: "Glass", hasImage: false },
        { name: "Sand", hasImage: false },
      ],
    },
    {
      name: "Photography",
      items: [
        { name: "Low angle photograph", hasImage: true },
        { name: "High angle photograph", hasImage: true },
        { name: "Extreme close-up", hasImage: true },
        { name: "Low shutter speed photography", hasImage: true },
        { name: "Bokeh photograph", hasImage: true },
        { name: "Black and white", hasImage: false },
        { name: "Aerial/bird's eye view", hasImage: false },
        { name: "Worm's eye view", hasImage: false },
        { name: "Long exposure", hasImage: false },
      ],
    },
    {
      name: "Lighting",
      items: [
        { name: "High key", hasImage: true },
        { name: "Low key", hasImage: true },
        { name: "Natural lighting", hasImage: true },
        { name: "Light and shadow", hasImage: true },
        { name: "Volumetric lighting", hasImage: true },
        { name: "Fog", hasImage: true },
        { name: "Neon lighting", hasImage: true },
        { name: "Golden hour", hasImage: true },
      ],
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
            {t("tips.backToApp")}
          </Button>

          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-block mb-4"
            >
              <div className="bg-gradient-to-br from-accent to-secondary p-6 rounded-full shadow-xl">
                <Lightbulb className="w-12 h-12 text-white" />
              </div>
            </motion.div>

            <Heading
              level={1}
              className="text-4xl sm:text-5xl font-bold text-gray-800 mb-4"
            >
              {t("tips.title")}
            </Heading>
            <DarkAwareText className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t("tips.subtitle")}
            </DarkAwareText>
          </div>
        </motion.div>

        {/* Section 1: Anatomy of a Winning Prompt */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-12"
        >
          <Card className="bg-white/90 backdrop-blur-sm shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-primary to-secondary p-3 rounded-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <Heading
                level={2}
                className="text-2xl sm:text-3xl font-bold text-gray-800"
              >
                {t("tips.anatomy.title")}
              </Heading>
            </div>

            {/* Champion Formula */}
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-xl mb-6">
              <DarkAwareText className="text-center font-semibold text-lg mb-2">
                {t("tips.anatomy.formulaTitle")}
              </DarkAwareText>
              <DarkAwareText className="text-center text-gray-700 font-mono text-sm sm:text-base">
                {t("tips.anatomy.formula")}
              </DarkAwareText>
            </div>

            {/* Breakdown */}
            <div className="space-y-4">
              {[
                {
                  key: "subject",
                  icon: "🎯",
                },
                {
                  key: "action",
                  icon: "⚡",
                },
                {
                  key: "style",
                  icon: "🎨",
                },
                {
                  key: "lighting",
                  icon: "💡",
                },
                {
                  key: "composition",
                  icon: "📸",
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="text-3xl flex-shrink-0">{item.icon}</div>
                  <div className="flex-1">
                    <DarkAwareText className="font-bold text-gray-800 mb-1">
                      {t(`tips.anatomy.${item.key}.title`)}
                    </DarkAwareText>
                    <DarkAwareText className="text-gray-600 text-sm">
                      {t(`tips.anatomy.${item.key}.description`)}
                    </DarkAwareText>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Section 2: Style Library */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-12"
        >
          <Card className="bg-white/90 backdrop-blur-sm shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-accent to-primary p-3 rounded-lg">
                <ImageIcon className="w-6 h-6 text-white" />
              </div>
              <Heading
                level={2}
                className="text-2xl sm:text-3xl font-bold text-gray-800"
              >
                {t("tips.styleLibrary.title")}
              </Heading>
            </div>

            <DarkAwareText className="text-gray-700 mb-8">
              {t("tips.styleLibrary.description")}
            </DarkAwareText>

            {/* Categories */}
            <div className="space-y-8">
              {styleCategories.map((category, categoryIndex) => (
                <motion.div
                  key={category.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: 0.5 + categoryIndex * 0.1,
                  }}
                >
                  <div className="mb-4">
                    <Heading
                      level={3}
                      className="text-xl font-bold text-gray-800 mb-2"
                    >
                      {categoryIndex + 1}.{" "}
                      {t(
                        `tips.styleLibrary.categories.${category.name.toLowerCase()}.title`
                      )}
                    </Heading>
                    <DarkAwareText className="text-gray-600 text-sm mb-2">
                      {t(
                        `tips.styleLibrary.categories.${category.name.toLowerCase()}.description`
                      )}
                    </DarkAwareText>
                    <DarkAwareText className="text-gray-500 text-sm italic">
                      {t("tips.styleLibrary.examplePrompt")}: "
                      {categoryExamples[category.name]}"
                    </DarkAwareText>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
                    {category.items
                      .filter((item) => item.hasImage)
                      .map((item) => (
                        <div
                          key={item.name}
                          className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                        >
                          <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                            <img
                              src={`/tips/${category.name.toLowerCase()}/${item.name
                                .toLowerCase()
                                .replace(/[^a-z0-9]+/g, "-")}.png`}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback if image doesn't exist
                                e.currentTarget.style.display = "none";
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                  parent.innerHTML = `<div class="w-full h-full flex items-center justify-center"><span class="text-gray-400 text-4xl">📷</span></div>`;
                                }
                              }}
                            />
                          </div>
                          <div className="p-3">
                            <DarkAwareText className="text-sm font-medium text-gray-800 text-center">
                              {item.name}
                            </DarkAwareText>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Items without images */}
                  {category.items.filter((item) => !item.hasImage).length >
                    0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <DarkAwareText className="text-sm font-semibold text-gray-700 mb-2">
                        {t("tips.styleLibrary.butAlso")}
                      </DarkAwareText>
                      <div className="flex flex-wrap gap-2">
                        {category.items
                          .filter((item) => !item.hasImage)
                          .map((item) => (
                            <span
                              key={item.name}
                              className="px-3 py-1 bg-white rounded-full text-sm text-gray-700 border border-gray-200"
                            >
                              {item.name}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="flex justify-center"
        >
          <Button
            onClick={onBack}
            size="lg"
            className="bg-gradient-to-r from-accent to-secondary hover:from-accent-600 hover:to-secondary-600 text-white shadow-lg"
          >
            <Sparkles className="w-5 h-5" />
            {t("tips.startCreating")}
          </Button>
        </motion.div>
      </Container>
    </div>
  );
};
