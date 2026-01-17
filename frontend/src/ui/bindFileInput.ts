export function bindFileInput(
  input: HTMLInputElement,
  onFile: (file: File) => Promise<void>
) {
  input.addEventListener("change", async () => {
    const file = input.files?.[0];
    if (!file) return;

    await onFile(file); // aquí llamas al callback
  });
}
