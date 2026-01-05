import { useCallback, useEffect, useRef } from "react";
import * as THREE from "three";
import { COLORS, DEFAULT_BOUNDS, FLOOR_Y } from "../constants";
import { Bounds } from "../types";

// Get camera settings based on screen size AND dice count
function getCameraSettings(
  width: number,
  height: number,
  diceCount: number
): { y: number; z: number; fov: number } {
  const isPortrait = height > width;
  const isSmallScreen = Math.min(width, height) < 500;

  // Base settings per device type
  let baseY: number, baseZ: number, baseFov: number;
  let zoomPerDie: number;

  if (isPortrait) {
    // Mobile portrait - start closer, zoom out more aggressively
    baseY = 12;
    baseZ = 8;
    baseFov = 55;
    zoomPerDie = 2.5; // Zoom out more per die on portrait
  } else if (isSmallScreen || width < 768) {
    // Mobile landscape
    baseY = 10;
    baseZ = 6;
    baseFov = 50;
    zoomPerDie = 1.5;
  } else {
    // Desktop
    baseY = 10;
    baseZ = 6;
    baseFov = 45;
    zoomPerDie = 1.0;
  }

  // Progressive zoom out as dice are added (starting from dice 1)
  const extraZoom = Math.max(0, diceCount - 1) * zoomPerDie;

  return {
    y: baseY + extraZoom,
    z: baseZ + extraZoom * 0.6,
    fov: Math.min(baseFov + extraZoom * 1.5, 85), // Cap FOV at 85
  };
}

interface UseThreeSceneReturn {
  containerRef: React.RefObject<HTMLDivElement | null>;
  sceneRef: React.RefObject<THREE.Scene | null>;
  cameraRef: React.RefObject<THREE.PerspectiveCamera | null>;
  rendererRef: React.RefObject<THREE.WebGLRenderer | null>;
  boundsRef: React.RefObject<Bounds>;
  adjustCameraForDiceCount: (diceCount: number) => void;
}

export function useThreeScene(): UseThreeSceneReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationRef = useRef<number | null>(null);
  const boundsRef = useRef<Bounds>(DEFAULT_BOUNDS);
  const currentDiceCountRef = useRef<number>(1);

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

  // Function to adjust camera when dice count changes
  const adjustCameraForDiceCount = useCallback(
    (diceCount: number) => {
      const camera = cameraRef.current;
      const container = containerRef.current;
      if (!camera || !container) return;

      currentDiceCountRef.current = diceCount;
      const width = container.clientWidth;
      const height = container.clientHeight;
      const settings = getCameraSettings(width, height, diceCount);

      camera.fov = settings.fov;
      camera.position.set(0, settings.y, settings.z);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      boundsRef.current = calculateBounds(camera);
    },
    [calculateBounds]
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(COLORS.background);
    sceneRef.current = scene;

    // Camera - start with settings for 1 die
    const cameraSettings = getCameraSettings(width, height, 1);
    const camera = new THREE.PerspectiveCamera(
      cameraSettings.fov,
      width / height,
      0.1,
      1000
    );
    camera.position.set(0, cameraSettings.y, cameraSettings.z);
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

    // Handle resize - also update camera settings for orientation changes
    const handleResize = (): void => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      const newSettings = getCameraSettings(
        newWidth,
        newHeight,
        currentDiceCountRef.current
      );

      camera.fov = newSettings.fov;
      camera.position.set(0, newSettings.y, newSettings.z);
      camera.lookAt(0, 0, 0);
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

  return {
    containerRef,
    sceneRef,
    cameraRef,
    rendererRef,
    boundsRef,
    adjustCameraForDiceCount,
  };
}
