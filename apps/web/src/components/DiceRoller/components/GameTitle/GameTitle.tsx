import { useTheme } from "@/components/DiceRoller/context";
import React from "react";

export function GameTitle(): React.ReactElement {
  const { theme } = useTheme();
  return (
    <div className="absolute top-4 left-4 z-10">
      <h1
        className="text-3xl tracking-tight"
        style={{ 
          color: theme.textPrimary,
          fontFamily: 'var(--font-display)',
          textShadow: '3px 3px 0px rgba(0,0,0,0.2)',
          letterSpacing: '0.05em',
        }}
      >
        GOD ROLL
      </h1>
    </div>
  );
}
