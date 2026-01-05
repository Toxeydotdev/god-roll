import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { COLORS, DICE_SIZE } from "../constants";
import { DiceFaceNumber } from "../types";

// Dot positions for each number (scaled for 256px canvas)
const DOT_POSITIONS: Record<DiceFaceNumber, Array<[number, number]>> = {
  1: [[128, 128]],
  2: [
    [64, 64],
    [192, 192],
  ],
  3: [
    [64, 64],
    [128, 128],
    [192, 192],
  ],
  4: [
    [64, 64],
    [192, 64],
    [64, 192],
    [192, 192],
  ],
  5: [
    [64, 64],
    [192, 64],
    [128, 128],
    [64, 192],
    [192, 192],
  ],
  6: [
    [64, 64],
    [192, 64],
    [64, 128],
    [192, 128],
    [64, 192],
    [192, 192],
  ],
};

export function createFaceTexture(
  faceNumber: DiceFaceNumber
): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not get 2D context");
  }

  // Background
  ctx.fillStyle = COLORS.dice;
  ctx.fillRect(0, 0, size, size);

  // Draw dots
  const dots = DOT_POSITIONS[faceNumber];
  const dotRadius = 22;

  dots.forEach(([x, y], index) => {
    // Use red for center dot on face 1
    const isCenter = faceNumber === 1 && index === 0;
    ctx.fillStyle = isCenter ? COLORS.dotOne : COLORS.dot;
    ctx.beginPath();
    ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
    ctx.fill();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export function createDiceMesh(): THREE.Mesh {
  const geometry = new RoundedBoxGeometry(
    DICE_SIZE,
    DICE_SIZE,
    DICE_SIZE,
    4,
    0.1
  );
  geometry.computeVertexNormals();

  const materials: THREE.MeshStandardMaterial[] = [
    new THREE.MeshStandardMaterial({
      map: createFaceTexture(3),
      roughness: 0.2,
    }),
    new THREE.MeshStandardMaterial({
      map: createFaceTexture(4),
      roughness: 0.2,
    }),
    new THREE.MeshStandardMaterial({
      map: createFaceTexture(1),
      roughness: 0.2,
    }),
    new THREE.MeshStandardMaterial({
      map: createFaceTexture(6),
      roughness: 0.2,
    }),
    new THREE.MeshStandardMaterial({
      map: createFaceTexture(2),
      roughness: 0.2,
    }),
    new THREE.MeshStandardMaterial({
      map: createFaceTexture(5),
      roughness: 0.2,
    }),
  ];

  const dice = new THREE.Mesh(geometry, materials);
  dice.castShadow = true;
  dice.receiveShadow = true;

  return dice;
}

export function disposeDiceMesh(mesh: THREE.Mesh): void {
  mesh.geometry.dispose();
  if (Array.isArray(mesh.material)) {
    mesh.material.forEach((m) => m.dispose());
  } else {
    mesh.material.dispose();
  }
}
