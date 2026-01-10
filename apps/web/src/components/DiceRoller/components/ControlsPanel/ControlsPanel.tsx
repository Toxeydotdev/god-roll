import {
  useAchievements,
  useModal,
  useSound,
  useTheme,
} from "@/components/DiceRoller/context";
import React from "react";

export function ControlsPanel(): React.ReactElement {
  const { openModal } = useModal();
  const { soundEnabled, toggleSound, musicEnabled, toggleMusic } = useSound();
  const { theme } = useTheme();
  const { unlockedCount, totalAchievements } = useAchievements();

  const soundIcon = soundEnabled ? (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
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
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
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
  );

  const buttons = [
    {
      icon: soundIcon,
      label: soundEnabled ? "Sound" : "Muted",
      onClick: toggleSound,
      active: soundEnabled,
    },
    {
      icon: <span className="text-lg">{musicEnabled ? "🎵" : "🔇"}</span>,
      label: "Music",
      onClick: toggleMusic,
      active: musicEnabled,
    },
    {
      icon: <span className="text-lg">🎨</span>,
      label: "Theme",
      onClick: () => openModal("colorPicker"),
    },
    {
      icon: <span className="text-lg">🎲</span>,
      label: "Dice",
      onClick: () => openModal("diceSkin"),
    },
    {
      icon: (
        <span className="text-lg relative">
          🏆
          {unlockedCount > 0 && (
            <span
              className="absolute -top-1 -right-2 text-[8px] font-bold rounded-full px-1"
              style={{
                backgroundColor: theme.accentColor,
                color: theme.backgroundCss,
                minWidth: "14px",
                lineHeight: "14px",
              }}
            >
              {unlockedCount}
            </span>
          )}
        </span>
      ),
      label: `${unlockedCount}/${totalAchievements}`,
      onClick: () => openModal("achievements"),
    },
    {
      icon: <span className="text-lg">❓</span>,
      label: "Rules",
      onClick: () => openModal("rules"),
    },
    {
      icon: <span className="text-lg">📊</span>,
      label: "Scores",
      onClick: () => openModal("leaderboard"),
    },
  ];

  return (
    <>
      <style>{`
        @keyframes thumb-bar-slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .thumb-bar {
          animation: thumb-bar-slide-up 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .thumb-bar-button {
          transition: all 0.15s ease;
        }

        .thumb-bar-button:hover {
          transform: translateY(-2px);
        }

        .thumb-bar-button:active {
          transform: scale(0.95);
        }
      `}</style>

      {/* Bottom thumb bar - compact mobile-first design */}
      <div
        className="thumb-bar w-full"
        style={{
          background: `linear-gradient(180deg, ${theme.textSecondary}F5 0%, ${theme.textSecondary}F0 100%)`,
          boxShadow: `0 -4px 20px rgba(0,0,0,0.2)`,
          backdropFilter: "blur(10px)",
          borderTop: `1px solid rgba(255,255,255,0.15)`,
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 8px)",
        }}
      >
        {/* Bar container - icons near top, more space at bottom */}
        <div className="flex items-start justify-around gap-0.5 px-2 pt-1 pb-0 w-full max-w-md mx-auto">
          {buttons.map((button, index) => (
            <button
              key={index}
              onClick={button.onClick}
              className="thumb-bar-button flex flex-col items-center justify-center py-1 px-2 rounded-lg min-w-[44px]"
              style={{
                color: theme.backgroundCss,
                opacity: button.active === false ? 0.5 : 1,
              }}
              title={button.label}
              aria-label={button.label}
            >
              <span className="flex items-center justify-center h-5 text-base">
                {button.icon}
              </span>
              <span
                className="text-[9px] font-medium mt-0.5 leading-none"
                style={{ opacity: 0.9 }}
              >
                {button.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
