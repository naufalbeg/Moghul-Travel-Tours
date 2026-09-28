// Browser-only: turns the area chosen in the crop dialog into a JPEG file.
import type { Area } from "react-easy-crop";

/**
 * Draws `area` (in the source image's own pixels) onto a canvas, scaled down
 * to at most `maxWidth`, and returns it as a JPEG ready to upload. Works for
 * local blob: URLs and for photos already in Supabase Storage (which sends
 * CORS headers, so the canvas isn't tainted).
 */
export async function cropImage(src: string, area: Area, maxWidth: number): Promise<File> {
  const image = await loadImage(src);
  const scale = Math.min(1, maxWidth / area.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(area.width * scale));
  canvas.height = Math.max(1, Math.round(area.height * scale));

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser.");
  // PNGs with transparency would turn black as JPEG.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.88));
  if (!blob) throw new Error("Couldn't create the cropped photo.");
  return new File([blob], "photo.jpg", { type: "image/jpeg" });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Couldn't open this photo."));
    image.src = src;
  });
}
