/**
 * Web shims for Tauri image commands.
 * These replace Tauri invoke() calls with Web API / server-side API calls.
 */

export interface MergeStoryboardImagesPayload {
  frameSources: string[];
  rows: number;
  cols: number;
  cellGap: number;
  outerPadding: number;
  noteHeight: number;
  fontSize: number;
  backgroundColor: string;
  maxDimension: number;
  showFrameIndex?: boolean;
  showFrameNote?: boolean;
  notePlacement?: 'overlay' | 'bottom';
  imageFit?: 'cover' | 'contain';
  frameIndexPrefix?: string;
  textColor?: string;
  frameNotes?: string[];
}

export interface StoryboardImageMetadata {
  gridRows: number;
  gridCols: number;
  frameNotes: string[];
}

export interface PrepareNodeImageSourceResult {
  imagePath: string;
  previewImagePath: string;
  aspectRatio: string;
}

export interface CropImageSourcePayload {
  source: string;
  aspectRatio?: string;
  cropX?: number;
  cropY?: number;
  cropWidth?: number;
  cropHeight?: number;
}

export interface MergeStoryboardImagesResult {
  imagePath: string;
  canvasWidth: number;
  canvasHeight: number;
  cellWidth: number;
  cellHeight: number;
  gap: number;
  padding: number;
  noteHeight: number;
  fontSize: number;
  textOverlayApplied: boolean;
}

/**
 * Split image via the Web image API.
 */
export async function splitImageSource(
  source: string,
  rows: number,
  cols: number,
  lineThickness = 0
): Promise<string[]> {
  const response = await fetch('/api/image/split', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source, rows, cols, lineThickness }),
  });
  if (!response.ok) {
    throw new Error(`splitImageSource failed: ${await response.text()}`);
  }
  const data = await response.json() as { images: string[] };
  return data.images;
}

/**
 * Crop image via the Web image API.
 */
export async function cropImageSource(
  payload: CropImageSourcePayload
): Promise<string> {
  const response = await fetch('/api/image/crop', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`cropImageSource failed: ${await response.text()}`);
  }
  const data = await response.json() as { image: string };
  return data.image;
}

/**
 * Merge storyboard images via the Web image API.
 */
export async function mergeStoryboardImages(
  payload: MergeStoryboardImagesPayload
): Promise<MergeStoryboardImagesResult> {
  const response = await fetch('/api/image/merge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`mergeStoryboardImages failed: ${await response.text()}`);
  }
  return response.json() as Promise<MergeStoryboardImagesResult>;
}

/**
 * Read storyboard image metadata from server.
 * For Web, this returns null (metadata is embedded via custom PNG chunks on desktop).
 */
export async function readStoryboardImageMetadata(
  _source: string
): Promise<StoryboardImageMetadata | null> {
  // Web version: metadata is not embedded in images; return null.
  return null;
}

/**
 * Embed storyboard image metadata.
 * For Web, returns the source unchanged (no-op; metadata is stored in project state).
 */
export async function embedStoryboardImageMetadata(
  source: string,
  _metadata: StoryboardImageMetadata
): Promise<string> {
  // Web version: no-op, metadata is managed in project state.
  return source;
}

/**
 * Copy image to clipboard using the Web Clipboard API.
 */
export async function copyImageSourceToClipboard(source: string): Promise<void> {
  try {
    if (source.startsWith('data:')) {
      const response = await fetch(source);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type || 'image/png']: blob }),
      ]);
      return;
    }

    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const blob = await response.blob();
    await navigator.clipboard.write([
      new ClipboardItem({ [blob.type || 'image/png']: blob }),
    ]);
  } catch (error) {
    console.error('[copyImageSourceToClipboard] Failed:', error);
    throw error;
  }
}

/**
 * Download image to user's downloads folder via browser download link.
 * Returns the suggested filename.
 */
export async function saveImageSourceToDownloads(
  source: string,
  suggestedFileName?: string
): Promise<string> {
  const filename = suggestedFileName ?? `image_${Date.now()}.png`;
  await triggerBrowserDownload(source, filename);
  return filename;
}

/**
 * Save image to a specific path — Web version triggers browser download.
 */
export async function saveImageSourceToPath(
  source: string,
  targetPath: string
): Promise<string> {
  const filename = targetPath.split('/').pop() ?? targetPath.split('\\').pop() ?? `image_${Date.now()}.png`;
  await triggerBrowserDownload(source, filename);
  return filename;
}

/**
 * Save image to a directory — Web version triggers browser download.
 */
export async function saveImageSourceToDirectory(
  source: string,
  _targetDir: string,
  suggestedFileName?: string
): Promise<string> {
  const filename = suggestedFileName ? `${suggestedFileName}.png` : `image_${Date.now()}.png`;
  await triggerBrowserDownload(source, filename);
  return filename;
}

async function triggerBrowserDownload(source: string, filename: string): Promise<void> {
  let blobUrl: string;
  let createdBlobUrl = false;

  if (source.startsWith('blob:')) {
    blobUrl = source;
  } else if (source.startsWith('data:')) {
    const response = await fetch(source);
    const blob = await response.blob();
    blobUrl = URL.createObjectURL(blob);
    createdBlobUrl = true;
  } else {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`Failed to fetch image for download: ${response.statusText}`);
    }
    const blob = await response.blob();
    blobUrl = URL.createObjectURL(blob);
    createdBlobUrl = true;
  }

  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  if (createdBlobUrl) {
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  }
}
