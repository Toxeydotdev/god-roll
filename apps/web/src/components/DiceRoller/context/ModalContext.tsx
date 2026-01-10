/**
 * ModalContext - Centralized modal state management with Portal rendering
 *
 * Provides a clean API for opening/closing modals without prop drilling.
 * All modals are rendered at document root via createPortal to avoid z-index issues.
 */

import { ColorTheme } from "@/components/DiceRoller/colorThemes";
import {
  AchievementsModal,
  ColorPicker,
  DiceSkinPicker,
  GameRules,
  Leaderboard,
} from "@/components/DiceRoller/components";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useAchievements } from "./AchievementContext";
import { useTheme } from "./ThemeContext";

// ============================================================================
// TYPES
// ============================================================================

export type ModalType =
  | "leaderboard"
  | "rules"
  | "colorPicker"
  | "diceSkin"
  | "achievements";

interface LeaderboardModalProps {
  highlightIndex?: number;
}

interface ColorPickerModalProps {
  currentTheme: ColorTheme;
  onSelectTheme: (theme: ColorTheme) => void;
}

type ModalProps =
  | LeaderboardModalProps
  | ColorPickerModalProps
  | Record<string, never>;

interface ModalState {
  type: ModalType;
  props: ModalProps;
}

interface ModalContextValue {
  openModal: (type: ModalType, props?: ModalProps) => void;
  closeModal: () => void;
  activeModal: ModalState | null;
}

// ============================================================================
// CONTEXT
// ============================================================================

const ModalContext = createContext<ModalContextValue | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

interface ModalProviderProps {
  children: ReactNode;
}

export function ModalProvider({
  children,
}: ModalProviderProps): React.ReactElement {
  const [activeModal, setActiveModal] = useState<ModalState | null>(null);
  const { theme, setTheme } = useTheme();
  const { unlockedAchievements, profile } = useAchievements();

  const openModal = useCallback((type: ModalType, props: ModalProps = {}) => {
    setActiveModal({ type, props });
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  // Render modal via portal
  const renderModal = () => {
    if (!activeModal) return null;

    const { type, props } = activeModal;

    let modalElement: ReactNode = null;

    switch (type) {
      case "leaderboard":
        modalElement = (
          <Leaderboard
            onClose={closeModal}
            highlightIndex={(props as LeaderboardModalProps).highlightIndex}
            theme={theme}
          />
        );
        break;

      case "rules":
        modalElement = <GameRules onClose={closeModal} theme={theme} />;
        break;

      case "colorPicker":
        modalElement = (
          <ColorPicker
            currentTheme={theme}
            onSelectTheme={(newTheme: ColorTheme) => {
              setTheme(newTheme);
              closeModal();
            }}
            onClose={closeModal}
          />
        );
        break;

      case "diceSkin":
        modalElement = <DiceSkinPicker onClose={closeModal} theme={theme} />;
        break;

      case "achievements":
        modalElement = (
          <AchievementsModal
            onClose={closeModal}
            theme={theme}
            unlockedAchievements={unlockedAchievements}
            profile={profile}
          />
        );
        break;
    }

    return createPortal(modalElement, document.body);
  };

  return (
    <ModalContext.Provider value={{ openModal, closeModal, activeModal }}>
      {children}
      {renderModal()}
    </ModalContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useModal(): ModalContextValue {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
}
