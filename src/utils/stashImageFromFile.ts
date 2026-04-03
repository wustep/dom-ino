import type { SavedElement, SceneElement } from "../scene/types";

/** Max width *or* height (px) for stash / dropped image physics boxes; aspect ratio preserved. */
export const STASH_DROP_IMAGE_MAX_SIDE_PX = 400;

/** Reject very large files to protect memory and localStorage. */
export const STASH_DROP_IMAGE_MAX_FILE_BYTES = 2 * 1024 * 1024;

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg|avif|bmp|ico)$/i;

export function isAcceptableStashImageFile(file: File): boolean {
  if (!file || file.size > STASH_DROP_IMAGE_MAX_FILE_BYTES) return false;
  if (file.type.startsWith("image/")) return true;
  return IMAGE_EXT.test(file.name);
}

export function cappedSizeForStashImage(
  naturalWidth: number,
  naturalHeight: number,
  maxSide: number = STASH_DROP_IMAGE_MAX_SIDE_PX
): { width: number; height: number } {
  const nw = Number.isFinite(naturalWidth) && naturalWidth > 0 ? naturalWidth : 1;
  const nh = Number.isFinite(naturalHeight) && naturalHeight > 0 ? naturalHeight : 1;
  const scale = Math.min(1, maxSide / Math.max(nw, nh));
  return {
    width: Math.max(1, Math.round(nw * scale)),
    height: Math.max(1, Math.round(nh * scale)),
  };
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("read"));
    reader.readAsDataURL(file);
  });
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("decode"));
    img.src = src;
  });
}

export async function savedElementFromImageFile(
  file: File,
  sourceScene: string
): Promise<SavedElement | null> {
  if (!isAcceptableStashImageFile(file)) return null;

  let dataUrl: string;
  try {
    dataUrl = await readFileAsDataUrl(file);
  } catch {
    return null;
  }

  let naturalWidth = 1;
  let naturalHeight = 1;
  try {
    const img = await loadImageElement(dataUrl);
    naturalWidth = img.naturalWidth || img.width || 1;
    naturalHeight = img.naturalHeight || img.height || 1;
  } catch {
    return null;
  }

  const { width, height } = cappedSizeForStashImage(naturalWidth, naturalHeight);

  const element: SceneElement = {
    id: `stash-img-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    type: "image",
    rect: { x: 0, y: 0, width, height },
    throwable: true,
    pinned: false,
    imageSrc: dataUrl,
    imageAlt: file.name.replace(/[/\\]/g, ""),
    backgroundColor: "#e5e5e5",
    borderRadius: 8,
  };

  return { element, savedAt: Date.now(), sourceScene };
}
