<div align="center">

# IceZone Studio

### AI Creative Studio

[![CI](https://github.com/icezone/icezone-studio/actions/workflows/ci.yml/badge.svg)](https://github.com/icezone/icezone-studio/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

<p align="center">
  <strong>Your all-in-one AI creative workspace for image generation, video production, and storyboard design.</strong>
</p>

**English** | **[中文](README-CN.md)**

[Live Demo](https://icezone.studio) · [Changelog](CHANGELOG.md)

</div>

---

## What is IceZone Studio?

IceZone Studio is a **node-based AI creative platform** where you can visually connect different creative tasks — from uploading images, generating AI art, producing videos, to building complete storyboards — all in one interactive canvas.

Think of it as a visual creative workbench: each task is a "node" on the canvas, and you connect them together to build your creative pipeline. No coding required. Just drag, drop, connect, and create.

---

## Who is it for?

- **Content Creators** — Generate and edit AI images, produce short videos, batch-create social media content
- **Filmmakers & Animators** — Break down scripts into storyboards, analyze video shots, extract keyframes
- **Writers & Storytellers** — Convert novels and scripts into visual storyboard sequences automatically
- **Designers** — Crop, annotate, and process images with built-in tools, then feed them into AI generation
- **Teams** — Share workflow templates with the community, collaborate on projects with real-time sync

---

## Key Features

### Canvas Workspace

The heart of IceZone Studio is the **interactive node canvas**. Everything you do happens on a flexible, zoomable workspace where you can:

- **Drag & drop** nodes to build creative workflows
- **Connect nodes** to pass images, prompts, and results between steps
- **Multi-select & group** nodes to organize complex projects
- **Undo/redo** any action with full history tracking
- **Auto-save** — your work is always safe, even if you close the browser

### AI Image Generation

Create stunning images with **7 AI models** from 4 providers:

- Choose your preferred model and provider
- Set aspect ratio, quality, and style parameters
- Use reference images to guide generation
- View results instantly on the canvas
- Supports both **Standard** and **Professional** modes

### AI Video Generation

Turn text descriptions or images into videos with **5 video models** from 3 providers:

- **Text-to-Video** — Describe a scene and watch it come to life
- **Image-to-Video** — Animate a still image into a video clip
- Duration options from **3 seconds to 15 seconds**
- Multi-shot support for complex sequences
- Audio generation support (select models)

### AI Analysis Suite

Let AI understand your creative content:

| Feature | What it does |
|---------|-------------|
| **Video Analysis** | Upload a video → automatically detect scenes and extract keyframes |
| **Reverse Prompt** | Upload an image → AI generates the prompt that could recreate it |
| **Shot Analysis** | Upload a frame → get professional analysis of camera angle, lighting, composition, and mood |
| **Novel Splitting** | Paste a story → AI splits it into scenes with character extraction, ready for storyboarding |

### Storyboard Creation

Build professional storyboards with ease:

- **Grid Layout** — Configure rows, columns, and aspect ratios
- **Batch Generation** — Generate all frames at once with AI
- **Novel-to-Storyboard** — Paste your script, AI splits it into scenes, then batch-generate storyboard frames
- **Video-to-Storyboard** — Extract keyframes from existing video and rebuild storyboards
- **Export** — Download individual frames or complete storyboard sheets

### Built-in Image Tools

Process your images without leaving the canvas:

- **Crop** — Precisely trim images to any size
- **Annotate** — Add text, markers, and highlights
- **Split** — Divide storyboard sheets into individual frames

### Template System

Don't start from scratch — use templates:

- **3 official templates**: Novel-to-Storyboard, Video Rebuild, Batch Image Generation
- **Save your own** workflows as reusable templates
- **Share with the community** — publish templates for others to discover and use
- **Import/Export** — share templates as JSON files

### Bring Your Own Key (BYOK)

Use your own API keys for maximum flexibility:

- Support for **6 providers**: KIE, PPIO, GRSAI, FAL, OpenAI, Anthropic
- Keys are **AES-256-GCM encrypted** — we never see your raw keys
- Add **multiple keys per provider** with automatic rotation
- Automatic failover when a key hits rate limits

### Multi-Language Support

IceZone Studio speaks your language:

- Full **Chinese** and **English** interface
- Switch languages anytime from settings
- All UI elements, tooltips, and messages are localized

---

## Workflow Examples

### From Novel to Storyboard

```
Novel Input → AI Scene Splitting → Storyboard Gen (Batch) → Export
```

1. Paste your novel or script text into a **Novel Input** node
2. Click **Smart Split** — AI breaks it into scenes with character descriptions
3. Select scenes and click **Batch Generate Storyboards**
4. AI generates visual frames for each scene
5. Export the complete storyboard

### Video Analysis & Rebuild

```
Video Analysis → Keyframe Extraction → AI Image Enhancement → Storyboard Export
```

1. Upload a video to a **Video Analysis** node
2. AI detects scenes and extracts keyframes
3. Export keyframes to the canvas as individual images
4. Use **Reverse Prompt** or **Shot Analysis** to understand each frame
5. Regenerate or enhance frames with AI

### Batch Image Generation

```
AI Image Node × N → Group → Export
```

1. Add multiple **AI Image** nodes with different prompts
2. Connect reference images for style consistency
3. Generate all images in batch
4. Group results and export

---

## Getting Started

### 1. Visit [icezone.studio](https://icezone.studio)

### 2. Create an account (Email or Google sign-in)

### 3. Configure your API keys

Go to **Settings → API Keys** and add your provider keys. You'll need at least one key to use AI features.

### 4. Create a new project

Click **New Project** from the dashboard to open your canvas workspace.

### 5. Start creating!

Double-click the canvas or use the left toolbar to add nodes. Connect them together and start your creative workflow.

---

## Self-Hosting

For developers who want to run IceZone Studio locally:

```bash
git clone https://github.com/icezone/icezone-studio.git
cd icezone-studio
npm install
cp .env.example .env.local
# Fill in your Supabase credentials in .env.local
npm run dev
```

Requires: Node.js >= 18, npm >= 9, and a [Supabase](https://supabase.com) project.

---

## Tech Overview

Built with Next.js 15, React 19, TypeScript, Zustand, @xyflow/react, TailwindCSS 4, and Supabase. Full CI/CD with GitHub Actions. See [AGENTS.md](AGENTS.md) for architecture details.

---

## Contributing

We welcome contributions! Please follow the TDD workflow (write tests first), use conventional commits, and ensure all checks pass before submitting a PR.

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">
  <sub>IceZone Studio &copy; 2026</sub>
</div>
