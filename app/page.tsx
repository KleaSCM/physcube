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
    if (!wasmModule || !mountRef.current) return;

    const initObject = wasmModule.exports.init_object as CallableFunction;
    const updatePhysics = wasmModule.exports.update_physics as CallableFunction;
    const getObjectPosition = wasmModule.exports.get_object_position as CallableFunction;

    // Initialize object inside cube
    initObject(0, 2, 0, 0, 0, 0, 1);

    // Create Scene
    const scene = new THREE.Scene();

    // Camera Persp
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(5, 5, 10);
    camera.lookAt(0, 0, 0);

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current?.appendChild(renderer.domElement);

    //Wireframe Cube
    const cubeGeometry = new THREE.BoxGeometry(5, 5, 5);
    const cubeMaterial = new THREE.LineBasicMaterial({ color: 0x0077ff });
    const cubeEdges = new THREE.EdgesGeometry(cubeGeometry);
    const cubeWireframe = new THREE.LineSegments(cubeEdges, cubeMaterial);
    scene.add(cubeWireframe);

    // place object
    const objectGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const objectMaterial = new THREE.MeshBasicMaterial({ color: 0xff6699 });
    const physicsObject = new THREE.Mesh(objectGeometry, objectMaterial);
    scene.add(physicsObject);

    // 🔄 Animation Loop
    const animate = () => {
      updatePhysics();

      // retrieve updated position WASAM
      const position = new Float64Array(getObjectPosition());
      physicsObject.position.set(position[0], position[1], position[2]);

      // Rotate 3D effect
      cubeWireframe.rotation.x += 0.005;
      cubeWireframe.rotation.y += 0.005;

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, [wasmModule]);

  return <div ref={mountRef} style={{ width: "100vw", height: "100vh", background: "black" }} />;
}
