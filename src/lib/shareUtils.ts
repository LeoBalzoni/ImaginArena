/**
 * Utility functions for sharing tournament victories on social media
 */

interface ShareData {
  championName: string;
  tournamentSize: number;
  appUrl: string;
}

/**
 * Generates a shareable message for social media
 */
export const generateShareMessage = (data: ShareData): string => {
  return `🎨 I just won an ImaginArena tournament! 🏆\n\n` +
    `${data.championName} conquered ${data.tournamentSize} players in a creative AI image battle!\n\n` +
    `Think you can beat me? Join the arena:\n${data.appUrl}`;
};

/**
 * Generates a shorter message optimized for Instagram stories
 */
export const generateInstagramMessage = (data: ShareData): string => {
  return `🏆 Champion of ImaginArena!\n\nJoin the creative battle: ${data.appUrl}`;
};

/**
 * Opens Instagram with a pre-filled story background
 * Note: Instagram's native share API is limited on web, so this opens Instagram
 * and copies the share text to clipboard for easy pasting
 */
export const shareToInstagramStory = async (data: ShareData): Promise<void> => {
  const message = generateInstagramMessage(data);
  
  // Copy message to clipboard
  try {
    await navigator.clipboard.writeText(message);
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
  }

  // Try to open Instagram app on mobile, or web on desktop
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  if (isMobile) {
    // Try to open Instagram app
    window.location.href = 'instagram://story-camera';
    
    // Fallback to Instagram web after a delay
    setTimeout(() => {
      window.open('https://www.instagram.com/', '_blank');
    }, 1500);
  } else {
    // On desktop, open Instagram web
    window.open('https://www.instagram.com/', '_blank');
  }
};

/**
 * Generic share using Web Share API (works on mobile)
 */
export const shareVictory = async (data: ShareData): Promise<boolean> => {
  const message = generateShareMessage(data);
  
  // Check if Web Share API is available
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'ImaginArena Victory! 🏆',
        text: message,
        url: data.appUrl,
      });
      return true;
    } catch (error) {
      // User cancelled or share failed
      console.log('Share cancelled or failed:', error);
      return false;
    }
  }
  
  // Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(message);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

/**
 * Share to Twitter/X
 */
export const shareToTwitter = (data: ShareData): void => {
  const message = generateShareMessage(data);
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`;
  window.open(twitterUrl, '_blank', 'width=550,height=420');
};

/**
 * Copy share link to clipboard
 */
export const copyShareLink = async (url: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch (error) {
    console.error('Failed to copy link:', error);
    return false;
  }
};
