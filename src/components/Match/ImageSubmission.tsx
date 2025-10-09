import React, { useState, useRef } from "react";
import { Upload, Image as ImageIcon, Loader2, X, Sparkles } from "lucide-react";
import { MatchService } from "../../services/matchService";
import { useStore } from "../../store/useStore";
import { DarkAwareText } from "../ui";
import { useTranslation } from "react-i18next";

interface ImageSubmissionProps {
  matchId: string;
}

export const ImageSubmission: React.FC<ImageSubmissionProps> = ({
  matchId,
}) => {
  const { t } = useTranslation();

  const { user, setError } = useStore();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be smaller than 10MB");
      return;
    }

    setSelectedFile(file);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const clearSelection = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile || !user) return;

    setIsUploading(true);
    setError(null);

    try {
      await MatchService.submitImage(matchId, user.id, selectedFile);
      clearSelection();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to submit image"
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="card">
      <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
        <h3>
          <DarkAwareText className="text-lg font-semibold" onDark={true}>
            {t("imageSubmission.submitYourImage")}
          </DarkAwareText>
        </h3>
        <a
          href="https://gemini.google.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm font-medium rounded-full transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
        >
          <Sparkles className="w-4 h-4" />
          <span>{t("imageSubmission.gemini")}</span>
        </a>
      </div>

      {!selectedFile ? (
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <DarkAwareText className="text-lg font-medium mb-2" onDark={true}>
            {t("imageSubmission.dropImageHere")}
          </DarkAwareText>
          <p className="text-sm text-gray-500">
            {t("imageSubmission.imageFormats")}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <img
              src={previewUrl!}
              alt="Preview"
              className="w-full h-64 object-cover rounded-lg"
            />
            <button
              onClick={clearSelection}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-2 text-sm text-gray-600 min-w-0 flex-shrink">
              <ImageIcon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate max-w-[120px] sm:max-w-[200px]">
                {selectedFile.name}
              </span>
              <span className="flex-shrink-0">
                ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
              </span>
            </div>

            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={clearSelection}
                disabled={isUploading}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isUploading}
                className="btn-primary flex items-center gap-2"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {isUploading ? t("match.submitting") : t("match.submitImage")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
