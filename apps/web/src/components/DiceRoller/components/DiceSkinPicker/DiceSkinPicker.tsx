/**
 * DiceSkinPicker - Modal for selecting dice skins
 *
 * Displays available dice skins with preview and description
 */

import { ColorTheme } from "@/components/DiceRoller/colorThemes";
import { useDiceSkin } from "@/components/DiceRoller/context";
import { getAllDiceSkins } from "@/components/DiceRoller/diceSkins";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
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
    <Drawer open={true} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent
        className="max-h-[85vh] mx-auto sm:max-w-2xl flex flex-col"
        style={{ backgroundColor: theme.backgroundCss }}
      >
        <DrawerHeader>
          <DrawerTitle
            className="text-2xl font-bold"
            style={{ color: theme.textPrimary }}
          >
            🎲 Choose Dice Skin
          </DrawerTitle>
        </DrawerHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto flex-1 px-4 pb-6">
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
      </DrawerContent>
    </Drawer>
  );
}
