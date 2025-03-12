"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export default function PhysCube() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [wasmModule, setWasmModule] = useState<WebAssembly.Instance | null>(null);
  const [wasmMemory, setWasmMemory] = useState<ArrayBuffer | null>(null);

  let cubeRotationX = 0;
  let cubeRotationY = 0;

  useEffect(() => {
    async function loadWasm() {
      try {
        const response = await fetch("/physics.wasm");
        const bytes = await response.arrayBuffer();
        const { instance } = await WebAssembly.instantiate(bytes, { env: {} });

        setWasmModule(instance);
        setWasmMemory((instance.exports.memory as WebAssembly.Memory).buffer);
      } catch (error) {
        console.error("❌ Failed to load WASM module:", error);
      }
    }

    loadWasm();
  }, []);

  useEffect(() => {
    if (!wasmModule || !mountRef.current || !wasmMemory) return;

    const initObject = wasmModule.exports.init_object as CallableFunction;
    const updatePhysics = wasmModule.exports.update_physics as CallableFunction;
    const getObjectPosition = wasmModule.exports.get_object_position as CallableFunction;

    initObject(0, 4, 0, 0, 0, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 50);
    camera.position.set(12, 12, 20);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current?.appendChild(renderer.domElement);

    const cube = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), new THREE.MeshBasicMaterial({ wireframe: true }));
    scene.add(cube);

    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.24, 32, 32), new THREE.MeshBasicMaterial({ color: 0xff6699 }));
    scene.add(ball);

    const animate = () => {
      cubeRotationX += 0.005;
      cubeRotationY += 0.005;
      cube.rotation.set(cubeRotationX, cubeRotationY, 0);

      updatePhysics(0.016, cubeRotationX * 0.2, cubeRotationY * 0.2);

      const pos = new Float64Array(wasmMemory, getObjectPosition(), 3);
      ball.position.set(pos[0], pos[1], pos[2]);

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate();
  }, [wasmModule, wasmMemory]);

  return <div ref={mountRef} />;
}