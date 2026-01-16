import { loadFileBytes } from "../core/fileLoader";
import { inspectBytes } from "../core/csvInspector";

export function bindFileInput(input: HTMLInputElement) {
  input.addEventListener("change", async () => {
    const file = input.files?.[0];
    if (!file) return;

    const bytes = await loadFileBytes(file);
    const info = inspectBytes(bytes);

    console.log(bytes);
    console.log(info);
  });
}
