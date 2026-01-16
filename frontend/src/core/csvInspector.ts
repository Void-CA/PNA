export function inspectBytes(bytes: Uint8Array) {
  return {
    preview: new TextDecoder().decode(bytes.slice(0, 200)),
    size: bytes.length
  };
}
