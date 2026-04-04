import { CANVAS_NODE_TYPES, type NovelScene } from '../domain/canvasNodes';

interface MinimalCanvasStore {
  nodes: Array<{ id: string; position: { x: number; y: number }; [key: string]: unknown }>;
  addNode: (type: string, position: { x: number; y: number }, data?: Record<string, unknown>) => string;
  addEdge: (source: string, target: string) => string | null;
}

const OFFSET_X = 400;
const SPACING_Y = 300;
const DEFAULT_GRID_ROWS = 3;
const DEFAULT_GRID_COLS = 3;

export function batchGenerateStoryboards(
  novelNodeId: string,
  scenes: NovelScene[],
  canvasStore: MinimalCanvasStore,
): void {
  const selectedScenes = scenes.filter((s) => s.selected);
  if (selectedScenes.length === 0) return;

  const novelNode = canvasStore.nodes.find((n) => n.id === novelNodeId);
  if (!novelNode) return;

  const startX = novelNode.position.x + OFFSET_X;
  const startY = novelNode.position.y;

  selectedScenes.forEach((scene, index) => {
    const frameCount = DEFAULT_GRID_ROWS * DEFAULT_GRID_COLS;
    const frames = Array.from({ length: frameCount }, () => ({
      id: crypto.randomUUID(),
      description: scene.visualPrompt,
      referenceIndex: null,
    }));

    const nodeId = canvasStore.addNode(
      CANVAS_NODE_TYPES.storyboardGen,
      { x: startX, y: startY + index * SPACING_Y },
      {
        displayName: scene.title,
        gridRows: DEFAULT_GRID_ROWS,
        gridCols: DEFAULT_GRID_COLS,
        frames,
      },
    );

    canvasStore.addEdge(novelNodeId, nodeId);
  });
}
