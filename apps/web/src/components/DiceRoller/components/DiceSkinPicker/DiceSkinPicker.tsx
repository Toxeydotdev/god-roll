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
    <div className="fixed inset-0 flex items-center justify-center z-30 bg-black/60 p-4 min-h-dvh">
      <div
        className="rounded-2xl p-6 shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
        style={{ backgroundColor: theme.backgroundCss }}
      >
        <h2
          className="text-2xl font-bold mb-4"
          style={{ color: theme.textPrimary }}
        >
          🎲 Choose Dice Skin
        </h2>
        <div className="grid grid-cols-2 gap-4 overflow-y-auto flex-1">
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
        <button
          onClick={onClose}
          className="mt-4 px-6 py-2 rounded-full font-bold text-lg transition-all hover:scale-105 active:scale-95"
          style={{
            backgroundColor: theme.textPrimary,
            color: theme.backgroundCss,
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
}
