import * as THREE from "three";
import { DiceFaceNumber } from "./types";

// Physics constants
export const GRAVITY = -40;
export const FLOOR_Y = 0;
export const CEILING_Y = 4;
export const DICE_SIZE = 1;
export const DICE_HALF_SIZE = DICE_SIZE / 2;
export const RESTITUTION = 0.25;
export const FRICTION = 0.95;
export const ANGULAR_FRICTION = 0.92;

// Colors - fun green theme
export const COLORS = {
  background: 0x90ee90,
  backgroundCss: "#90EE90",
  dice: "#fafafa",
  dot: "#4a4a4a",
  dotOne: "#c44",
  textPrimary: "#1a5a1a",
  textSecondary: "#2a7a2a",
  textTertiary: "#4a9a4a",
} as const;

// Face normals for a standard die (in local space)
// Face order matches BoxGeometry: +X, -X, +Y, -Y, +Z, -Z
export const FACE_NORMALS: Array<{
  normal: THREE.Vector3;
  value: DiceFaceNumber;
}> = [
  { normal: new THREE.Vector3(1, 0, 0), value: 3 }, // +X = 3
  { normal: new THREE.Vector3(-1, 0, 0), value: 4 }, // -X = 4
  { normal: new THREE.Vector3(0, 1, 0), value: 1 }, // +Y = 1
  { normal: new THREE.Vector3(0, -1, 0), value: 6 }, // -Y = 6
  { normal: new THREE.Vector3(0, 0, 1), value: 2 }, // +Z = 2
  { normal: new THREE.Vector3(0, 0, -1), value: 5 }, // -Z = 5
];

// Default bounds
export const DEFAULT_BOUNDS = {
  left: -4,
  right: 4,
  front: 4,
  back: -4,
} as const;
