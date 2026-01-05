import { useCallback, useRef } from "react";
import * as THREE from "three";
import {
  ANGULAR_FRICTION,
  CEILING_Y,
  DICE_HALF_SIZE,
  DICE_SIZE,
  FACE_NORMALS,
  FLOOR_Y,
  FRICTION,
  GRAVITY,
  RESTITUTION,
} from "../constants";
import { Bounds, DiceFaceNumber, DiceState } from "../types";
import { createDiceMesh, disposeDiceMesh } from "../utils/diceTextures";
import { secureRandom } from "../utils/secureRandom";

interface UseDicePhysicsProps {
  sceneRef: React.RefObject<THREE.Scene | null>;
  boundsRef: React.RefObject<Bounds>;
  onRollComplete: (rollTotal: number, results: DiceFaceNumber[]) => void;
  onResultsUpdate: (results: DiceFaceNumber[]) => void;
  onDiceCountChange?: (diceCount: number) => void;
}

interface UseDicePhysicsReturn {
  diceStatesRef: React.RefObject<DiceState[]>;
  isRollingRef: React.RefObject<boolean>;
  rollDice: () => void;
  clearAllDice: () => void;
  getTopFace: (mesh: THREE.Mesh) => DiceFaceNumber;
}

export function useDicePhysics({
  sceneRef,
  boundsRef,
  onRollComplete,
  onResultsUpdate,
  onDiceCountChange,
}: UseDicePhysicsProps): UseDicePhysicsReturn {
  const diceStatesRef = useRef<DiceState[]>([]);
  const isRollingRef = useRef<boolean>(false);

  const getTopFace = useCallback((mesh: THREE.Mesh): DiceFaceNumber => {
    const euler = mesh.rotation;
    const quaternion = new THREE.Quaternion().setFromEuler(euler);

    let maxY = -Infinity;
    let topFace: DiceFaceNumber = 1;

    for (const face of FACE_NORMALS) {
      const worldNormal = face.normal.clone().applyQuaternion(quaternion);
      if (worldNormal.y > maxY) {
        maxY = worldNormal.y;
        topFace = face.value;
      }
    }

    return topFace;
  }, []);

  const clearAllDice = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    diceStatesRef.current.forEach((state) => {
      scene.remove(state.mesh);
      disposeDiceMesh(state.mesh);
    });
    diceStatesRef.current = [];
  }, [sceneRef]);

  const rollDice = useCallback(() => {
    if (isRollingRef.current) return;
    const scene = sceneRef.current;
    if (!scene) return;

    isRollingRef.current = true;

    // Add new dice for this round (current dice count + 1 for the new round)
    const targetDiceCount = diceStatesRef.current.length + 1;
    const currentCount = diceStatesRef.current.length;

    // Notify camera to zoom out for new dice count
    if (onDiceCountChange) {
      onDiceCountChange(targetDiceCount);
    }

    // Add any needed new dice
    for (let i = currentCount; i < targetDiceCount; i++) {
      const mesh = createDiceMesh();
      mesh.position.set(-10, DICE_HALF_SIZE, (secureRandom() - 0.5) * 2);
      mesh.rotation.set(
        secureRandom() * Math.PI * 2,
        secureRandom() * Math.PI * 2,
        secureRandom() * Math.PI * 2
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

    // Detect portrait mode for throw direction
    const isPortrait = window.innerHeight > window.innerWidth;

    // Initialize physics for each dice
    diceStatesRef.current.forEach((state, index) => {
      const releaseOffset = index * 0.8;

      let startX: number, startY: number, startZ: number;
      let velocityX: number, velocityZ: number;

      if (isPortrait) {
        // Mobile portrait: throw from bottom (front) toward back
        startX = (secureRandom() - 0.5) * 2 + index * 0.3;
        startY = FLOOR_Y + DICE_HALF_SIZE + 0.2 + secureRandom() * 0.6;
        startZ = bounds.front + DICE_SIZE * 2 + releaseOffset;

        const baseSpeed = 3600 + index * 60;
        const throwSpeed = baseSpeed + secureRandom() * 240;
        velocityX = (secureRandom() - 0.5) * 3; // side variation
        velocityZ = -throwSpeed; // throw toward back (negative Z)
      } else {
        // Desktop/landscape: throw from left toward right
        startX = bounds.left - DICE_SIZE * 2 - releaseOffset;
        startY = FLOOR_Y + DICE_HALF_SIZE + 0.2 + secureRandom() * 0.6;
        startZ = (secureRandom() - 0.5) * 2 + index * 0.3;

        const baseSpeed = 3600 + index * 60;
        const throwSpeed = baseSpeed + secureRandom() * 240;
        velocityX = throwSpeed;
        velocityZ = (secureRandom() - 0.5) * 3; // depth variation
      }

      const upwardSpeed = 0.7 + secureRandom() * 0.5;

      state.physics = {
        position: { x: startX, y: startY, z: startZ },
        velocity: { x: velocityX, y: upwardSpeed, z: velocityZ },
        rotation: {
          x: state.mesh.rotation.x,
          y: state.mesh.rotation.y,
          z: state.mesh.rotation.z,
        },
        angularVelocity: {
          x: (secureRandom() - 0.5) * 40 + index * 3,
          y: (secureRandom() - 0.5) * 40,
          z: (secureRandom() - 0.5) * 40 - index * 2,
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

        // Floor collision
        if (physics.position.y < FLOOR_Y + DICE_HALF_SIZE) {
          physics.position.y = FLOOR_Y + DICE_HALF_SIZE;

          if (physics.velocity.y < -0.5) {
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
          physics.velocity.x *= FRICTION;
          physics.velocity.z *= FRICTION;
          physics.angularVelocity.x *= ANGULAR_FRICTION;
          physics.angularVelocity.y *= ANGULAR_FRICTION;
          physics.angularVelocity.z *= ANGULAR_FRICTION;
        }

        // Ceiling collision
        if (physics.position.y > CEILING_Y - DICE_HALF_SIZE) {
          physics.position.y = CEILING_Y - DICE_HALF_SIZE;
          physics.velocity.y = -Math.abs(physics.velocity.y) * 0.3;
        }

        // Wall collisions
        if (physics.position.x < bounds.left + DICE_HALF_SIZE) {
          physics.position.x = bounds.left + DICE_HALF_SIZE;
          const impactSpeed = Math.abs(physics.velocity.x);
          physics.angularVelocity.z -= impactSpeed * 0.1;
          physics.velocity.x = -physics.velocity.x * RESTITUTION;
          physics.angularVelocity.x *= 0.8;
          physics.angularVelocity.y *= 0.8;
          physics.angularVelocity.z *= 0.8;
        }
        if (physics.position.x > bounds.right - DICE_HALF_SIZE) {
          physics.position.x = bounds.right - DICE_HALF_SIZE;
          const impactSpeed = Math.abs(physics.velocity.x);
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

        // Check momentum
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

        const isOnFloor = physics.position.y < FLOOR_Y + DICE_HALF_SIZE + 0.05;

        if (isOnFloor && !state.settled) {
          const currentQuat = new THREE.Quaternion().setFromEuler(
            new THREE.Euler(
              physics.rotation.x,
              physics.rotation.y,
              physics.rotation.z
            )
          );

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

          const currentUp = topFaceNormal
            .clone()
            .applyQuaternion(currentQuat)
            .normalize();
          const tiltAmount = 1 - currentUp.y;

          const worldUp = new THREE.Vector3(0, 1, 0);
          const correctionQuat = new THREE.Quaternion().setFromUnitVectors(
            currentUp,
            worldUp
          );
          const targetQuat = correctionQuat.clone().multiply(currentQuat);

          const speedFactor = Math.max(0, 1 - (velMag + angMag * 0.5) * 2);
          const settleRate = 0.05 + speedFactor * 0.15;

          const newQuat = currentQuat.clone().slerp(targetQuat, settleRate);
          const newEuler = new THREE.Euler().setFromQuaternion(newQuat);
          physics.rotation.x = newEuler.x;
          physics.rotation.y = newEuler.y;
          physics.rotation.z = newEuler.z;

          const nearFlat = tiltAmount < 0.15;
          const frictionMultiplier = nearFlat ? 0.85 : 0.92;
          physics.velocity.x *= frictionMultiplier;
          physics.velocity.z *= frictionMultiplier;
          physics.angularVelocity.x *= frictionMultiplier;
          physics.angularVelocity.y *= frictionMultiplier;
          physics.angularVelocity.z *= frictionMultiplier;

          const isFlat = tiltAmount < 0.03;
          const isStationary = velMag < 0.2 && angMag < 0.4;

          state.settleFrames++;
          const forceSettle = state.settleFrames > 90 && tiltAmount < 0.2;

          if ((isFlat && isStationary) || forceSettle) {
            state.settled = true;
            state.mesh.position.y = FLOOR_Y + DICE_HALF_SIZE;

            physics.velocity.x = 0;
            physics.velocity.y = 0;
            physics.velocity.z = 0;
            physics.angularVelocity.x = 0;
            physics.angularVelocity.y = 0;
            physics.angularVelocity.z = 0;

            const currentResults = diceStatesRef.current.map((s) =>
              s.settled ? getTopFace(s.mesh) : null
            );
            onResultsUpdate(
              currentResults.filter((r): r is DiceFaceNumber => r !== null)
            );
          } else {
            allSettled = false;
          }
        } else if (!state.settled) {
          allSettled = false;
        }
      });

      // Dice-to-dice collisions
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
            const minDist = DICE_SIZE * 1.15;

            if (dist < minDist && dist > 0.001) {
              const normal = { x: dx / dist, y: dy / dist, z: dz / dist };
              const overlap = minDist - dist;

              const separationForce = overlap * 0.6;
              if (!state1.settled) {
                state1.physics.position.x -= normal.x * separationForce;
                state1.physics.position.y -= normal.y * separationForce * 0.3;
                state1.physics.position.z -= normal.z * separationForce;
              }
              if (!state2.settled) {
                state2.physics.position.x += normal.x * separationForce;
                state2.physics.position.y += normal.y * separationForce * 0.3;
                state2.physics.position.z += normal.z * separationForce;
              }

              const relVel = {
                x: state1.physics.velocity.x - state2.physics.velocity.x,
                y: state1.physics.velocity.y - state2.physics.velocity.y,
                z: state1.physics.velocity.z - state2.physics.velocity.z,
              };
              const dotProduct =
                relVel.x * normal.x + relVel.y * normal.y + relVel.z * normal.z;

              const minSeparationSpeed = 2;
              const impulse = Math.max(dotProduct * 0.8, minSeparationSpeed);
              const verticalDamping = 0.2;

              if (!state1.settled) {
                state1.physics.velocity.x -= impulse * normal.x;
                state1.physics.velocity.y -=
                  impulse * normal.y * verticalDamping;
                state1.physics.velocity.z -= impulse * normal.z;
              }
              if (!state2.settled) {
                state2.physics.velocity.x += impulse * normal.x;
                state2.physics.velocity.y +=
                  impulse * normal.y * verticalDamping;
                state2.physics.velocity.z += impulse * normal.z;
              }
            }
          }
        }
      }

      if (allSettled) {
        const diceResults = diceStatesRef.current.map((state) =>
          getTopFace(state.mesh)
        );
        const rollTotal = diceResults.reduce((sum, val) => sum + val, 0);

        isRollingRef.current = false;
        onRollComplete(rollTotal, diceResults);
      } else {
        requestAnimationFrame(simulatePhysics);
      }
    };

    requestAnimationFrame(simulatePhysics);
  }, [
    sceneRef,
    boundsRef,
    getTopFace,
    onRollComplete,
    onResultsUpdate,
    onDiceCountChange,
  ]);

  return {
    diceStatesRef,
    isRollingRef,
    rollDice,
    clearAllDice,
    getTopFace,
  };
}
