import React, { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

// Type definitions
interface Vector3D {
  x: number;
  y: number;
  z: number;
}

interface PhysicsState {
  position: Vector3D;
  velocity: Vector3D;
  rotation: Vector3D;
  angularVelocity: Vector3D;
}

interface DiceState {
  mesh: THREE.Mesh;
  physics: PhysicsState;
  settled: boolean;
  settleFrames: number; // Count frames at rest to confirm settled
  isSettling: boolean; // Whether we're in the settling phase
  targetFlatQuat: THREE.Quaternion | null; // Target quaternion for flat settling
}

type DiceFaceNumber = 1 | 2 | 3 | 4 | 5 | 6;

// Face normals for a standard die (in local space)
// Face order matches BoxGeometry: +X, -X, +Y, -Y, +Z, -Z
const FACE_NORMALS: Array<{ normal: THREE.Vector3; value: DiceFaceNumber }> = [
  { normal: new THREE.Vector3(1, 0, 0), value: 3 }, // +X = 3
  { normal: new THREE.Vector3(-1, 0, 0), value: 4 }, // -X = 4
  { normal: new THREE.Vector3(0, 1, 0), value: 1 }, // +Y = 1
  { normal: new THREE.Vector3(0, -1, 0), value: 6 }, // -Y = 6
  { normal: new THREE.Vector3(0, 0, 1), value: 2 }, // +Z = 2
  { normal: new THREE.Vector3(0, 0, -1), value: 5 }, // -Z = 5
];

// Physics constants
const GRAVITY = -25; // Balanced gravity
const FLOOR_Y = 0;
const DICE_SIZE = 1;
const DICE_HALF_SIZE = DICE_SIZE / 2;
const RESTITUTION = 0.25; // Slightly bouncy
const FRICTION = 0.95; // Moderate friction
const ANGULAR_FRICTION = 0.92; // Moderate angular friction

// Colors matching the image
const BACKGROUND_COLOR = 0xf0e68c; // Yellow/khaki
const DICE_COLOR = "#fafafa";
const DOT_COLOR = "#4a4a4a";
const DOT_COLOR_ONE = "#c44"; // Red for center dot on 1

// Viewport boundaries
interface Bounds {
  left: number;
  right: number;
  front: number;
  back: number;
}

export function DiceRoller(): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const diceStatesRef = useRef<DiceState[]>([]);
  const animationRef = useRef<number | null>(null);
  const isRollingRef = useRef<boolean>(false);
  const boundsRef = useRef<Bounds>({ left: -4, right: 4, front: 4, back: -4 });

  const [diceCount, setDiceCount] = useState<number>(5); // Start screen shows 5 decorative dice
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [results, setResults] = useState<DiceFaceNumber[]>([]);

  // Game state
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [round, setRound] = useState<number>(1);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [lastRollTotal, setLastRollTotal] = useState<number>(0);
  const [resetProgress, setResetProgress] = useState<number>(0);
  const resetTimerRef = useRef<number | null>(null);

  // Get the top face value of a dice based on its rotation
  const getTopFace = useCallback((mesh: THREE.Mesh): DiceFaceNumber => {
    const euler = mesh.rotation;
    const quaternion = new THREE.Quaternion().setFromEuler(euler);

    let maxY = -Infinity;
    let topFace: DiceFaceNumber = 1;

    for (const face of FACE_NORMALS) {
      // Transform the face normal by the dice's rotation
      const worldNormal = face.normal.clone().applyQuaternion(quaternion);

      // The face pointing most upward (highest Y) is on top
      if (worldNormal.y > maxY) {
        maxY = worldNormal.y;
        topFace = face.value;
      }
    }

    return topFace;
  }, []);

  // Snap dice to flat orientation based on which face is most upward
  const snapToFlat = useCallback((mesh: THREE.Mesh): void => {
    const euler = mesh.rotation;
    const quaternion = new THREE.Quaternion().setFromEuler(euler);

    let maxY = -Infinity;
    let topFaceNormal: THREE.Vector3 = new THREE.Vector3(0, 1, 0);

    // Find which face normal is pointing most upward
    for (const face of FACE_NORMALS) {
      const worldNormal = face.normal.clone().applyQuaternion(quaternion);
      if (worldNormal.y > maxY) {
        maxY = worldNormal.y;
        topFaceNormal = face.normal.clone();
      }
    }

    // Calculate rotation to make that face point straight up
    const targetUp = new THREE.Vector3(0, 1, 0);
    const currentUp = topFaceNormal
      .clone()
      .applyQuaternion(quaternion)
      .normalize();

    // Create quaternion that rotates currentUp to targetUp
    const correctionQuat = new THREE.Quaternion().setFromUnitVectors(
      currentUp,
      targetUp
    );

    // Apply correction to current rotation
    const finalQuat = correctionQuat.multiply(quaternion);

    // Convert back to euler and apply
    const finalEuler = new THREE.Euler().setFromQuaternion(finalQuat);
    mesh.rotation.copy(finalEuler);
  }, []);

  // Create dice texture for a face
  const createFaceTexture = useCallback(
    (faceNumber: DiceFaceNumber): THREE.CanvasTexture => {
      const size = 256;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Could not get 2D context");
      }

      // Background
      ctx.fillStyle = DICE_COLOR;
      ctx.fillRect(0, 0, size, size);

      // Dot positions for each number (scaled for 256px canvas)
      const dotPositions: Record<DiceFaceNumber, Array<[number, number]>> = {
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

      // Draw dots
      const dots = dotPositions[faceNumber];
      const dotRadius = 22;

      dots.forEach(([x, y], index) => {
        // Use red for center dot on face 1
        const isCenter = faceNumber === 1 && index === 0;
        ctx.fillStyle = isCenter ? DOT_COLOR_ONE : DOT_COLOR;
        ctx.beginPath();
        ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      });

      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      return texture;
    },
    []
  );

  // Create simple box dice with rounded corners
  const createSimpleDice = useCallback((): THREE.Mesh => {
    // RoundedBoxGeometry(width, height, depth, segments, radius)
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
  }, [createFaceTexture]);

  // Calculate visible bounds
  const calculateBounds = useCallback(
    (camera: THREE.PerspectiveCamera): Bounds => {
      const fovRad = (camera.fov * Math.PI) / 180;
      const distance = camera.position.y - FLOOR_Y;
      const visibleHeight = 2 * Math.tan(fovRad / 2) * distance;
      const visibleWidth = visibleHeight * camera.aspect;

      const padding = 1.0;
      return {
        left: -visibleWidth / 2 + padding,
        right: visibleWidth / 2 - padding,
        front: visibleHeight / 2 - padding,
        back: -visibleHeight / 2 + padding,
      };
    },
    []
  );

  // Initialize the scene
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(BACKGROUND_COLOR);
    sceneRef.current = scene;

    // Camera - top-down angled view
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 10, 6);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    boundsRef.current = calculateBounds(camera);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Ambient Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    // Main directional light (sun-like)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 15, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -15;
    directionalLight.shadow.camera.right = 15;
    directionalLight.shadow.camera.top = 15;
    directionalLight.shadow.camera.bottom = -15;
    directionalLight.shadow.bias = -0.001;
    scene.add(directionalLight);

    // Floor (invisible, just for shadows)
    const floorGeometry = new THREE.PlaneGeometry(30, 30);
    const floorMaterial = new THREE.ShadowMaterial({
      opacity: 0.15,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = FLOOR_Y;
    floor.receiveShadow = true;
    scene.add(floor);

    // Animation loop
    const animate = (): void => {
      animationRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = (): void => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
      boundsRef.current = calculateBounds(camera);
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [calculateBounds]);

  // Manage dice when count changes - only add new dice, keep existing ones
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const currentCount = diceStatesRef.current.length;

    // If we need fewer dice (only on new game), remove extras
    if (diceCount < currentCount) {
      const toRemove = diceStatesRef.current.splice(diceCount);
      toRemove.forEach((state) => {
        scene.remove(state.mesh);
        state.mesh.geometry.dispose();
        if (Array.isArray(state.mesh.material)) {
          state.mesh.material.forEach((m) => m.dispose());
        } else {
          state.mesh.material.dispose();
        }
      });
    }

    // If we need more dice, add new ones
    for (let i = currentCount; i < diceCount; i++) {
      const mesh = createSimpleDice();

      // Position dice in a spread on the table
      // For single die, center it; for multiple, spread in a circle
      let xPos: number, zPos: number;
      if (diceCount === 1) {
        xPos = 0;
        zPos = 0;
      } else {
        const angle = (i / diceCount) * Math.PI * 2;
        const radius = 1.5 + (i % 2) * 0.5;
        xPos = Math.cos(angle) * radius;
        zPos = Math.sin(angle) * radius - 1;
      }

      mesh.position.set(xPos, DICE_HALF_SIZE, zPos);

      // Give each die a random flat rotation (rotated on Y axis only so it sits flat)
      mesh.rotation.set(0, Math.random() * Math.PI * 2, 0);

      // Randomly choose which face is up
      const randomFace = Math.floor(Math.random() * 6);
      const rotations = [
        { x: 0, z: 0 }, // 1 up
        { x: Math.PI / 2, z: 0 }, // 2 up
        { x: 0, z: -Math.PI / 2 }, // 3 up
        { x: 0, z: Math.PI / 2 }, // 4 up
        { x: -Math.PI / 2, z: 0 }, // 5 up
        { x: Math.PI, z: 0 }, // 6 up
      ];
      mesh.rotation.x = rotations[randomFace].x;
      mesh.rotation.z = rotations[randomFace].z;

      scene.add(mesh);

      diceStatesRef.current.push({
        mesh,
        physics: {
          position: {
            x: mesh.position.x,
            y: mesh.position.y,
            z: mesh.position.z,
          },
          velocity: { x: 0, y: 0, z: 0 },
          rotation: {
            x: mesh.rotation.x,
            y: mesh.rotation.y,
            z: mesh.rotation.z,
          },
          angularVelocity: { x: 0, y: 0, z: 0 },
        },
        settled: true,
        settleFrames: 0,
        isSettling: false,
        targetFlatQuat: null,
      });
    }
  }, [diceCount, createSimpleDice]);

  // Dice-to-dice collision check
  const checkDiceCollision = useCallback(
    (
      pos1: Vector3D,
      pos2: Vector3D
    ): { collided: boolean; normal: Vector3D } => {
      const dx = pos2.x - pos1.x;
      const dy = pos2.y - pos1.y;
      const dz = pos2.z - pos1.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const minDist = DICE_SIZE * 1.1;

      if (dist < minDist && dist > 0) {
        return {
          collided: true,
          normal: { x: dx / dist, y: dy / dist, z: dz / dist },
        };
      }
      return { collided: false, normal: { x: 0, y: 0, z: 0 } };
    },
    []
  );

  // Roll all dice
  const rollDice = useCallback((): void => {
    if (isRollingRef.current) return;
    const scene = sceneRef.current;
    if (!scene) return;

    isRollingRef.current = true;
    setIsRolling(true);
    // Don't clear results immediately - they stay visible until dice start moving

    // Increment round at the start of the roll
    setRound((prev) => prev + 1);

    // Add new dice for this round (current dice count + 1 for the new round, max 10)
    const targetDiceCount = Math.min(diceStatesRef.current.length + 1, 10);
    const currentCount = diceStatesRef.current.length;

    // Update the diceCount state for UI display
    setDiceCount(targetDiceCount);

    // Add any needed new dice
    for (let i = currentCount; i < targetDiceCount; i++) {
      const mesh = createSimpleDice();
      // Start new dice off-screen to the left
      mesh.position.set(-10, DICE_HALF_SIZE, (Math.random() - 0.5) * 2);
      mesh.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );
      scene.add(mesh);

      diceStatesRef.current.push({
        mesh,
        physics: {
          position: {
            x: mesh.position.x,
            y: mesh.position.y,
            z: mesh.position.z,
          },
          velocity: { x: 0, y: 0, z: 0 },
          rotation: {
            x: mesh.rotation.x,
            y: mesh.rotation.y,
            z: mesh.rotation.z,
          },
          angularVelocity: { x: 0, y: 0, z: 0 },
        },
        settled: false,
        settleFrames: 0,
        isSettling: false,
        targetFlatQuat: null,
      });
    }

    const bounds = boundsRef.current;

    // Initialize physics for each dice - shoot from left to right like craps
    // Each die gets different speed/angle for varied settling times
    diceStatesRef.current.forEach((state, index) => {
      // Stagger the release - each die thrown slightly later
      const releaseOffset = index * 0.8;

      // Always start from the left side for consistent left-to-right throw
      const startX = bounds.left - DICE_SIZE * 2 - releaseOffset;
      const startY = FLOOR_Y + DICE_HALF_SIZE + 0.2 + Math.random() * 0.6;
      const startZ = (Math.random() - 0.5) * 2 + index * 0.3;

      // Throw direction: varied speeds so dice settle at different times
      const baseSpeed = 1920 + index * 60; // Each die slightly different base speed (4x faster)
      const throwSpeed = baseSpeed + Math.random() * 240; // Add randomness
      const upwardSpeed = 0.3 + Math.random() * 0.5; // Keep dice low - minimal arc
      const depthVariation = (Math.random() - 0.5) * 3; // Spread in Z

      state.physics = {
        position: {
          x: startX,
          y: startY,
          z: startZ,
        },
        velocity: {
          x: throwSpeed, // Shoot to the right
          y: upwardSpeed, // Slight upward arc
          z: depthVariation, // Slight depth variation
        },
        rotation: {
          x: state.mesh ? state.mesh.rotation.x : Math.random() * Math.PI * 2,
          y: state.mesh ? state.mesh.rotation.y : Math.random() * Math.PI * 2,
          z: state.mesh ? state.mesh.rotation.z : Math.random() * Math.PI * 2,
        },
        angularVelocity: {
          x: (Math.random() - 0.5) * 40 + index * 3,
          y: (Math.random() - 0.5) * 40,
          z: (Math.random() - 0.5) * 40 - index * 2,
        },
      };
      state.settled = false;
      state.settleFrames = 0;
      state.isSettling = false;
      state.targetFlatQuat = null;
    });

    let lastTime = performance.now();

    const simulatePhysics = (currentTime: number): void => {
      const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.033);
      lastTime = currentTime;

      let allSettled = true;

      diceStatesRef.current.forEach((state) => {
        if (state.settled) return;

        const physics = state.physics;

        // Apply gravity
        physics.velocity.y += GRAVITY * deltaTime;

        // Update position
        physics.position.x += physics.velocity.x * deltaTime;
        physics.position.y += physics.velocity.y * deltaTime;
        physics.position.z += physics.velocity.z * deltaTime;

        // Update rotation
        physics.rotation.x += physics.angularVelocity.x * deltaTime;
        physics.rotation.y += physics.angularVelocity.y * deltaTime;
        physics.rotation.z += physics.angularVelocity.z * deltaTime;

        // Floor collision - realistic rolling physics
        if (physics.position.y < FLOOR_Y + DICE_HALF_SIZE) {
          physics.position.y = FLOOR_Y + DICE_HALF_SIZE;

          // Only transfer momentum on bounce (when coming down with significant speed)
          if (physics.velocity.y < -0.5) {
            // Impact creates tumble based on horizontal velocity at moment of impact
            const impactStrength = Math.min(
              Math.abs(physics.velocity.y) / 10,
              1
            );
            physics.angularVelocity.z -=
              physics.velocity.x * 0.15 * impactStrength;
            physics.angularVelocity.x +=
              physics.velocity.z * 0.15 * impactStrength;
          }

          physics.velocity.y = -physics.velocity.y * RESTITUTION;

          // Apply friction only when on ground
          physics.velocity.x *= FRICTION;
          physics.velocity.z *= FRICTION;
          physics.angularVelocity.x *= ANGULAR_FRICTION;
          physics.angularVelocity.y *= ANGULAR_FRICTION;
          physics.angularVelocity.z *= ANGULAR_FRICTION;
        }

        // Boundary collisions - realistic tumbling on impact
        if (physics.position.x < bounds.left + DICE_HALF_SIZE) {
          physics.position.x = bounds.left + DICE_HALF_SIZE;
          const impactSpeed = Math.abs(physics.velocity.x);
          // Add tumble proportional to impact, dampen existing spin
          physics.angularVelocity.z -= impactSpeed * 0.1;
          physics.velocity.x = -physics.velocity.x * RESTITUTION;
          physics.angularVelocity.x *= 0.8;
          physics.angularVelocity.y *= 0.8;
          physics.angularVelocity.z *= 0.8;
        }
        if (physics.position.x > bounds.right - DICE_HALF_SIZE) {
          physics.position.x = bounds.right - DICE_HALF_SIZE;
          const impactSpeed = Math.abs(physics.velocity.x);
          // Add tumble proportional to impact, dampen existing spin
          physics.angularVelocity.z += impactSpeed * 0.1;
          physics.velocity.x = -physics.velocity.x * RESTITUTION;
          physics.angularVelocity.x *= 0.8;
          physics.angularVelocity.y *= 0.8;
          physics.angularVelocity.z *= 0.8;
        }
        if (physics.position.z < bounds.back + DICE_HALF_SIZE) {
          physics.position.z = bounds.back + DICE_HALF_SIZE;
          const impactSpeed = Math.abs(physics.velocity.z);
          physics.angularVelocity.x += impactSpeed * 0.1;
          physics.velocity.z = -physics.velocity.z * RESTITUTION;
          physics.angularVelocity.x *= 0.8;
          physics.angularVelocity.y *= 0.8;
          physics.angularVelocity.z *= 0.8;
        }
        if (physics.position.z > bounds.front - DICE_HALF_SIZE) {
          physics.position.z = bounds.front - DICE_HALF_SIZE;
          const impactSpeed = Math.abs(physics.velocity.z);
          physics.angularVelocity.x -= impactSpeed * 0.1;
          physics.velocity.z = -physics.velocity.z * RESTITUTION;
          physics.angularVelocity.x *= 0.8;
          physics.angularVelocity.y *= 0.8;
          physics.angularVelocity.z *= 0.8;
        }

        // Update mesh
        state.mesh.position.set(
          physics.position.x,
          physics.position.y,
          physics.position.z
        );
        state.mesh.rotation.set(
          physics.rotation.x,
          physics.rotation.y,
          physics.rotation.z
        );

        // Check current momentum
        const velMag = Math.sqrt(
          physics.velocity.x ** 2 +
            physics.velocity.y ** 2 +
            physics.velocity.z ** 2
        );
        const angMag = Math.sqrt(
          physics.angularVelocity.x ** 2 +
            physics.angularVelocity.y ** 2 +
            physics.angularVelocity.z ** 2
        );

        // When dice is on the floor, apply physics-based settling
        const isOnFloor = physics.position.y < FLOOR_Y + DICE_HALF_SIZE + 0.05;

        if (isOnFloor && !state.settled) {
          // Get current rotation as quaternion
          const currentQuat = new THREE.Quaternion().setFromEuler(
            new THREE.Euler(
              physics.rotation.x,
              physics.rotation.y,
              physics.rotation.z
            )
          );

          // Find which face is most upward
          let maxY = -Infinity;
          let topFaceNormal: THREE.Vector3 = new THREE.Vector3(0, 1, 0);

          for (const face of FACE_NORMALS) {
            const worldNormal = face.normal
              .clone()
              .applyQuaternion(currentQuat);
            if (worldNormal.y > maxY) {
              maxY = worldNormal.y;
              topFaceNormal = face.normal.clone();
            }
          }

          // Calculate how tilted the die is (1 = flat, 0 = on edge)
          const currentUp = topFaceNormal
            .clone()
            .applyQuaternion(currentQuat)
            .normalize();
          const tiltAmount = 1 - currentUp.y; // 0 when flat, approaches 1 when tilted

          // Calculate target flat quaternion
          const worldUp = new THREE.Vector3(0, 1, 0);
          const correctionQuat = new THREE.Quaternion().setFromUnitVectors(
            currentUp,
            worldUp
          );
          const targetQuat = correctionQuat.clone().multiply(currentQuat);

          // Blend toward flat based on how slow the die is moving
          // Faster dice keep their momentum, slower dice settle faster
          const speedFactor = Math.max(0, 1 - (velMag + angMag * 0.5) * 2);
          const settleRate = 0.02 + speedFactor * 0.08; // 0.02 when fast, up to 0.10 when slow

          // Slerp rotation toward flat
          const newQuat = currentQuat.clone().slerp(targetQuat, settleRate);
          const newEuler = new THREE.Euler().setFromQuaternion(newQuat);
          physics.rotation.x = newEuler.x;
          physics.rotation.y = newEuler.y;
          physics.rotation.z = newEuler.z;

          // Apply friction - stronger when nearly flat to help settle
          const nearFlat = tiltAmount < 0.15;
          const frictionMultiplier = nearFlat ? 0.9 : 0.95;
          physics.velocity.x *= frictionMultiplier;
          physics.velocity.z *= frictionMultiplier;
          physics.angularVelocity.x *= frictionMultiplier;
          physics.angularVelocity.y *= frictionMultiplier;
          physics.angularVelocity.z *= frictionMultiplier;

          // Check if die has naturally come to rest
          const isFlat = tiltAmount < 0.015;
          const isStationary = velMag < 0.12 && angMag < 0.2;

          // Also add a frame counter fallback - if dice has been on floor too long, force settle
          state.settleFrames++;
          const forceSettle = state.settleFrames > 180 && tiltAmount < 0.15;

          if ((isFlat && isStationary) || forceSettle) {
            state.settled = true;
            // Don't snap - the dice is already close enough to flat
            // Just lock the position
            state.mesh.position.y = FLOOR_Y + DICE_HALF_SIZE;

            // Zero out all velocity
            physics.velocity.x = 0;
            physics.velocity.y = 0;
            physics.velocity.z = 0;
            physics.angularVelocity.x = 0;
            physics.angularVelocity.y = 0;
            physics.angularVelocity.z = 0;

            // Update results incrementally as each die settles
            const currentResults = diceStatesRef.current.map((s) =>
              s.settled ? getTopFace(s.mesh) : null
            );
            setResults(
              currentResults.filter((r): r is DiceFaceNumber => r !== null)
            );
          } else {
            allSettled = false;
          }
        } else if (!state.settled) {
          allSettled = false;
        }
      });

      // Dice-to-dice collisions - run multiple iterations to prevent sticking
      for (let iteration = 0; iteration < 3; iteration++) {
        for (let i = 0; i < diceStatesRef.current.length; i++) {
          for (let j = i + 1; j < diceStatesRef.current.length; j++) {
            const state1 = diceStatesRef.current[i];
            const state2 = diceStatesRef.current[j];

            if (state1.settled && state2.settled) continue;

            const dx = state2.physics.position.x - state1.physics.position.x;
            const dy = state2.physics.position.y - state1.physics.position.y;
            const dz = state2.physics.position.z - state1.physics.position.z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            const minDist = DICE_SIZE * 1.15; // Slightly larger collision radius

            if (dist < minDist && dist > 0.001) {
              const normal = { x: dx / dist, y: dy / dist, z: dz / dist };
              const overlap = minDist - dist;

              // Separate dice more aggressively
              const separationForce = overlap * 0.6;
              if (!state1.settled) {
                state1.physics.position.x -= normal.x * separationForce;
                state1.physics.position.y -= normal.y * separationForce;
                state1.physics.position.z -= normal.z * separationForce;
              }
              if (!state2.settled) {
                state2.physics.position.x += normal.x * separationForce;
                state2.physics.position.y += normal.y * separationForce;
                state2.physics.position.z += normal.z * separationForce;
              }

              // Bounce velocities with minimum separation speed
              const relVel = {
                x: state1.physics.velocity.x - state2.physics.velocity.x,
                y: state1.physics.velocity.y - state2.physics.velocity.y,
                z: state1.physics.velocity.z - state2.physics.velocity.z,
              };
              const dotProduct =
                relVel.x * normal.x + relVel.y * normal.y + relVel.z * normal.z;

              // Apply impulse even if moving apart slowly, to push them away
              const minSeparationSpeed = 2;
              const impulse = Math.max(dotProduct * 0.8, minSeparationSpeed);

              if (!state1.settled) {
                state1.physics.velocity.x -= impulse * normal.x;
                state1.physics.velocity.y -= impulse * normal.y;
                state1.physics.velocity.z -= impulse * normal.z;
              }
              if (!state2.settled) {
                state2.physics.velocity.x += impulse * normal.x;
                state2.physics.velocity.y += impulse * normal.y;
                state2.physics.velocity.z += impulse * normal.z;
              }
            }
          }
        }
      }

      if (allSettled) {
        // Read the actual face values from each dice
        const diceResults = diceStatesRef.current.map((state) =>
          getTopFace(state.mesh)
        );
        setResults(diceResults);

        // Calculate roll total
        const rollTotal = diceResults.reduce((sum, val) => sum + val, 0);
        setLastRollTotal(rollTotal);

        // Check if divisible by 7 (game over)
        if (rollTotal % 7 === 0) {
          setGameOver(true);
        } else {
          // Add to score - round already incremented at roll start
          setTotalScore((prev) => prev + rollTotal);
        }

        isRollingRef.current = false;
        setIsRolling(false);
      } else {
        requestAnimationFrame(simulatePhysics);
      }
    };

    requestAnimationFrame(simulatePhysics);
  }, [checkDiceCollision, getTopFace, snapToFlat, createSimpleDice]);

  const startGame = (): void => {
    // Start the game from title screen
    setGameStarted(true);
    setTotalScore(0);
    setRound(0); // Start at 0, first roll will increment to 1
    setGameOver(false);
    setResults([]);
    setLastRollTotal(0);

    // Clear all existing decorative dice first
    const scene = sceneRef.current;
    if (scene) {
      diceStatesRef.current.forEach((state) => {
        scene.remove(state.mesh);
        state.mesh.geometry.dispose();
        if (Array.isArray(state.mesh.material)) {
          state.mesh.material.forEach((m) => m.dispose());
        } else {
          state.mesh.material.dispose();
        }
      });
      diceStatesRef.current = [];
    }
    // Dice will be added when user clicks Roll
  };

  const startNewGame = (): void => {
    // Reset and restart after game over
    setTotalScore(0);
    setRound(0); // Start at 0, first roll will increment to 1
    setGameOver(false);
    setResults([]);
    setLastRollTotal(0);

    // Clear all existing dice first
    const scene = sceneRef.current;
    if (scene) {
      diceStatesRef.current.forEach((state) => {
        scene.remove(state.mesh);
        state.mesh.geometry.dispose();
        if (Array.isArray(state.mesh.material)) {
          state.mesh.material.forEach((m) => m.dispose());
        } else {
          state.mesh.material.dispose();
        }
      });
      diceStatesRef.current = [];
    }
    // Dice will be added when user clicks Roll
  };

  return (
    <div
      className="relative w-full h-screen overflow-hidden"
      style={{ backgroundColor: "#f0e68c" }}
    >
      {/* Title */}
      <div className="absolute top-4 left-4 z-10">
        <h1
          className="text-3xl font-black tracking-tight"
          style={{ color: "#4a4a2a" }}
        >
          GOD
          <br />
          ROLL
        </h1>
      </div>

      {/* Game Stats - only show when game started */}
      {gameStarted && (
        <div className="absolute top-4 right-4 z-10 text-right">
          <div className="text-2xl font-bold" style={{ color: "#4a4a2a" }}>
            SCORE: {totalScore}
          </div>
          <div className="text-lg" style={{ color: "#6a6a4a" }}>
            Round {round}
          </div>
          <button
            onMouseDown={() => {
              let progress = 0;
              const startTime = Date.now();
              const holdDuration = 1000; // 1 second hold
              const tick = () => {
                const elapsed = Date.now() - startTime;
                progress = Math.min(elapsed / holdDuration, 1);
                setResetProgress(progress);
                if (progress >= 1) {
                  startNewGame();
                  setResetProgress(0);
                } else {
                  resetTimerRef.current = requestAnimationFrame(tick);
                }
              };
              resetTimerRef.current = requestAnimationFrame(tick);
            }}
            onMouseUp={() => {
              if (resetTimerRef.current) {
                cancelAnimationFrame(resetTimerRef.current);
                resetTimerRef.current = null;
              }
              setResetProgress(0);
            }}
            onMouseLeave={() => {
              if (resetTimerRef.current) {
                cancelAnimationFrame(resetTimerRef.current);
                resetTimerRef.current = null;
              }
              setResetProgress(0);
            }}
            className="mt-2 text-sm font-bold px-4 py-1 rounded-full transition-all relative overflow-hidden"
            style={{ backgroundColor: "#4a4a2a", color: "#f0e68c" }}
          >
            <span
              className="absolute inset-0 bg-red-500 transition-none"
              style={{
                width: `${resetProgress * 100}%`,
                opacity: 0.6,
              }}
            />
            <span className="relative">
              {resetProgress > 0 ? "HOLD..." : "RESET"}
            </span>
          </button>
        </div>
      )}

      {/* Three.js Canvas */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Start Screen Overlay */}
      {!gameStarted && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="text-center">
            <h2
              className="text-6xl font-black mb-4"
              style={{ color: "#4a4a2a" }}
            >
              GOD ROLL
            </h2>
            <p className="text-xl mb-2" style={{ color: "#6a6a4a" }}>
              Roll dice to score points
            </p>
            <p className="text-lg mb-6" style={{ color: "#8a8a6a" }}>
              Avoid totals divisible by 7!
            </p>
            <button
              onClick={startGame}
              className="text-3xl font-black px-10 py-4 rounded-full transition-all hover:scale-105 active:scale-95"
              style={{ backgroundColor: "#4a4a2a", color: "#f0e68c" }}
            >
              START GAME
            </button>
            <p className="text-sm mt-4" style={{ color: "#aaa" }}>
              Dice increase each round
            </p>
          </div>
        </div>
      )}

      {/* Game Over Overlay */}
      {gameOver && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/50">
          <div className="bg-white/95 rounded-2xl p-8 text-center shadow-2xl">
            <h2 className="text-4xl font-black mb-2" style={{ color: "#c44" }}>
              GAME OVER!
            </h2>
            <p className="text-xl mb-1" style={{ color: "#4a4a2a" }}>
              You rolled {lastRollTotal} (divisible by 7)
            </p>
            <p className="text-2xl font-bold mb-4" style={{ color: "#4a4a2a" }}>
              Final Score: {totalScore}
            </p>
            <p className="text-lg mb-4" style={{ color: "#6a6a4a" }}>
              You survived {round - 1} round{round - 1 !== 1 ? "s" : ""}!
            </p>
            <button
              onClick={startNewGame}
              className="text-2xl font-black px-8 py-3 rounded-full transition-all hover:scale-105 active:scale-95"
              style={{ backgroundColor: "#4a4a2a", color: "#f0e68c" }}
            >
              PLAY AGAIN
            </button>
          </div>
        </div>
      )}

      {/* Controls - only show when game started and not game over */}
      {gameStarted && !gameOver && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2">
          {/* Show results */}
          {results.length > 0 && !isRolling && (
            <div className="flex flex-col items-center gap-1 mb-2">
              <span
                className="text-lg font-bold tracking-wide"
                style={{ color: "#5a4a3a" }}
              >
                ROLL: {lastRollTotal} {lastRollTotal % 7 === 0 ? "💀" : "✓"}
              </span>
              <span
                className="text-sm tracking-wider"
                style={{ color: "#8a8a6a" }}
              >
                [{results.join(" + ")}]
              </span>
            </div>
          )}
          <button
            onClick={rollDice}
            disabled={isRolling}
            className="text-4xl font-black tracking-wider px-8 py-2 rounded-full transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            style={{ color: "#5a4a3a" }}
          >
            ROLL
          </button>
        </div>
      )}
    </div>
  );
}

export default DiceRoller;
