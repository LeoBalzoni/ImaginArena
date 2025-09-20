/**
 * Creative prompts for ImaginArena matches
 * Shared across tournament creation and admin prompt changes
 */
export const CREATIVE_PROMPTS = [
  "A magical forest at sunset with glowing mushrooms",
  "A cyberpunk city street in the rain at night",
  "A cozy cabin in the mountains during winter",
  "An underwater palace with colorful coral gardens",
  "A steampunk airship floating above the clouds",
  "A desert oasis with ancient ruins in the background",
  "A space station orbiting a distant planet",
  "A medieval castle on a cliff overlooking the ocean",
  "A floating island with waterfalls cascading into clouds",
  "A neon-lit arcade from the 1980s",
  "A Victorian greenhouse filled with exotic plants",
  "A pirate ship sailing through a storm",
  "A futuristic laboratory with holographic displays",
  "A peaceful zen garden with cherry blossoms",
  "A bustling marketplace in ancient Rome",
  "A crystal cave with luminescent formations",
  "A treehouse village connected by rope bridges",
  "A lighthouse on a rocky coast during a thunderstorm",
  "A robot repair shop in a post-apocalyptic world",
  "A fairy tale cottage with a thatched roof and flower garden",
  "A samurai temple hidden in bamboo forests",
  "A clockwork city with gears and steam everywhere",
  "A dragon's lair filled with treasure and ancient artifacts",
  "A space colony on Mars with glass domes",
  "An art nouveau subway station with ornate details",
];

/**
 * Get a random prompt from the collection
 */
export const getRandomPrompt = (): string => {
  return CREATIVE_PROMPTS[Math.floor(Math.random() * CREATIVE_PROMPTS.length)];
};

/**
 * Get a random prompt that's different from the current one
 */
export const getRandomPromptExcluding = (currentPrompt: string): string => {
  const availablePrompts = CREATIVE_PROMPTS.filter((p) => p !== currentPrompt);
  return availablePrompts[Math.floor(Math.random() * availablePrompts.length)];
};
