export type EnhanceOptions = { grayscale: boolean; contrast: boolean; resize: boolean };
export async function processImage(file: File, options: EnhanceOptions): Promise<string> {
  const url = URL.createObjectURL(file); const image = new Image();
  await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("Gambar tidak dapat dibaca")); image.src = url; });
  // Vision AI can read a KTP clearly at this size; limiting it keeps upload and latency low.
  const scale = options.resize ? Math.min(1.4, 1600 / Math.max(image.width, image.height)) : 1;
  const canvas = document.createElement("canvas"); canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
  const ctx = canvas.getContext("2d", { willReadFrequently: true }); if (!ctx) throw new Error("Canvas tidak tersedia");
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  if (options.grayscale || options.contrast) { const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height); for (let i = 0; i < pixels.data.length; i += 4) { let v = .299 * pixels.data[i] + .587 * pixels.data[i + 1] + .114 * pixels.data[i + 2]; if (options.contrast) v = Math.max(0, Math.min(255, (v - 128) * 1.5 + 128)); pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = v; } ctx.putImageData(pixels, 0, 0); }
  URL.revokeObjectURL(url); return canvas.toDataURL("image/jpeg", .82);
}
