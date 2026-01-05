import * as THREE from "three";

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface PhysicsState {
  position: Vector3D;
  velocity: Vector3D;
  rotation: Vector3D;
  angularVelocity: Vector3D;
}

export interface DiceState {
  mesh: THREE.Mesh;
  physics: PhysicsState;
  settled: boolean;
  settleFrames: number;
  isSettling: boolean;
  targetFlatQuat: THREE.Quaternion | null;
}

export type DiceFaceNumber = 1 | 2 | 3 | 4 | 5 | 6;

export interface Bounds {
  left: number;
  right: number;
  front: number;
  back: number;
}

export interface GameState {
  gameStarted: boolean;
  totalScore: number;
  round: number;
  gameOver: boolean;
  lastRollTotal: number;
  isRolling: boolean;
  results: DiceFaceNumber[];
}
