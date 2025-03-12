"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export default function PhysCube() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [wasmModule, setWasmModule] = useState<WebAssembly.Instance | null>(null);

  useEffect(() => {
    async function loadWasm() {
      try {
        const res = await fetch("/physics.wasm");
        const bytes = await res.arrayBuffer();
        const { instance } = await WebAssembly.instantiate(bytes, {});
        setWasmModule(instance);
      } catch (error) {
        console.error("Failed to load WASM module", error);
      }
    }
    loadWasm();
  }, []);

  useEffect(() => {
    if (!wasmModule) return;

    const initObject = wasmModule.exports.init_object as CallableFunction;
    const updatePhysics = wasmModule.exports.update_physics as CallableFunction;
    const getObjectPosition = wasmModule.exports.get_object_position as CallableFunction;

    // Initialize object inside cube
    initObject(0, 2, 0, 0, 0, 0, 1);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current?.appendChild(renderer.domElement);

    // Cube
    const cubeGeometry = new THREE.BoxGeometry(5, 5, 5);
    const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0x0077ff, wireframe: true });
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    scene.add(cube);

    // Object inside cube
    const objectGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const objectMaterial = new THREE.MeshBasicMaterial({ color: 0xff6699 });
    const physicsObject = new THREE.Mesh(objectGeometry, objectMaterial);
    scene.add(physicsObject);

    camera.position.z = 10;

    // ani Loop
    const animate = () => {
      updatePhysics();
      const position = new Float64Array(getObjectPosition());
      physicsObject.position.set(position[0], position[1], position[2]);
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate();
  }, [wasmModule]);

  return <div ref={mountRef} />;
}
