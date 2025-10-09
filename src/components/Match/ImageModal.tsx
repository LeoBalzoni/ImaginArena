import React from "react";
import { X, ZoomIn } from "lucide-react";
import {useTranslation} from "react-i18next";

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  playerName: string;
  prompt?: string;
}

/**
 * Modal component for displaying images in their original size
 * Allows users to view submission images in full detail for better voting decisions
 */
export const ImageModal: React.FC<ImageModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  playerName,
  prompt,
}) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative max-w-7xl max-h-full bg-white rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            <ZoomIn className="w-5 h-5 text-gray-600" />
            <div>
              <h3 className="font-semibold text-gray-900">
                {t("imageSubmission.playerSubmission", {
                  username: playerName,
                })}
              </h3>
              {prompt && (
                <p className="text-sm text-gray-600 italic">"{prompt}"</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Image Container */}
        <div className="relative bg-gray-50 flex items-center justify-center min-h-96">
          <img
            src={imageUrl}
            alt={`${playerName}'s submission - full size`}
            className="max-w-full max-h-[80vh] object-contain"
            style={{ maxWidth: "90vw" }}
          />
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {t("imageSubmission.clickOutside")}
            </p>
            <button onClick={onClose} className="btn-secondary text-sm">
              {t("imageSubmission.close")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
