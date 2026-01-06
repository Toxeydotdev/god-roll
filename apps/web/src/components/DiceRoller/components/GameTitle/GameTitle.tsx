import { ColorTheme } from "@/components/DiceRoller/colorThemes";
import React from "react";

interface GameTitleProps {
  theme: ColorTheme;
}

export function GameTitle({ theme }: GameTitleProps): React.ReactElement {
  return (
    <div className="absolute top-4 left-4 z-10">
      <h1
        className="text-3xl font-black tracking-tight"
        style={{ color: theme.textPrimary }}
      >
        GOD ROLL
      </h1>
    </div>
  );
}
