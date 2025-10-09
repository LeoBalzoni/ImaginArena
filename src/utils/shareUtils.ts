/**
 * Utility functions for sharing tournament results on social media
 */

/**
 * Loads the static share image from the public folder
 * The image should be placed at /public/share-story.png (1080x1920 recommended for Instagram Stories)
 */
export const loadShareImage = async (): Promise<Blob> => {
  try {
    const response = await fetch("/share-story.png");
    if (!response.ok) {
      throw new Error("Failed to load share image");
    }
    return await response.blob();
  } catch (error) {
    console.error("Error loading share image:", error);
    throw error;
  }
};

/**
 * Share to Instagram Stories (mobile only)
 * Falls back to download on desktop
 */
export const shareToInstagramStories = async (
  imageBlob: Blob,
  appUrl: string
): Promise<void> => {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile && navigator.share) {
    try {
      // Create a file from the blob
      const file = new File([imageBlob], "imaginarena-victory.png", {
        type: "image/png",
      });

      // Use Web Share API
      await navigator.share({
        files: [file],
        title: "ImaginArena Champion!",
        text: `I just won an ImaginArena tournament! 🏆 Check it out at ${appUrl}`,
      });
    } catch (error) {
      // If share fails, fall back to download
      if ((error as Error).name !== "AbortError") {
        console.error("Share failed:", error);
        downloadImage(imageBlob);
      }
    }
  } else {
    // Desktop: download the image
    downloadImage(imageBlob);
  }
};

/**
 * Download image to device
 */
const downloadImage = (blob: Blob) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "imaginarena-victory.png";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Copy app URL to clipboard
 */
export const copyAppUrl = async (url: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch (error) {
    console.error("Failed to copy URL:", error);
    return false;
  }
};
