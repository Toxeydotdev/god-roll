import { ColorTheme } from "@/components/DiceRoller/colorThemes";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import React from "react";

interface GameRulesProps {
  onClose: () => void;
  theme: ColorTheme;
}

export function GameRules({
  onClose,
  theme,
}: GameRulesProps): React.ReactElement {
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
            📜 How to Play
          </DrawerTitle>
        </DrawerHeader>

        <div
          className="space-y-3 text-base overflow-auto px-4 pb-6"
          style={{ color: theme.textPrimary }}
        >
          <div>
            <span className="font-bold">🎯 Goal:</span> Score as high as
            possible without rolling a total divisible by 7.
          </div>

          <div>
            <span className="font-bold">🎲 Each Round:</span> Roll all the dice.
            Your roll total is added to your score.
          </div>

          <div>
            <span className="font-bold">📈 Dice Increase:</span> You start with
            1 die. Each successful round adds another die to your pool.
          </div>

          <div>
            <span className="font-bold">💀 Game Over:</span> If your roll total
            is divisible by 7, the game ends!
          </div>

          <div className="pt-2 border-t border-gray-200">
            <span className="font-bold">💡 Tip:</span> More dice means higher
            potential scores, but also increases your risk of hitting a multiple
            of 7!
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
