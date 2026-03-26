import type { ImageSplitGateway } from '../application/ports';

export class WebImageSplitGateway implements ImageSplitGateway {
  async split(
    imageSource: string,
    rows: number,
    cols: number,
    lineThickness: number
  ): Promise<string[]> {
    const response = await fetch('/api/image/split', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: imageSource,
        rows,
        cols,
        lineThickness,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Image split failed: ${response.status}`);
    }

    const data = await response.json() as { images: string[] };
    return data.images;
  }
}

export const webImageSplitGateway = new WebImageSplitGateway();
