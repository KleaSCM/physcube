"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export default function PhysCube() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [wasmModule, setWasmModule] = useState<any | null>(null);

  // Load WebAssembly Module 
  useEffect(() => {
    async function loadWasm() {
      try {
        // Fixes WASI issue
        const wasmModule = await import("/physics.mjs");
        const instance = await wasmModule.default();
        setWasmModule(instance);
      } catch (error) {
        console.error("🚨 Failed to load WASM module:", error);
      }
    }
    loadWasm();
  }, []);

  useEffect(() => {
    if (!wasmModule || !mountRef.current) return;

    const initObject = wasmModule._init_object as CallableFunction;
    const updatePhysics = wasmModule._update_physics as CallableFunction;
    const getObjectPosition = wasmModule._get_object_position as CallableFunction;

    // object tart Position
    initObject(0, 2, 0, 0, 0, 0, 1);

    // Three.js Scene
    const scene = new THREE.Scene();

    // 🎥 setup
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(5, 5, 10);
    camera.lookAt(0, 0, 0);

    // WebGL Renderer setup
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current?.appendChild(renderer.domElement);

    // 🧊 Create Wireframe Cube
    const cubeGeometry = new THREE.BoxGeometry(5, 5, 5);
    const cubeMaterial = new THREE.LineBasicMaterial({ color: 0x0077ff });
    const cubeEdges = new THREE.EdgesGeometry(cubeGeometry);
    const cubeWireframe = new THREE.LineSegments(cubeEdges, cubeMaterial);
    scene.add(cubeWireframe);

    //Create Sphere
    const objectGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const objectMaterial = new THREE.MeshBasicMaterial({ color: 0xff6699 });
    const physicsObject = new THREE.Mesh(objectGeometry, objectMaterial);
    scene.add(physicsObject);

    // 🔄 Animation Loop
    const animate = () => {
      updatePhysics(); // Call physics update function in WASM

      //Retrieve updated position from WASM
      const positionPtr = getObjectPosition();
      if (positionPtr) {
        const position = new Float64Array(wasmModule.HEAPF64.buffer, positionPtr, 3);
        physicsObject.position.set(position[0], position[1], position[2]);
      }

      // 🔄 Rotate Cube 3D Effect
      cubeWireframe.rotation.x += 0.005;
      cubeWireframe.rotation.y += 0.005;

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate();

    // Window Resizing
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    //Cleanup on Unmount
    return () => {
      window.removeEventListener("resize", handleResize);
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, [wasmModule]);

  return <div ref={mountRef} style={{ width: "100vw", height: "100vh", background: "black" }} />;
}
