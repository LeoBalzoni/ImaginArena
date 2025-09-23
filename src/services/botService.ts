import { supabase } from "../lib/supabase";
import type { User } from "../lib/supabase";

export class BotService {
  // List of bot names to use
  private static readonly BOT_NAMES = [
    "AI_Artist_Alpha",
    "CreativeBot_Beta",
    "PixelMaster_3000",
    "ArtificialMuse",
    "DigitalDreamer",
    "SynthCreator",
    "VirtualVincent",
    "CyberPicasso",
    "RoboRembrandt",
    "NeuralNinja",
    "AlgoArtist",
    "BinaryBrush",
    "CodeCanvas",
    "DataDaVinci",
    "ElectroEasel",
    "FusionFramer",
    "GigaGraphic",
    "HyperHue",
    "InfiniteInk",
    "JetsonJourney",
    "KineticKolor",
    "LaserLine",
    "MegaMosaic",
    "NanoNoir",
    "OmegaOpus",
    "PixelPioneer",
    "QuantumQuill",
    "RenderRanger",
    "SiliconSketcher",
    "TechnoTint",
    "UltraUrban",
    "VectorVirtuoso",
    "WaveformWizard",
    "XenonXpert",
    "YottaYarn",
    "ZenithZoom",
  ];

  /**
   * Create a bot user with a random name
   */
  static async createBotUser(): Promise<User> {
    // Generate a unique bot name
    const baseName =
      this.BOT_NAMES[Math.floor(Math.random() * this.BOT_NAMES.length)];
    const uniqueId = Math.floor(Math.random() * 9999)
      .toString()
      .padStart(4, "0");
    const botUsername = `${baseName}_${uniqueId}`;

    const { data, error } = await supabase
      .from("users")
      .insert({
        username: botUsername,
        is_admin: false,
        is_bot: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create multiple bot users
   */
  static async createMultipleBotUsers(count: number): Promise<User[]> {
    const bots: User[] = [];

    for (let i = 0; i < count; i++) {
      try {
        const bot = await this.createBotUser();
        bots.push(bot);
      } catch (error) {
        console.error(`Failed to create bot ${i + 1}:`, error);
        // Continue creating other bots even if one fails
      }
    }

    return bots;
  }

  /**
   * Fill tournament with bot users to reach the target size
   */
  static async fillTournamentWithBots(
    tournamentId: string,
    currentParticipantCount: number,
    targetSize: number
  ): Promise<User[]> {
    const botsNeeded = targetSize - currentParticipantCount;

    if (botsNeeded <= 0) {
      return [];
    }

    // Create the required number of bots
    const bots = await this.createMultipleBotUsers(botsNeeded);

    // Add bots to the tournament
    const botPromises = bots.map((bot) =>
      supabase.from("tournament_participants").insert({
        tournament_id: tournamentId,
        user_id: bot.id,
      })
    );

    await Promise.all(botPromises);

    return bots;
  }

  /**
   * Clean up bot users (remove bots that are not in any active tournaments)
   */
  static async cleanupInactiveBots(): Promise<void> {
    try {
      // Find bots that are not in any active tournaments
      const { data: inactiveBots, error } = await supabase
        .from("users")
        .select(
          `
          id,
          tournament_participants!inner(
            tournament_id,
            tournaments!inner(status)
          )
        `
        )
        .eq("is_bot", true)
        .not(
          "tournament_participants.tournaments.status",
          "in",
          "('lobby', 'in_progress')"
        );

      if (error) {
        console.error("Error finding inactive bots:", error);
        return;
      }

      if (inactiveBots && inactiveBots.length > 0) {
        const botIds = inactiveBots.map((bot) => bot.id);

        // Delete inactive bots
        const { error: deleteError } = await supabase
          .from("users")
          .delete()
          .in("id", botIds);

        if (deleteError) {
          console.error("Error deleting inactive bots:", deleteError);
        } else {
          console.log(`Cleaned up ${botIds.length} inactive bots`);
        }
      }
    } catch (error) {
      console.error("Error during bot cleanup:", error);
    }
  }

  /**
   * Check if a user is a bot
   */
  static isBot(user: User): boolean {
    return user.is_bot;
  }

  /**
   * Get bot emoji/icon for display
   */
  static getBotIcon(): string {
    return "🤖";
  }

  /**
   * Get bot display name with icon
   */
  static getBotDisplayName(user: User): string {
    return this.isBot(user)
      ? `${this.getBotIcon()} ${user.username}`
      : user.username;
  }
}
