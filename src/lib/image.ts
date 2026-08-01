const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_INPUT_BYTES = 50 * 1024 * 1024;
const TARGET_OUTPUT_BYTES = 2.5 * 1024 * 1024;
const MAX_DIMENSION = 2560;
const MIN_DIMENSION = 320;

export type PreparedGalleryImage = {
  file: File;
  originalWidth: number;
  originalHeight: number;
  outputWidth: number;
  outputHeight: number;
  originalBytes: number;
  optimizedBytes: number;
  wasOptimized: boolean;
};

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function fitImageWithinDimension(
  width: number,
  height: number,
  maxDimension = MAX_DIMENSION,
) {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    !Number.isFinite(maxDimension) ||
    width <= 0 ||
    height <= 0 ||
    maxDimension <= 0
  ) {
    throw new Error("Dimensi gambar tidak valid.");
  }

  const scale = Math.min(1, maxDimension / Math.max(width, height));

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function replaceFileExtension(fileName: string, extension: string) {
  const baseName = fileName.replace(/\.[^/.]+$/, "") || "karya";
  return `${baseName}.${extension}`;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Browser gagal memproses gambar."));
      },
      type,
      quality,
    );
  });
}

async function loadImage(file: File) {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = new Image();
    image.decoding = "async";
    image.src = objectUrl;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function prepareGalleryImage(
  sourceFile: File,
): Promise<PreparedGalleryImage> {
  if (!ALLOWED_IMAGE_TYPES.has(sourceFile.type)) {
    throw new Error("Format harus JPG, PNG, WEBP, atau GIF.");
  }

  if (sourceFile.size > MAX_INPUT_BYTES) {
    throw new Error("Ukuran gambar awal maksimal 50 MB.");
  }

  const image = await loadImage(sourceFile);
  const width = image.naturalWidth;
  const height = image.naturalHeight;

  if (!width || !height) {
    throw new Error("Dimensi gambar tidak dapat dibaca.");
  }

  if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
    throw new Error(
      `Resolusi terlalu kecil. Minimal ${MIN_DIMENSION} × ${MIN_DIMENSION} piksel.`,
    );
  }

  if (sourceFile.type === "image/gif") {
    return {
      file: sourceFile,
      originalWidth: width,
      originalHeight: height,
      outputWidth: width,
      outputHeight: height,
      originalBytes: sourceFile.size,
      optimizedBytes: sourceFile.size,
      wasOptimized: false,
    };
  }

  const initialDimensions = fitImageWithinDimension(width, height);
  let outputWidth = initialDimensions.width;
  let outputHeight = initialDimensions.height;
  let quality = 0.86;
  let blob: Blob | null = null;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const canvas = document.createElement("canvas");
    canvas.width = outputWidth;
    canvas.height = outputHeight;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) throw new Error("Canvas browser tidak tersedia.");

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(image, 0, 0, outputWidth, outputHeight);

    blob = await canvasToBlob(canvas, "image/webp", quality);

    if (blob.size <= TARGET_OUTPUT_BYTES || attempt === 5) break;

    quality = Math.max(0.58, quality - 0.08);
    // Scale both axes by exactly the same factor. Clamping each axis to the
    // minimum source resolution distorted panoramic and portrait artwork.
    outputWidth = Math.max(1, Math.round(outputWidth * 0.88));
    outputHeight = Math.max(1, Math.round(outputHeight * 0.88));
  }

  if (!blob) throw new Error("Gambar gagal dioptimalkan.");

  const optimizedFile = new File(
    [blob],
    replaceFileExtension(sourceFile.name, "webp"),
    {
      type: "image/webp",
      lastModified: Date.now(),
    },
  );

  const shouldUseOriginal =
    sourceFile.size <= TARGET_OUTPUT_BYTES &&
    initialDimensions.width === width &&
    initialDimensions.height === height &&
    optimizedFile.size >= sourceFile.size;

  return {
    file: shouldUseOriginal ? sourceFile : optimizedFile,
    originalWidth: width,
    originalHeight: height,
    outputWidth: shouldUseOriginal ? width : outputWidth,
    outputHeight: shouldUseOriginal ? height : outputHeight,
    originalBytes: sourceFile.size,
    optimizedBytes: shouldUseOriginal ? sourceFile.size : optimizedFile.size,
    wasOptimized: !shouldUseOriginal,
  };
}
