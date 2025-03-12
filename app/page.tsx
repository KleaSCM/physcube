"use client";

import { useEffect, useState } from "react";

export default function WasmTest() {
  const [wasmModule, setWasmModule] = useState<WebAssembly.Instance | null>(null);
  const [wasmLoaded, setWasmLoaded] = useState(false);

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
        } else {
          console.warn("⚠️ WASM Memory is undefined!");
        }

        setWasmModule(instance);
        setWasmLoaded(true);
      } catch (error) {
        console.error("❌ Failed to load WASM module:", error);
      }
    }

    loadWasm();
  }, []);

  return (
    <main style={{ textAlign: "center", padding: "20px" }}>
      <h1>WASM Test</h1>
      <p>{wasmLoaded ? "✅ WASM Loaded" : "❌ WASM Not Loaded"}</p>
    </main>
  );
}
