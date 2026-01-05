import { useCallback, useEffect, useRef } from "react";
import * as THREE from "three";
import { COLORS, DEFAULT_BOUNDS, FLOOR_Y } from "../constants";
import { Bounds } from "../types";

interface UseThreeSceneReturn {
  containerRef: React.RefObject<HTMLDivElement | null>;
  sceneRef: React.RefObject<THREE.Scene | null>;
  cameraRef: React.RefObject<THREE.PerspectiveCamera | null>;
  rendererRef: React.RefObject<THREE.WebGLRenderer | null>;
  boundsRef: React.RefObject<Bounds>;
}

export function useThreeScene(): UseThreeSceneReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationRef = useRef<number | null>(null);
  const boundsRef = useRef<Bounds>(DEFAULT_BOUNDS);

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

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(COLORS.background);
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

  return {
    containerRef,
    sceneRef,
    cameraRef,
    rendererRef,
    boundsRef,
  };
}
