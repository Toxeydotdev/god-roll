/**
 * DiceSkinPicker - Modal for selecting dice skins
 *
 * Displays available dice skins with preview and description
 */

import { ColorTheme } from "@/components/DiceRoller/colorThemes";
import { useDiceSkin } from "@/components/DiceRoller/context";
import { getAllDiceSkins } from "@/components/DiceRoller/diceSkins";
import React from "react";

interface DiceSkinPickerProps {
  theme: ColorTheme;
  onClose: () => void;
}

export function DiceSkinPicker({
  theme,
  onClose,
}: DiceSkinPickerProps): React.ReactElement {
  const { skinId, setSkinId } = useDiceSkin();
  const skins = getAllDiceSkins();

  const handleSkinSelect = (newSkinId: string) => {
    setSkinId(newSkinId);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center z-30 bg-black/60"
      onClick={onClose}
    >
      <div
        className="rounded-t-3xl sm:rounded-2xl p-6 pt-3 shadow-2xl w-full sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
        style={{
          backgroundColor: theme.backgroundCss,
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
            className="text-2xl font-bold"
            style={{ color: theme.textPrimary }}
          >
            🎲 Choose Dice Skin
          </h2>
          <button
            onClick={onClose}
            className="hidden sm:flex w-8 h-8 rounded-full items-center justify-center text-lg hover:bg-black/10 transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto flex-1">
          {skins.map((skin) => (
            <button
              key={skin.id}
              onClick={() => handleSkinSelect(skin.id)}
              className="p-4 rounded-lg transition-all border-2 text-left hover:scale-105"
              style={{
                borderColor:
                  skinId === skin.id ? theme.textPrimary : "transparent",
                backgroundColor:
                  skinId === skin.id
                    ? `${theme.textPrimary}20`
                    : theme.backgroundCss,
              }}
            >
              {/* Visual preview of dice skin */}
              <div
                className="w-full h-20 rounded-md mb-3 flex items-center justify-center text-2xl font-bold shadow-inner"
                style={{
                  backgroundColor: skin.diceColor,
                  color: skin.dotColor,
                  opacity: skin.opacity ?? 1,
                }}
              >
                ⚅
              </div>
              <h3
                className="font-bold text-lg mb-1"
                style={{ color: theme.textPrimary }}
              >
                {skin.name}
              </h3>
              <p className="text-sm" style={{ color: theme.textSecondary }}>
                {skin.description}
              </p>
              {skinId === skin.id && (
                <div
                  className="mt-2 text-xs font-semibold"
                  style={{ color: theme.textPrimary }}
                >
                  ✓ Currently selected
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
