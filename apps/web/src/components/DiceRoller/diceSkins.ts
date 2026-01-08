/**
 * Dice Skins - Visual variations for dice
 *
 * Each skin defines the visual appearance of dice including colors,
 * materials, and special effects.
 */

export type DotStyle = "circle" | "flower" | "fireball" | "star" | "heart";

export interface DiceSkin {
  id: string;
  name: string;
  description: string;
  diceColor: string;
  dotColor: string;
  dotOneColor?: string; // Optional special color for center dot on face 1
  opacity?: number; // For translucent dice (0-1)
  roughness?: number; // Material roughness (0-1)
  metalness?: number; // Material metalness (0-1)
  emissive?: string; // Emissive color for glowing effects
  emissiveIntensity?: number; // Glow intensity (0-1)
  dotStyle?: DotStyle; // Shape style for dots (default: 'circle')
  shapeAccentColor?: string; // Secondary color for shapes (e.g., petal tips, flame core)
  shapeCenterColor?: string; // Center color for shapes (e.g., flower center, fireball core)
}

export const DICE_SKINS: Record<string, DiceSkin> = {
  cartoon: {
    id: "cartoon",
    name: "Cartoon",
    description: "Bright and playful cartoon-style dice",
    diceColor: "#ff6b6b",
    dotColor: "#ffffff",
    dotOneColor: "#ffd93d",
    roughness: 0.25,
  },
  classic: {
    id: "classic",
    name: "Classic",
    description: "Traditional white dice with black dots",
    diceColor: "#fafafa",
    dotColor: "#4a4a4a",
    dotOneColor: "#c44",
    roughness: 0.2,
  },
  casino: {
    id: "casino",
    name: "Casino",
    description: "Translucent red dice like real casino dice",
    diceColor: "#ff0000",
    dotColor: "#ffffff",
    dotOneColor: "#ffffff",
    opacity: 0.6,
    roughness: 0.1,
  },
  midnight: {
    id: "midnight",
    name: "Midnight",
    description: "Sleek black dice with gold accents",
    diceColor: "#1a1a1a",
    dotColor: "#ffd700",
    dotOneColor: "#ffd700",
    roughness: 0.3,
    metalness: 0.2,
  },
  neon: {
    id: "neon",
    name: "Neon Glow",
    description: "Glowing cyan dice with electric blue dots",
    diceColor: "#0a0a0a",
    dotColor: "#00ffff",
    dotOneColor: "#ff00ff",
    emissive: "#00ffff",
    emissiveIntensity: 0.5,
    roughness: 0.1,
  },
  emerald: {
    id: "emerald",
    name: "Emerald",
    description: "Luxurious green translucent with gold dots",
    diceColor: "#00a86b",
    dotColor: "#ffd700",
    dotOneColor: "#ffd700",
    opacity: 0.7,
    roughness: 0.15,
    metalness: 0.1,
  },
  ruby: {
    id: "ruby",
    name: "Ruby",
    description: "Deep red with shimmering silver accents",
    diceColor: "#9b111e",
    dotColor: "#c0c0c0",
    dotOneColor: "#ffffff",
    roughness: 0.2,
    metalness: 0.3,
  },
  ice: {
    id: "ice",
    name: "Ice Crystal",
    description: "Frosted translucent with icy blue dots",
    diceColor: "#e0f4ff",
    dotColor: "#1e90ff",
    dotOneColor: "#00bfff",
    opacity: 0.5,
    roughness: 0.05,
  },
  tiana: {
    id: "tiana",
    name: "Tiana",
    description: "Beautiful pink dice with delicate flower dots",
    diceColor: "#ff91a4",
    dotColor: "#ffffff",
    dotOneColor: "#ffd700",
    dotStyle: "flower",
    shapeAccentColor: "#ffffff",
    shapeCenterColor: "#ffd700",
    roughness: 0.15,
    metalness: 0,
  },
  inferno: {
    id: "inferno",
    name: "Inferno",
    description: "Blazing dice with fireball dots",
    diceColor: "#1a0a00",
    dotColor: "#ff4500",
    dotOneColor: "#ffff00",
    dotStyle: "fireball",
    shapeAccentColor: "#ff6600",
    shapeCenterColor: "#ffff00",
    emissive: "#ff2200",
    emissiveIntensity: 0.3,
    roughness: 0.2,
  },
};

export const DEFAULT_SKIN_ID = "cartoon";

export function getDiceSkin(skinId: string): DiceSkin {
  return DICE_SKINS[skinId] || DICE_SKINS[DEFAULT_SKIN_ID];
}

export function getAllDiceSkins(): DiceSkin[] {
  return Object.values(DICE_SKINS);
}

export function getSavedSkinId(): string {
  try {
    return localStorage.getItem("godroll_dice_skin_v1") || DEFAULT_SKIN_ID;
  } catch {
    return DEFAULT_SKIN_ID;
  }
}

export function saveSkinId(skinId: string): void {
  try {
    localStorage.setItem("godroll_dice_skin_v1", skinId);
  } catch {
    // localStorage not available
  }
}
