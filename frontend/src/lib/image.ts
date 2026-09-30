export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function isAcceptedImage(file: File): boolean {
  return ACCEPTED_IMAGE_TYPES.includes(file.type);
}
