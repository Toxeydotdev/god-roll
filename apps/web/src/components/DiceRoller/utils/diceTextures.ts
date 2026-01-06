import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { DICE_SIZE } from "../constants";
import { DiceSkin, getDiceSkin } from "../diceSkins";
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
  faceNumber: DiceFaceNumber,
  skin: DiceSkin
): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not get 2D context");
  }

  // Background with subtle gradient for depth
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 1.4
  );
  gradient.addColorStop(0, skin.diceColor);
  gradient.addColorStop(1, shadeColor(skin.diceColor, -15));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Draw dots with cartoonish style
  const dots = DOT_POSITIONS[faceNumber];
  const dotRadius = 24;

  dots.forEach(([x, y], index) => {
    // Use special color for center dot on face 1 if defined
    const isCenter = faceNumber === 1 && index === 0;
    const dotColor =
      isCenter && skin.dotOneColor ? skin.dotOneColor : skin.dotColor;
    
    // Draw dot shadow for 3D effect
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.beginPath();
    ctx.arc(x + 2, y + 2, dotRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw main dot with gradient
    const dotGradient = ctx.createRadialGradient(
      x - dotRadius * 0.3,
      y - dotRadius * 0.3,
      0,
      x,
      y,
      dotRadius
    );
    dotGradient.addColorStop(0, shadeColor(dotColor, 20));
    dotGradient.addColorStop(1, dotColor);
    ctx.fillStyle = dotGradient;
    ctx.beginPath();
    ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Add highlight for glossy effect
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.beginPath();
    ctx.arc(x - dotRadius * 0.3, y - dotRadius * 0.3, dotRadius * 0.4, 0, Math.PI * 2);
    ctx.fill();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Helper function to darken/lighten colors (positive percent lightens, negative darkens)
function shadeColor(color: string, percent: number): string {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));
  return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

export function createDiceMesh(skinId?: string): THREE.Mesh {
  const skin = getDiceSkin(skinId || "classic");

  const geometry = new RoundedBoxGeometry(
    DICE_SIZE,
    DICE_SIZE,
    DICE_SIZE,
    4,
    0.15
  );
  geometry.computeVertexNormals();

  const materialProps: THREE.MeshStandardMaterialParameters = {
    roughness: skin.roughness ?? 0.2,
    metalness: skin.metalness ?? 0,
    transparent: skin.opacity !== undefined && skin.opacity < 1,
    opacity: skin.opacity ?? 1,
  };

  // Add emissive properties if skin has them
  if (skin.emissive) {
    materialProps.emissive = new THREE.Color(skin.emissive);
    materialProps.emissiveIntensity = skin.emissiveIntensity ?? 0;
  }

  const materials: THREE.MeshStandardMaterial[] = [
    new THREE.MeshStandardMaterial({
      ...materialProps,
      map: createFaceTexture(3, skin),
    }),
    new THREE.MeshStandardMaterial({
      ...materialProps,
      map: createFaceTexture(4, skin),
    }),
    new THREE.MeshStandardMaterial({
      ...materialProps,
      map: createFaceTexture(1, skin),
    }),
    new THREE.MeshStandardMaterial({
      ...materialProps,
      map: createFaceTexture(6, skin),
    }),
    new THREE.MeshStandardMaterial({
      ...materialProps,
      map: createFaceTexture(2, skin),
    }),
    new THREE.MeshStandardMaterial({
      ...materialProps,
      map: createFaceTexture(5, skin),
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

export function updateDiceSkin(mesh: THREE.Mesh, skinId: string): void {
  const skin = getDiceSkin(skinId);

  // Dispose old materials and textures
  if (Array.isArray(mesh.material)) {
    mesh.material.forEach((m) => {
      if (m.map) {
        m.map.dispose();
      }
      m.dispose();
    });
  }

  const materialProps: THREE.MeshStandardMaterialParameters = {
    roughness: skin.roughness ?? 0.2,
    metalness: skin.metalness ?? 0,
    transparent: skin.opacity !== undefined && skin.opacity < 1,
    opacity: skin.opacity ?? 1,
  };

  // Add emissive properties if skin has them
  if (skin.emissive) {
    materialProps.emissive = new THREE.Color(skin.emissive);
    materialProps.emissiveIntensity = skin.emissiveIntensity ?? 0;
  }

  // Create new materials with updated skin
  // Face order: +X(3), -X(4), +Y(1), -Y(6), +Z(2), -Z(5)
  const materials: THREE.MeshStandardMaterial[] = [
    new THREE.MeshStandardMaterial({
      ...materialProps,
      map: createFaceTexture(3, skin),
    }),
    new THREE.MeshStandardMaterial({
      ...materialProps,
      map: createFaceTexture(4, skin),
    }),
    new THREE.MeshStandardMaterial({
      ...materialProps,
      map: createFaceTexture(1, skin),
    }),
    new THREE.MeshStandardMaterial({
      ...materialProps,
      map: createFaceTexture(6, skin),
    }),
    new THREE.MeshStandardMaterial({
      ...materialProps,
      map: createFaceTexture(2, skin),
    }),
    new THREE.MeshStandardMaterial({
      ...materialProps,
      map: createFaceTexture(5, skin),
    }),
  ];

  // Apply new materials
  mesh.material = materials;

  // Mark materials as needing update
  materials.forEach((mat) => {
    mat.needsUpdate = true;
    if (mat.map) {
      mat.map.needsUpdate = true;
    }
  });

  // Force geometry to update
  if (mesh.geometry) {
    mesh.geometry.attributes.position.needsUpdate = true;
  }
}
