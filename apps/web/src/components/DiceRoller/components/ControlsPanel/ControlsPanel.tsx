import { useModal, useSound, useTheme } from "@/components/DiceRoller/context";
import React, { useState } from "react";

interface ControlButtonsProps {
  isOpen: boolean;
}

function ControlButtons({ isOpen }: ControlButtonsProps) {
  const { openModal } = useModal();
  const { soundEnabled, toggleSound, musicEnabled, toggleMusic } = useSound();
  const { theme } = useTheme();

  const soundIcon = soundEnabled ? (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
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
      width="16"
      height="16"
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
      label: soundEnabled ? "Mute sound" : "Unmute sound",
      onClick: toggleSound,
    },
    {
      icon: musicEnabled ? "🎵" : "🔇",
      label: musicEnabled ? "Stop music" : "Play music",
      onClick: toggleMusic,
    },
    {
      icon: "🎨",
      label: "Change theme",
      onClick: () => openModal("colorPicker"),
    },
    {
      icon: "🎲",
      label: "Change dice skin",
      onClick: () => openModal("diceSkin"),
    },
    { icon: "❓", label: "Show rules", onClick: () => openModal("rules") },
    {
      icon: "🏆",
      label: "Show leaderboard",
      onClick: () => openModal("leaderboard"),
    },
  ];

  return (
    <>
      <style>{`
        @keyframes button-float-in {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.8);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes button-float-out {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(20px) scale(0.8);
          }
        }

        @keyframes hover-float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-6px);
          }
        }

        .control-button {
          animation: ${
            isOpen
              ? "button-float-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)"
              : "button-float-out 0.4s ease-in"
          } forwards;
        }

        .control-button:hover {
          animation: ${
            isOpen
              ? "button-float-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, hover-float 2s ease-in-out infinite"
              : "button-float-out 0.4s ease-in forwards"
          };
        }
      `}</style>
      <div
        className="absolute top-12 left-1/2 transform -translate-x-1/2 flex flex-col gap-3"
        style={{
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
        }}
      >
        {buttons.map((button, index) => (
          <button
            key={index}
            onClick={button.onClick}
            className="control-button w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            style={{
              backgroundColor: theme.textSecondary,
              color: theme.backgroundCss,
              animationDelay: isOpen ? `${index * 0.08}s` : "0s",
              opacity: 1,
              transform: "scale(1)",
            }}
            title={button.label}
            aria-label={button.label}
          >
            {button.icon}
          </button>
        ))}
      </div>
    </>
  );
}

export function ControlsPanel(): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const { theme } = useTheme();

  return (
    <div className="fixed z-50" style={{ top: "132px", right: "1rem" }}>
      <style>{`
        @keyframes gear-spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .gear-button:hover {
          animation: gear-spin 0.6s ease-in-out;
        }

        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 0 0px rgba(255, 255, 255, 0.4);
          }
          50% {
            box-shadow: 0 0 0 6px rgba(255, 255, 255, 0);
          }
        }

        .gear-button.active {
          animation: pulse-glow 2s infinite;
        }
      `}</style>

      {/* Main gear button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`gear-button w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 relative z-10 ${
          isOpen ? "active" : ""
        }`}
        style={{
          backgroundColor: theme.textSecondary,
          color: theme.backgroundCss,
          opacity: isOpen ? 1 : 0.8,
          transform: isOpen ? "scale(1.1)" : "scale(1)",
        }}
        title={isOpen ? "Close controls" : "Open controls"}
        aria-label={isOpen ? "Close controls" : "Open controls"}
      >
        ⚙️
      </button>

      {/* Control buttons container */}
      <ControlButtons isOpen={isOpen} />
    </div>
  );
}
