import { COLOR_THEMES, ColorTheme } from "@/components/DiceRoller/colorThemes";
import React from "react";

interface ColorPickerProps {
  currentTheme: ColorTheme;
  onSelectTheme: (theme: ColorTheme) => void;
  onClose: () => void;
}

export function ColorPicker({
  currentTheme,
  onSelectTheme,
  onClose,
}: ColorPickerProps): React.ReactElement {
  return (
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center z-30 bg-black/60"
      onClick={onClose}
    >
      <div
        className="rounded-t-3xl sm:rounded-2xl p-6 pt-3 text-center shadow-2xl w-full sm:w-auto sm:max-w-md"
        style={{
          backgroundColor: currentTheme.backgroundCss,
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pb-3 sm:hidden">
          <button
            onClick={onClose}
            className="w-10 h-1 rounded-full bg-gray-300 hover:bg-gray-400 transition-colors"
            aria-label="Close"
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-2xl font-black"
            style={{ color: currentTheme.textPrimary }}
          >
            🎨 Choose Theme
          </h2>
          <button
            onClick={onClose}
            className="hidden sm:flex w-8 h-8 rounded-full items-center justify-center text-lg hover:bg-black/10 transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {COLOR_THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => onSelectTheme(theme)}
              className={`p-3 rounded-xl transition-all hover:scale-105 active:scale-95 ${
                currentTheme.id === theme.id
                  ? "ring-4 ring-offset-2 ring-black/30"
                  : ""
              }`}
              style={{ backgroundColor: theme.backgroundCss }}
            >
              <div
                className="w-8 h-8 rounded-full mx-auto mb-1"
                style={{ backgroundColor: theme.textPrimary }}
              />
              <span
                className="text-xs font-bold"
                style={{ color: theme.textPrimary }}
              >
                {theme.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
