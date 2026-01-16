import { ColorTheme } from "@/components/DiceRoller/colorThemes";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import React from "react";

interface SettingsDrawerProps {
  onClose: () => void;
  theme: ColorTheme;
  soundEnabled: boolean;
  soundVolume: number;
  musicEnabled: boolean;
  musicVolume: number;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onSoundVolumeChange: (volume: number) => void;
  onMusicVolumeChange: (volume: number) => void;
}

export function SettingsDrawer({
  onClose,
  theme,
  soundEnabled,
  soundVolume,
  musicEnabled,
  musicVolume,
  onToggleSound,
  onToggleMusic,
  onSoundVolumeChange,
  onMusicVolumeChange,
}: SettingsDrawerProps): React.ReactElement {
  return (
    <Drawer open={true} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent
        className="min-h-[50vh] max-h-[85vh] mx-auto sm:max-w-md"
        style={{ backgroundColor: "rgba(255, 255, 255, 0.95)" }}
      >
        <DrawerHeader className="text-left">
          <DrawerTitle
            className="text-2xl font-black"
            style={{ color: theme.textPrimary }}
          >
            ⚙️ Settings
          </DrawerTitle>
        </DrawerHeader>

        <div className="space-y-6 px-4 pb-6 overflow-auto">
          {/* Sound Effects Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔊</span>
                <div>
                  <div
                    className="font-bold text-base"
                    style={{ color: theme.textPrimary }}
                  >
                    Sound Effects
                  </div>
                  <div
                    className="text-sm"
                    style={{ color: theme.textSecondary }}
                  >
                    Dice rolling sounds
                  </div>
                </div>
              </div>
              <button
                onClick={onToggleSound}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  backgroundColor: soundEnabled ? theme.accentColor : "#d1d5db",
                }}
                aria-label="Toggle sound effects"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    soundEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Sound Volume Slider */}
            {soundEnabled && (
              <div className="pl-11">
                <label
                  className="text-sm font-medium block mb-2"
                  style={{ color: theme.textPrimary }}
                >
                  Volume: {Math.round(soundVolume * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={soundVolume * 100}
                  onChange={(e) =>
                    onSoundVolumeChange(parseFloat(e.target.value) / 100)
                  }
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${
                      theme.accentColor
                    } 0%, ${theme.accentColor} ${soundVolume * 100}%, #d1d5db ${
                      soundVolume * 100
                    }%, #d1d5db 100%)`,
                  }}
                />
              </div>
            )}
          </div>

          {/* Music Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎵</span>
                <div>
                  <div
                    className="font-bold text-base"
                    style={{ color: theme.textPrimary }}
                  >
                    Background Music
                  </div>
                  <div
                    className="text-sm"
                    style={{ color: theme.textSecondary }}
                  >
                    Lofi chill beats
                  </div>
                </div>
              </div>
              <button
                onClick={onToggleMusic}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  backgroundColor: musicEnabled ? theme.accentColor : "#d1d5db",
                }}
                aria-label="Toggle background music"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    musicEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Music Volume Slider */}
            {musicEnabled && (
              <div className="pl-11">
                <label
                  className="text-sm font-medium block mb-2"
                  style={{ color: theme.textPrimary }}
                >
                  Volume: {Math.round(musicVolume * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={musicVolume * 100}
                  onChange={(e) =>
                    onMusicVolumeChange(parseFloat(e.target.value) / 100)
                  }
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${
                      theme.accentColor
                    } 0%, ${theme.accentColor} ${musicVolume * 100}%, #d1d5db ${
                      musicVolume * 100
                    }%, #d1d5db 100%)`,
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
