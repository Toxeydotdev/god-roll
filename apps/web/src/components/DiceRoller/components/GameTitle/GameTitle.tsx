import { useTheme } from "@/components/DiceRoller/context";
import React from "react";

export function GameTitle(): React.ReactElement {
  const { theme } = useTheme();
  return (
    <div>
      <h1
        className="text-3xl tracking-tight"
        style={{
          color: theme.textPrimary,
          fontFamily: "var(--font-display)",
          textShadow: `
            3px 3px 0px rgba(0,0,0,0.2),
            0 0 15px ${theme.buttonGlow}
          `,
          letterSpacing: "0.05em",
        }}
      >
        GOD-ROLL
      </h1>
    </div>
  );
}
