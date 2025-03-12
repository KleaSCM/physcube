"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export default function PhysCube() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [wasmModule, setWasmModule] = useState<WebAssembly.Instance | null>(null);
  const [wasmMemory, setWasmMemory] = useState<ArrayBuffer | null>(null);

  useEffect(() => {
    async function loadWasm() {
      console.log("📡 Fetching WASM file...");
      try {
        const response = await fetch("/physics.wasm");
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        console.log("📡 Successfully fetched WASM file.");
        const bytes = await response.arrayBuffer();
        console.log("📦 Converted WASM to ArrayBuffer. ByteLength:", bytes.byteLength);

        const { instance } = await WebAssembly.instantiate(bytes, { env: {} });

        console.log("✅ WASM successfully instantiated:", instance);
        console.log("🛠️ WASM Exports:", instance.exports);

        if (!instance.exports.init_object || !instance.exports.update_physics || !instance.exports.get_object_position) {
          throw new Error("🚨 Missing required functions in WASM exports!");
        }

        console.log("🎯 Required WASM functions found!");

        const memory = instance.exports.memory as WebAssembly.Memory | undefined;
        if (memory) {
          console.log("🧠 WASM Memory Buffer:", memory.buffer);
          setWasmMemory(memory.buffer);
        } else {
          console.warn("⚠️ WASM Memory is undefined!");
        }

        setWasmModule(instance);
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

    initObject(0, 2, 0, 0, 0, 0, 1); // Initialize physics object

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(5, 5, 10);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current?.appendChild(renderer.domElement);

    // Wireframe cube
    const cubeGeometry = new THREE.BoxGeometry(5, 5, 5);
    const cubeMaterial = new THREE.LineBasicMaterial({ color: 0x0077ff });
    const cubeEdges = new THREE.EdgesGeometry(cubeGeometry);
    const cubeWireframe = new THREE.LineSegments(cubeEdges, cubeMaterial);
    scene.add(cubeWireframe);

    // sphere
    const objectGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const objectMaterial = new THREE.MeshBasicMaterial({ color: 0xff6699 });
    const physicsObject = new THREE.Mesh(objectGeometry, objectMaterial);
    scene.add(physicsObject);

    const animate = () => {
      updatePhysics();

      const positionPtr = getObjectPosition();
      if (positionPtr) {
        const position = new Float64Array(wasmMemory, positionPtr, 3);
        console.log("📌 Object Position:", position);
        physicsObject.position.set(position[0], position[1], position[2]);
      }

      cubeWireframe.rotation.x += 0.005;
      cubeWireframe.rotation.y += 0.005;

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, [wasmModule, wasmMemory]);

  return <div ref={mountRef} style={{ width: "100vw", height: "100vh", background: "black" }} />;
}







// "use client";

// import { useEffect, useState } from "react";

// export default function WasmTest() {
//   const [wasmModule, setWasmModule] = useState<WebAssembly.Instance | null>(null);
//   const [wasmLoaded, setWasmLoaded] = useState(false);

//   useEffect(() => {
//     async function loadWasm() {
//       console.log("📡 Fetching WASM file...");

//       try {
//         const response = await fetch("/physics.wasm");

//         if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

//         console.log("📡 Successfully fetched WASM file.");
//         const bytes = await response.arrayBuffer();
//         console.log("📦 Converted WASM to ArrayBuffer. ByteLength:", bytes.byteLength);

//         const { instance } = await WebAssembly.instantiate(bytes, { env: {} });

//         console.log("✅ WASM successfully instantiated:", instance);
//         console.log("🛠️ WASM Exports:", instance.exports);

//         if (!instance.exports.init_object || !instance.exports.update_physics || !instance.exports.get_object_position) {
//           throw new Error("🚨 Missing required functions in WASM exports!");
//         }

//         console.log("🎯 Required WASM functions found!");

//         const memory = instance.exports.memory as WebAssembly.Memory | undefined;
//         if (memory) {
//           console.log("🧠 WASM Memory Buffer:", memory.buffer);
//         } else {
//           console.warn("⚠️ WASM Memory is undefined!");
//         }

//         setWasmModule(instance);
//         setWasmLoaded(true);
//       } catch (error) {
//         console.error("❌ Failed to load WASM module:", error);
//       }
//     }

//     loadWasm();
//   }, []);

//   return (
//     <main style={{ textAlign: "center", padding: "20px" }}>
//       <h1>WASM Test</h1>
//       <p>{wasmLoaded ? "✅ WASM Loaded" : "❌ WASM Not Loaded"}</p>
//     </main>
//   );
// }
