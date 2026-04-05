# Changelog

**English** | **[中文](CHANGELOG-CN.md)**

All notable changes to IceZone Studio will be documented in this file.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

## [0.3.0] - 2026-04-05

### Added
- Renamed project to **IceZone Studio** with new branding across all pages
- **Video Analysis** — Upload video, auto-detect scenes, extract keyframes
- **Reverse Prompt** — Upload image, AI generates the prompt to recreate it (Gemini Vision)
- **Shot Analysis** — Professional camera angle, lighting, composition, and mood analysis
- **Novel/Script Splitting** — Paste text, AI splits into scenes with character extraction
- **Template System** — 3 official templates + user custom templates + community sharing
- **Batch Storyboard Generation** — Generate all storyboard frames at once
- **Multi API Key Rotation** — Add multiple keys per provider with automatic failover
- Comprehensive E2E test coverage for all major features

### Fixed
- Template save button and error handling
- E2E test selectors matching actual UI components
- Landing page branding updated to IceZone Studio

### Changed
- Project documentation fully updated with current feature inventory

## [0.2.0] - 2026-04-04

### Added
- Canvas sidebar with node menu, layers, history, and zoom controls
- Dark mode support with theme-aware interface
- Node visual refinements and interaction improvements
- Project name display in canvas header
- Real-time save status indicators

### Fixed
- Project name occasionally lost during auto-save
- Multiple project cards causing display issues

## [0.1.0] - 2026-04-03

### Added
- **Interactive Node Canvas** — Drag-and-drop workspace with zoom, pan, multi-select, and grouping
- **11 Node Types** — Upload, AI Image, Export, Text Annotation, Group, Storyboard, Storyboard Gen, AI Video, Video Result, Novel Input, Video Analysis
- **7 AI Image Models** across 4 providers (KIE, FAL, GRSAI, PPIO)
- **5 AI Video Models** across 3 providers (Kling 3.0, Sora2, VEO 3)
- **Built-in Tools** — Crop, Annotate, Storyboard Split
- **User Authentication** — Email and Google sign-in via Supabase
- **Project Dashboard** — Create, rename, delete, and manage projects
- **Auto-Save** — Dual-write to cloud and local storage with conflict detection
- **BYOK API Key Management** — Encrypted storage for 6 AI providers
- **23+ API Endpoints** — AI generation, image processing, projects, templates, settings
- **Bilingual Interface** — Full Chinese and English support
- **CI/CD Pipeline** — Automated testing and deployment via GitHub Actions

### Fixed
- Canvas initialization and provider wrapping
- Authentication flow and middleware routing
- Dashboard display timing issues

---

### Maintenance Guidelines

When updating this project, add entries under `[Unreleased]`:
- **Added** — New features
- **Changed** — Changes to existing features
- **Fixed** — Bug fixes
- **Removed** — Removed features
- **Security** — Security-related changes

Move entries to a versioned section when releasing a new version.
