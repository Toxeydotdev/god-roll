import { COLOR_THEMES, ColorTheme } from "@/components/DiceRoller/colorThemes";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import React from "react";

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
    <Drawer open={true} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent
        className="min-h-[50vh] max-h-[85vh] mx-auto sm:max-w-md"
        style={{ backgroundColor: currentTheme.backgroundCss }}
      >
        <DrawerHeader className="text-center">
          <DrawerTitle
            className="text-2xl font-black"
            style={{ color: currentTheme.textPrimary }}
          >
            🎨 Choose Theme
          </DrawerTitle>
        </DrawerHeader>

        <div className="grid grid-cols-3 gap-3 px-4 pb-6">
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
      </DrawerContent>
    </Drawer>
  );
}
