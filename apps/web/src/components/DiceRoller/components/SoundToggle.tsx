import React from "react";
import { ColorTheme } from "../colorThemes";

export interface SoundToggleProps {
  soundEnabled: boolean;
  onToggle: () => void;
  theme: ColorTheme;
}

export function SoundToggle({
  soundEnabled,
  onToggle,
  theme,
}: SoundToggleProps): React.ReactElement {
  return (
    <button
      onClick={onToggle}
      className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
      style={{
        backgroundColor: `${theme.textPrimary}22`,
        color: theme.textPrimary,
      }}
      title={soundEnabled ? "Mute sound" : "Unmute sound"}
      aria-label={soundEnabled ? "Mute sound" : "Unmute sound"}
    >
      {soundEnabled ? (
        // Sound on icon
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      ) : (
        // Sound off icon
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      )}
    </button>
  );
}
