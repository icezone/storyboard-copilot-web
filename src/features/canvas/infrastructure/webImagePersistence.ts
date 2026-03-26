/**
 * WebImagePersistence: handles uploading images to Supabase Storage via the assets API.
 *
 * imageUrl = Supabase Storage public/signed URL
 * previewImageUrl = thumbnail URL (same as imageUrl or compressed via sharp)
 */

export interface UploadedImage {
  imageUrl: string;
  previewImageUrl: string;
}

export class WebImagePersistence {
  /**
   * Upload a file (from user input) to Supabase Storage via the assets API.
   * Returns the public URL of the uploaded asset.
   */
  async uploadFile(file: File, projectId: string): Promise<UploadedImage> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId);

    const response = await fetch('/api/assets/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Upload failed: ${response.status}`);
    }

    const data = await response.json() as { imageUrl: string; previewImageUrl?: string };
    return {
      imageUrl: data.imageUrl,
      previewImageUrl: data.previewImageUrl ?? data.imageUrl,
    };
  }

  /**
   * Upload an image from a URL or data URL to Supabase Storage.
   * Returns the public URL of the stored asset.
   */
  async uploadFromUrl(imageUrl: string, projectId: string): Promise<UploadedImage> {
    const response = await fetch('/api/assets/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl, projectId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Upload from URL failed: ${response.status}`);
    }

    const data = await response.json() as { imageUrl: string; previewImageUrl?: string };
    return {
      imageUrl: data.imageUrl,
      previewImageUrl: data.previewImageUrl ?? data.imageUrl,
    };
  }
}

export const webImagePersistence = new WebImagePersistence();
