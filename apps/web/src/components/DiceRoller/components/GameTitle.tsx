import React from "react";
import { COLORS } from "../constants";

export function GameTitle(): React.ReactElement {
  return (
    <div className="absolute top-4 left-4 z-10">
      <h1
        className="text-3xl font-black tracking-tight"
        style={{ color: COLORS.textPrimary }}
      >
        GOD
        <br />
        ROLL
      </h1>
    </div>
  );
}
