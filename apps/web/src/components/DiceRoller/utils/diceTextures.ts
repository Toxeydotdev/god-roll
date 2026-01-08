import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { DICE_SIZE } from "../constants";
import { DiceSkin, DotStyle, getDiceSkin } from "../diceSkins";
import { DiceFaceNumber } from "../types";

// Helper function to darken/lighten colors (positive percent lightens, negative darkens)
function shadeColor(color: string, percent: number): string {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));
  return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

// Helper function to draw a flower
function drawFlower(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  petalColor: string,
  centerColor: string,
  size: number = 1
): void {
  const petalRadius = 8 * size;
  const centerRadius = 5 * size;
  const numPetals = 5;

  // Draw petals
  for (let i = 0; i < numPetals; i++) {
    const angle = (i / numPetals) * Math.PI * 2;
    const petalX = x + Math.cos(angle) * petalRadius * 1.3;
    const petalY = y + Math.sin(angle) * petalRadius * 1.3;

    // Petal shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.beginPath();
    ctx.ellipse(
      petalX + 1,
      petalY + 1,
      petalRadius * 0.8,
      petalRadius,
      angle,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Petal with gradient
    const petalGradient = ctx.createRadialGradient(
      petalX - petalRadius * 0.3,
      petalY - petalRadius * 0.3,
      0,
      petalX,
      petalY,
      petalRadius
    );
    petalGradient.addColorStop(0, shadeColor(petalColor, 20));
    petalGradient.addColorStop(1, petalColor);
    ctx.fillStyle = petalGradient;
    ctx.beginPath();
    ctx.ellipse(
      petalX,
      petalY,
      petalRadius * 0.8,
      petalRadius,
      angle,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  // Draw center
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.beginPath();
  ctx.arc(x + 1, y + 1, centerRadius, 0, Math.PI * 2);
  ctx.fill();

  const centerGradient = ctx.createRadialGradient(
    x - centerRadius * 0.3,
    y - centerRadius * 0.3,
    0,
    x,
    y,
    centerRadius
  );
  centerGradient.addColorStop(0, shadeColor(centerColor, 15));
  centerGradient.addColorStop(1, centerColor);
  ctx.fillStyle = centerGradient;
  ctx.beginPath();
  ctx.arc(x, y, centerRadius, 0, Math.PI * 2);
  ctx.fill();
}

// Helper function to draw a fireball (flames licking upward)
function drawFireball(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  flameColor: string,
  coreColor: string,
  size: number = 1
): void {
  const baseSize = 14 * size;

  // Draw outer glow first
  const glowGradient = ctx.createRadialGradient(
    x,
    y + 2 * size,
    0,
    x,
    y,
    baseSize * 1.8
  );
  glowGradient.addColorStop(0, "rgba(255, 100, 0, 0.6)");
  glowGradient.addColorStop(0.5, "rgba(255, 50, 0, 0.3)");
  glowGradient.addColorStop(1, "rgba(255, 0, 0, 0)");
  ctx.fillStyle = glowGradient;
  ctx.beginPath();
  ctx.arc(x, y, baseSize * 1.8, 0, Math.PI * 2);
  ctx.fill();

  // Draw multiple flame tongues rising upward
  const flames = [
    { offsetX: 0, height: 1.8, width: 0.7 }, // Center tall flame
    { offsetX: -0.5, height: 1.3, width: 0.5 }, // Left flame
    { offsetX: 0.5, height: 1.4, width: 0.5 }, // Right flame
    { offsetX: -0.25, height: 1.5, width: 0.4 }, // Inner left
    { offsetX: 0.3, height: 1.2, width: 0.4 }, // Inner right
  ];

  flames.forEach((flame) => {
    const flameX = x + flame.offsetX * baseSize;
    const flameHeight = baseSize * flame.height;
    const flameWidth = baseSize * flame.width;

    // Flame gradient (yellow core to orange to red tip)
    const flameGradient = ctx.createLinearGradient(
      flameX,
      y + baseSize * 0.3,
      flameX,
      y - flameHeight
    );
    flameGradient.addColorStop(0, coreColor);
    flameGradient.addColorStop(0.3, flameColor);
    flameGradient.addColorStop(0.7, "#ff4500");
    flameGradient.addColorStop(1, "rgba(255, 69, 0, 0.3)");

    ctx.fillStyle = flameGradient;
    ctx.beginPath();
    // Start at bottom center of this flame
    ctx.moveTo(flameX, y + baseSize * 0.4);
    // Curve up left side
    ctx.bezierCurveTo(
      flameX - flameWidth,
      y,
      flameX - flameWidth * 0.6,
      y - flameHeight * 0.6,
      flameX,
      y - flameHeight
    );
    // Curve down right side
    ctx.bezierCurveTo(
      flameX + flameWidth * 0.6,
      y - flameHeight * 0.6,
      flameX + flameWidth,
      y,
      flameX,
      y + baseSize * 0.4
    );
    ctx.fill();
  });

  // Draw bright core at base
  const coreGradient = ctx.createRadialGradient(
    x,
    y + baseSize * 0.2,
    0,
    x,
    y + baseSize * 0.1,
    baseSize * 0.7
  );
  coreGradient.addColorStop(0, "#ffffff");
  coreGradient.addColorStop(0.4, coreColor);
  coreGradient.addColorStop(1, "rgba(255, 200, 0, 0)");
  ctx.fillStyle = coreGradient;
  ctx.beginPath();
  ctx.ellipse(
    x,
    y + baseSize * 0.2,
    baseSize * 0.6,
    baseSize * 0.4,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

// Helper function to draw a star
function drawStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  starColor: string,
  centerColor: string,
  size: number = 1
): void {
  const outerRadius = 18 * size;
  const innerRadius = 8 * size;
  const numPoints = 5;

  // Draw shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.beginPath();
  for (let i = 0; i < numPoints * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i / (numPoints * 2)) * Math.PI * 2 - Math.PI / 2;
    const px = x + 2 + Math.cos(angle) * radius;
    const py = y + 2 + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  // Draw star with gradient
  const starGradient = ctx.createRadialGradient(
    x - outerRadius * 0.2,
    y - outerRadius * 0.2,
    0,
    x,
    y,
    outerRadius
  );
  starGradient.addColorStop(0, shadeColor(starColor, 30));
  starGradient.addColorStop(1, starColor);
  ctx.fillStyle = starGradient;
  ctx.beginPath();
  for (let i = 0; i < numPoints * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i / (numPoints * 2)) * Math.PI * 2 - Math.PI / 2;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  // Draw center
  const centerGradient = ctx.createRadialGradient(
    x,
    y,
    0,
    x,
    y,
    innerRadius * 0.8
  );
  centerGradient.addColorStop(0, shadeColor(centerColor, 20));
  centerGradient.addColorStop(1, centerColor);
  ctx.fillStyle = centerGradient;
  ctx.beginPath();
  ctx.arc(x, y, innerRadius * 0.6, 0, Math.PI * 2);
  ctx.fill();
}

// Helper function to draw a heart
function drawHeart(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  heartColor: string,
  highlightColor: string,
  size: number = 1
): void {
  const scale = 1.2 * size;

  // Draw shadow
  ctx.save();
  ctx.translate(x + 2, y + 2);
  ctx.scale(scale, scale);
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.bezierCurveTo(-12, -20, -24, -5, 0, 15);
  ctx.bezierCurveTo(24, -5, 12, -20, 0, -8);
  ctx.fill();
  ctx.restore();

  // Draw heart with gradient
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  const heartGradient = ctx.createRadialGradient(-5, -5, 0, 0, 0, 25);
  heartGradient.addColorStop(0, shadeColor(heartColor, 25));
  heartGradient.addColorStop(1, heartColor);
  ctx.fillStyle = heartGradient;
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.bezierCurveTo(-12, -20, -24, -5, 0, 15);
  ctx.bezierCurveTo(24, -5, 12, -20, 0, -8);
  ctx.fill();

  // Highlight
  ctx.fillStyle = highlightColor;
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.ellipse(-8, -10, 4, 3, -0.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// Generic shape drawing function
function drawShape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  style: DotStyle,
  primaryColor: string,
  secondaryColor: string,
  size: number = 1
): void {
  switch (style) {
    case "flower":
      drawFlower(ctx, x, y, primaryColor, secondaryColor, size);
      break;
    case "fireball":
      drawFireball(ctx, x, y, primaryColor, secondaryColor, size);
      break;
    case "star":
      drawStar(ctx, x, y, primaryColor, secondaryColor, size);
      break;
    case "heart":
      drawHeart(ctx, x, y, primaryColor, secondaryColor, size);
      break;
    default:
      // Default circle handled in main drawing code
      break;
  }
}

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

  // Draw dots with cartoonish style or custom shapes if specified
  const dots = DOT_POSITIONS[faceNumber];
  const dotRadius = 24;
  const dotStyle = skin.dotStyle || "circle";
  const shapeAccentColor = skin.shapeAccentColor || skin.dotColor;
  const shapeCenterColor =
    skin.shapeCenterColor || skin.dotOneColor || skin.dotColor;

  dots.forEach(([x, y], index) => {
    if (dotStyle !== "circle") {
      // Draw custom shape
      drawShape(ctx, x, y, dotStyle, shapeAccentColor, shapeCenterColor, 1.2);
    } else {
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
      ctx.arc(
        x - dotRadius * 0.3,
        y - dotRadius * 0.3,
        dotRadius * 0.4,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
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
      const mat = m as THREE.MeshStandardMaterial;
      if (mat.map) {
        mat.map.dispose();
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
