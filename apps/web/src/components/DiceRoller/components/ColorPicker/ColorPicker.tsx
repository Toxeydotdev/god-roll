import React from "react";
import { COLOR_THEMES, ColorTheme } from "@/components/DiceRoller/colorThemes";

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
    <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/60 p-4">
      <div
        className="rounded-2xl p-6 text-center shadow-2xl max-w-md"
        style={{ backgroundColor: currentTheme.backgroundCss }}
      >
        <h2
          className="text-2xl font-black mb-4"
          style={{ color: currentTheme.textPrimary }}
        >
          🎨 Choose Theme
        </h2>

        <div className="grid grid-cols-3 gap-3 mb-6">
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

        <button
          onClick={onClose}
          className="px-6 py-2 rounded-full font-bold text-lg transition-all hover:scale-105 active:scale-95"
          style={{
            backgroundColor: currentTheme.textPrimary,
            color: currentTheme.backgroundCss,
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
}
