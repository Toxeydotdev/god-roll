import { useTheme } from "@/components/DiceRoller/context";
import React from "react";

export function GameTitle(): React.ReactElement {
  const { theme } = useTheme();
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
