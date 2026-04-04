# N1 Video Intelligence Analysis — Backend Task Plan

## Scope
Implement video scene detection and keyframe extraction services for the storyboard copilot platform.

## Tasks

### N1.1 — Scene Detection Service
- [x] Types already defined: `src/server/video/analysis/types.ts`
- [x] Tests already written: `__tests__/unit/video/sceneDetector.test.ts`
- [ ] Implement `src/server/video/analysis/sceneDetector.ts`
- [ ] Install `fluent-ffmpeg` + `@ffmpeg-installer/ffmpeg`

### N1.2 — Frame Extraction Service
- [x] Tests already written: `__tests__/unit/video/frameExtractor.test.ts`
- [ ] Implement `src/server/video/analysis/frameExtractor.ts`

### N1.3 — API Route
- [ ] Write tests: `__tests__/api/video-analyze.test.ts`
- [ ] Implement `src/app/api/video/analyze/route.ts`
- [ ] Extend jobs route to support video_analysis job type

## Acceptance Criteria
- All unit tests pass for sceneDetector and frameExtractor
- API route returns 401/400/jobId correctly
- `npx tsc --noEmit` passes
- `npx vitest run` passes
