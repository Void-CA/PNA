// services/engine.ts
import init, { GradeEngine } from "../../pkg/pkg.js";

let ready = false;

export async function initEngine() {
  if (!ready) {
    await init();
    ready = true;
  }
}

export function createEngine(bytes: Uint8Array) {
  if (!ready) {
    throw new Error("Engine not initialized");
  }
  return new GradeEngine(bytes);
}
