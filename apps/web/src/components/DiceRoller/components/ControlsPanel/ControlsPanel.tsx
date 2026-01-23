import {
  useAchievements,
  useAuth,
  useModal,
  useTheme,
} from "@/components/DiceRoller/context";
import React from "react";

export function ControlsPanel(): React.ReactElement {
  const { openModal } = useModal();
  const { theme } = useTheme();
  const { unlockedCount, totalAchievements, isSyncing } = useAchievements();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const buttons = [
    {
      icon: <span className="text-lg">⚙️</span>,
      label: "Settings",
      onClick: () => openModal("settings"),
    },
    {
      icon: <span className="text-lg">�</span>,
      label: "Support",
      onClick: () => openModal("support"),
    },
    {
      icon: <span className="text-lg">�🎁</span>,
      label: "Rewards",
      onClick: () => openModal("rewards"),
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
    {
      icon: (
        <span className="text-lg relative">
          {authLoading || isSyncing ? "⏳" : isAuthenticated ? "👤" : "🔑"}
          {isAuthenticated && (
            <span
              className="absolute -top-1 -right-2 text-[8px] font-bold rounded-full px-1"
              style={{
                backgroundColor: "#22c55e",
                color: "#fff",
                minWidth: "6px",
                lineHeight: "10px",
              }}
            >
              ✓
            </span>
          )}
        </span>
      ),
      label: isAuthenticated ? "Account" : "Login",
      onClick: () => openModal("auth"),
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
          background: rgba(255,255,255,0.15);
        }

        .thumb-bar-button:active {
          transform: scale(0.95);
        }

        /* Desktop/Web: Larger floating island */
        @media (min-width: 640px) {
          .thumb-bar-island {
            border-radius: 20px;
            padding: 8px 16px;
            margin: 0 auto 12px;
            max-width: fit-content;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1);
          }
          
          .thumb-bar-button {
            padding: 6px 10px !important;
            min-width: 56px !important;
          }
          
          .thumb-bar-button .icon-size {
            font-size: 20px !important;
            height: 24px !important;
          }
          
          .thumb-bar-button .label-size {
            font-size: 10px !important;
            margin-top: 2px !important;
          }
        }

        /* Large desktop: Even bigger */
        @media (min-width: 1024px) {
          .thumb-bar-island {
            padding: 10px 20px;
            border-radius: 22px;
          }
          
          .thumb-bar-button {
            padding: 8px 12px !important;
            min-width: 60px !important;
            gap: 2px;
          }
          
          .thumb-bar-button .icon-size {
            font-size: 22px !important;
            height: 26px !important;
          }
          
          .thumb-bar-button .label-size {
            font-size: 11px !important;
          }
        }
      `}</style>

      {/* Bottom thumb bar - floating island design */}
      <div
        className="thumb-bar thumb-bar-island w-full sm:w-auto"
        style={{
          background: `linear-gradient(180deg, ${theme.textSecondary}F8 0%, ${theme.textSecondary}F0 100%)`,
          boxShadow: `0 -4px 20px rgba(0,0,0,0.2)`,
          backdropFilter: "blur(12px)",
          borderTop: `1px solid rgba(255,255,255,0.15)`,
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 8px)",
        }}
      >
        {/* Bar container */}
        <div className="flex items-start justify-around gap-1 sm:gap-2 px-2 pt-1 pb-0 w-full">
          {buttons.map((button, index) => (
            <button
              key={index}
              onClick={button.onClick}
              className="thumb-bar-button flex flex-col items-center justify-center py-1 px-2 rounded-xl min-w-[44px]"
              style={{
                color: theme.backgroundCss,
                opacity: button.active === false ? 0.5 : 1,
              }}
              title={button.label}
              aria-label={button.label}
            >
              <span className="icon-size flex items-center justify-center h-5 text-lg">
                {button.icon}
              </span>
              <span
                className="label-size text-[9px] font-medium mt-0.5 leading-none"
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
