import init, { GradeEngine } from "../pkg/pkg.js";
import { bindFileInput } from "./ui/bindFileInput";

async function run() {
  await init(); // Inicializa el WASM

  const input = document.querySelector<HTMLInputElement>("#file")!;

  bindFileInput(input, async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    const engine = new GradeEngine(bytes);
    const summary = engine.get_summary();
    const table = engine.get_table();
    console.log(summary);
    console.log(table);
    });

}

run();
