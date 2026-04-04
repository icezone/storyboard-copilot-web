# Findings — video-analysis-dev

## Existing Infrastructure
- `src/server/video/analysis/types.ts` already defines SceneDetectOptions, SceneDetectResult, VideoMetadata, FrameExtractOptions, ExtractedFrame, VideoAnalyzeJobResult
- `src/server/jobs/jobService.ts` provides createJob/updateJobStatus/getJob
- `src/app/api/jobs/[id]/route.ts` handles job polling (video/image providers)
- Tests follow hoisted mock pattern with vi.hoisted() for ffmpeg/sharp mocks
- Job type field in createJob params accepts 'image' | 'video' — will need to extend or use 'video' for video_analysis
