import type { PixelCrop } from "react-image-crop";

const MAXIMUM_OUTPUT_SIZE = 4096;
const JPEG_QUALITY = 0.92;

export async function cropImage(
  image: HTMLImageElement,
  crop: PixelCrop,
): Promise<Blob> {
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const sourceWidth = crop.width * scaleX;
  const sourceHeight = crop.height * scaleY;
  const outputSize = Math.max(
    1,
    Math.min(
      MAXIMUM_OUTPUT_SIZE,
      Math.round(Math.min(sourceWidth, sourceHeight)),
    ),
  );

  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is not available");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, outputSize, outputSize);
  context.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    outputSize,
    outputSize,
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }
        reject(new Error("The crop could not be encoded"));
      },
      "image/jpeg",
      JPEG_QUALITY,
    );
  });
}
