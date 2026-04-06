'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  FolderOpen,
  BookOpen,
  Film,
  Images,
  Sparkles,
  Globe,
  ArrowRight,
  Clock,
  Layers,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Project {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

// ---------- Helpers ----------

function formatRelativeTime(dateStr: string, t: (key: string) => string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return t('dashboard.justNow');
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

/** Generate a unique gradient pair from a string hash */
function projectGradient(id: string): [string, string] {
  const gradients: [string, string][] = [
    ['#6366f1', '#a855f7'], // indigo → purple
    ['#3b82f6', '#06b6d4'], // blue → cyan
    ['#f43f5e', '#f97316'], // rose → orange
    ['#10b981', '#14b8a6'], // emerald → teal
    ['#8b5cf6', '#ec4899'], // violet → pink
    ['#f59e0b', '#ef4444'], // amber → red
    ['#06b6d4', '#3b82f6'], // cyan → blue
    ['#84cc16', '#22c55e'], // lime → green
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return gradients[Math.abs(hash) % gradients.length];
}

// ---------- Template illustrations (inline SVG) ----------

function NovelToStoryboardIllustration() {
  return (
    <svg viewBox="0 0 120 80" fill="none" className="h-full w-full">
      {/* Book */}
      <rect x="8" y="16" width="32" height="48" rx="3" fill="#818cf8" opacity="0.2" />
      <rect x="10" y="18" width="28" height="44" rx="2" fill="#818cf8" opacity="0.35" />
      <line x1="16" y1="28" x2="32" y2="28" stroke="#c7d2fe" strokeWidth="2" strokeLinecap="round" />
      <line x1="16" y1="34" x2="30" y2="34" stroke="#c7d2fe" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="16" y1="40" x2="28" y2="40" stroke="#c7d2fe" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="16" y1="46" x2="31" y2="46" stroke="#c7d2fe" strokeWidth="1.5" strokeLinecap="round" />
      {/* Arrow */}
      <path d="M48 40 L62 40" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" markerEnd="url(#arrowN)" />
      <defs><marker id="arrowN" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6Z" fill="#a78bfa" /></marker></defs>
      {/* Storyboard frames */}
      <rect x="70" y="14" width="20" height="16" rx="2" fill="#c084fc" opacity="0.5" />
      <rect x="94" y="14" width="20" height="16" rx="2" fill="#a78bfa" opacity="0.4" />
      <rect x="70" y="34" width="20" height="16" rx="2" fill="#a78bfa" opacity="0.4" />
      <rect x="94" y="34" width="20" height="16" rx="2" fill="#c084fc" opacity="0.5" />
      <rect x="70" y="54" width="20" height="16" rx="2" fill="#c084fc" opacity="0.3" />
      <rect x="94" y="54" width="20" height="16" rx="2" fill="#a78bfa" opacity="0.3" />
    </svg>
  );
}

function VideoRebuildIllustration() {
  return (
    <svg viewBox="0 0 120 80" fill="none" className="h-full w-full">
      {/* Film strip */}
      <rect x="8" y="20" width="36" height="40" rx="3" fill="#38bdf8" opacity="0.2" />
      <rect x="12" y="24" width="28" height="32" rx="2" fill="#38bdf8" opacity="0.3" />
      {/* Play button */}
      <circle cx="26" cy="40" r="10" fill="#38bdf8" opacity="0.4" />
      <path d="M23 34 L31 40 L23 46Z" fill="#e0f2fe" />
      {/* Arrow */}
      <path d="M50 40 L64 40" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" markerEnd="url(#arrowV)" />
      <defs><marker id="arrowV" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6Z" fill="#38bdf8" /></marker></defs>
      {/* Keyframes */}
      <rect x="72" y="16" width="16" height="12" rx="2" fill="#7dd3fc" opacity="0.5" />
      <rect x="92" y="16" width="16" height="12" rx="2" fill="#38bdf8" opacity="0.4" />
      <rect x="72" y="34" width="16" height="12" rx="2" fill="#38bdf8" opacity="0.4" />
      <rect x="92" y="34" width="16" height="12" rx="2" fill="#7dd3fc" opacity="0.5" />
      <rect x="72" y="52" width="16" height="12" rx="2" fill="#7dd3fc" opacity="0.3" />
      <rect x="92" y="52" width="16" height="12" rx="2" fill="#38bdf8" opacity="0.3" />
    </svg>
  );
}

function BatchImageGenIllustration() {
  return (
    <svg viewBox="0 0 120 80" fill="none" className="h-full w-full">
      {/* Sparkle / AI */}
      <circle cx="28" cy="36" r="16" fill="#f472b6" opacity="0.15" />
      <path d="M28 22 L30 30 L38 28 L30 32 L32 40 L28 34 L20 38 L26 32 L18 28 L26 30Z" fill="#f472b6" opacity="0.6" />
      {/* Arrow */}
      <path d="M50 40 L64 40" stroke="#f472b6" strokeWidth="2" strokeLinecap="round" markerEnd="url(#arrowB)" />
      <defs><marker id="arrowB" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6Z" fill="#f472b6" /></marker></defs>
      {/* Image grid */}
      <rect x="70" y="10" width="18" height="14" rx="2" fill="#fb923c" opacity="0.4" />
      <rect x="92" y="10" width="18" height="14" rx="2" fill="#f472b6" opacity="0.4" />
      <rect x="70" y="28" width="18" height="14" rx="2" fill="#f472b6" opacity="0.5" />
      <rect x="92" y="28" width="18" height="14" rx="2" fill="#fb923c" opacity="0.3" />
      <rect x="70" y="46" width="18" height="14" rx="2" fill="#fb923c" opacity="0.3" />
      <rect x="92" y="46" width="18" height="14" rx="2" fill="#f472b6" opacity="0.35" />
      <rect x="70" y="64" width="18" height="6" rx="1" fill="#f472b6" opacity="0.2" />
      <rect x="92" y="64" width="18" height="6" rx="1" fill="#fb923c" opacity="0.2" />
    </svg>
  );
}

// ---------- Template Card (dashboard version) ----------

interface TemplateShortcutProps {
  icon: React.ReactNode;
  lucideIcon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  accentClass: string;
}

function TemplateShortcut({ icon, lucideIcon, title, description, onClick, accentClass }: TemplateShortcutProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-foreground/8 bg-foreground/[0.03] transition-all hover:border-foreground/15 hover:bg-foreground/[0.06] hover:shadow-lg hover:shadow-black/10`}
    >
      {/* Illustration area */}
      <div className="relative h-28 w-full overflow-hidden">
        <div className="absolute inset-0 opacity-80 transition-opacity group-hover:opacity-100">
          {icon}
        </div>
      </div>
      {/* Text content */}
      <div className="flex flex-1 flex-col gap-1.5 px-4 pb-4 pt-2 text-left">
        <div className="flex items-center gap-2">
          <span className={`flex h-6 w-6 items-center justify-center rounded-md ${accentClass}`}>
            {lucideIcon}
          </span>
          <span className="text-sm font-semibold text-foreground">{title}</span>
        </div>
        <p className="text-xs leading-relaxed text-foreground/50">{description}</p>
      </div>
    </button>
  );
}

// ---------- Project Card ----------

interface ProjectCardProps {
  project: Project;
  onOpen: () => void;
  onDelete: () => void;
  onRename: (name: string) => void;
}

function ProjectCard({ project, onOpen, onDelete, onRename }: ProjectCardProps) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [nameValue, setNameValue] = useState(project.name);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [gradFrom, gradTo] = useMemo(() => projectGradient(project.id), [project.id]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (renaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [renaming]);

  function handleRenameSubmit() {
    const trimmed = nameValue.trim();
    if (trimmed && trimmed !== project.name) {
      onRename(trimmed);
    }
    setRenaming(false);
  }

  return (
    <div
      data-testid="project-card"
      className="group relative flex flex-col overflow-hidden rounded-xl border border-foreground/10 bg-foreground/[0.04] transition-all hover:border-foreground/20 hover:bg-foreground/[0.07] hover:shadow-lg hover:shadow-black/10"
    >
      {/* Thumbnail — gradient with project initial */}
      <div
        className="relative flex h-36 cursor-pointer items-center justify-center"
        onClick={onOpen}
      >
        <div
          className="absolute inset-0 opacity-25 transition-opacity group-hover:opacity-35"
          style={{
            background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})`,
          }}
        />
        {/* Project initial large */}
        <span
          className="relative text-4xl font-bold opacity-30 transition-opacity group-hover:opacity-50"
          style={{ color: gradFrom }}
        >
          {project.name.charAt(0).toUpperCase()}
        </span>
        {/* Decorative node dots */}
        <div className="absolute bottom-3 left-3 flex gap-1.5">
          <div className="h-2 w-2 rounded-full" style={{ background: gradFrom, opacity: 0.4 }} />
          <div className="h-2 w-2 rounded-full" style={{ background: gradTo, opacity: 0.3 }} />
          <div className="h-2 w-2 rounded-full" style={{ background: gradFrom, opacity: 0.2 }} />
        </div>
      </div>

      {/* Info area */}
      <div className="flex flex-col gap-1 px-3.5 pb-3.5 pt-3">
        {/* Name row */}
        <div className="flex items-center justify-between gap-2">
          {renaming ? (
            <input
              ref={inputRef}
              className="flex-1 rounded border border-foreground/20 bg-background px-2 py-0.5 text-sm text-foreground outline-none"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameSubmit();
                if (e.key === 'Escape') { setNameValue(project.name); setRenaming(false); }
              }}
            />
          ) : (
            <span
              className="flex-1 cursor-pointer truncate text-sm font-medium text-foreground"
              onClick={onOpen}
            >
              {project.name}
            </span>
          )}

          {/* Context menu */}
          <div ref={menuRef} className="relative">
            <button
              className="flex h-6 w-6 items-center justify-center rounded text-foreground/30 opacity-0 transition-all group-hover:opacity-100 hover:bg-foreground/10 hover:text-foreground/70"
              onClick={() => setMenuOpen((v) => !v)}
              type="button"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-7 z-10 min-w-[140px] rounded-lg border border-foreground/10 bg-background py-1 shadow-xl">
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-foreground/5"
                  onClick={() => { setMenuOpen(false); onOpen(); }}
                  type="button"
                >
                  <FolderOpen className="h-3.5 w-3.5 text-foreground/50" />
                  {t('dashboard.openCanvas')}
                </button>
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-foreground/5"
                  onClick={() => { setMenuOpen(false); setRenaming(true); }}
                  type="button"
                >
                  <Pencil className="h-3.5 w-3.5 text-foreground/50" />
                  {t('dashboard.renameProject')}
                </button>
                <div className="my-1 border-t border-foreground/10" />
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10"
                  onClick={() => { setMenuOpen(false); onDelete(); }}
                  type="button"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t('dashboard.deleteProject')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Timestamp */}
        <div className="flex items-center gap-1 text-xs text-foreground/35">
          <Clock className="h-3 w-3" />
          <span>{formatRelativeTime(project.updated_at, t)}</span>
        </div>
      </div>
    </div>
  );
}

// ---------- Main Dashboard ----------

export default function DashboardPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  const loadProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json() as Project[];
      setProjects(data);
    } catch {
      setError(t('dashboard.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: t('dashboard.projectNamePlaceholder') }),
      });
      if (!res.ok) throw new Error('Failed to create');
      const project = await res.json() as Project;
      router.push(`/canvas/${project.id}`);
    } catch {
      setError(t('dashboard.createError'));
      setCreating(false);
    }
  }

  async function handleDelete(project: Project) {
    await fetch(`/api/projects/${project.id}`, { method: 'DELETE' });
    setProjects((prev) => prev.filter((p) => p.id !== project.id));
    setDeleteTarget(null);
  }

  async function handleCreateFromTemplate(_templateKey: string) {
    await handleCreate();
  }

  async function handleRename(project: Project, newName: string) {
    const res = await fetch(`/api/projects/${project.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName }),
    });
    if (res.ok) {
      setProjects((prev) =>
        prev.map((p) => (p.id === project.id ? { ...p, name: newName } : p))
      );
    }
  }

  const templateCards = [
    {
      key: 'novelToStoryboard',
      icon: <NovelToStoryboardIllustration />,
      lucideIcon: <BookOpen className="h-3.5 w-3.5 text-indigo-400" />,
      accentClass: 'bg-indigo-500/15',
    },
    {
      key: 'videoRebuild',
      icon: <VideoRebuildIllustration />,
      lucideIcon: <Film className="h-3.5 w-3.5 text-sky-400" />,
      accentClass: 'bg-sky-500/15',
    },
    {
      key: 'batchImageGen',
      icon: <BatchImageGenIllustration />,
      lucideIcon: <Images className="h-3.5 w-3.5 text-pink-400" />,
      accentClass: 'bg-pink-500/15',
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      {/* Error banner */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20 text-sm text-foreground/40">
          {t('common.loading')}
        </div>
      )}

      {!loading && (
        <>
          {/* ===== Templates Section ===== */}
          <section className="mb-10">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-5 w-5 text-foreground/50" />
                <h2 className="text-lg font-semibold text-foreground">
                  {t('dashboard.startCreating')}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => void handleCreateFromTemplate('blank')}
                className="flex items-center gap-1.5 rounded-lg text-sm text-foreground/50 transition-colors hover:text-foreground/80"
              >
                {t('dashboard.browseAllTemplates')}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Official template cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {templateCards.map((tpl) => (
                <TemplateShortcut
                  key={tpl.key}
                  icon={tpl.icon}
                  lucideIcon={tpl.lucideIcon}
                  title={t(`template.${tpl.key}`)}
                  description={t(`template.${tpl.key}Desc`)}
                  onClick={() => void handleCreateFromTemplate(tpl.key)}
                  accentClass={tpl.accentClass}
                />
              ))}
            </div>

            {/* Community banner */}
            <div className="mt-4 flex items-center justify-between rounded-xl border border-foreground/8 bg-foreground/[0.02] px-5 py-3.5">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-foreground/40" />
                <div>
                  <p className="text-sm font-medium text-foreground/70">
                    {t('dashboard.communityTitle')}
                  </p>
                  <p className="text-xs text-foreground/40">
                    {t('dashboard.communityDesc')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void handleCreateFromTemplate('community')}
                className="flex items-center gap-1.5 rounded-lg border border-foreground/10 bg-foreground/[0.04] px-3.5 py-1.5 text-xs font-medium text-foreground/60 transition-colors hover:border-foreground/20 hover:text-foreground"
              >
                {t('dashboard.exploreCommunity')}
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </section>

          {/* ===== Projects Section ===== */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Layers className="h-5 w-5 text-foreground/50" />
                <h2 className="text-lg font-semibold text-foreground">
                  {t('dashboard.title')}
                </h2>
                {projects.length > 0 && (
                  <span className="rounded-full bg-foreground/8 px-2 py-0.5 text-xs text-foreground/40">
                    {projects.length}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                data-testid="new-project-button"
                className="flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-80 disabled:opacity-50"
              >
                {creating ? (
                  t('dashboard.creating')
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    {t('dashboard.newProject')}
                  </>
                )}
              </button>
            </div>

            {/* Empty state */}
            {projects.length === 0 && !error && (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-foreground/15 py-20 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground/[0.06]">
                  <Layers className="h-7 w-7 text-foreground/25" />
                </div>
                <p className="text-sm text-foreground/40">{t('dashboard.empty')}</p>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={creating}
                  className="mt-4 flex items-center gap-2 rounded-lg border border-foreground/15 px-4 py-2 text-sm text-foreground/60 transition-colors hover:border-foreground/30 hover:text-foreground disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  {creating ? t('dashboard.creating') : t('dashboard.newProject')}
                </button>
              </div>
            )}

            {/* Project grid */}
            {projects.length > 0 && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onOpen={() => router.push(`/canvas/${project.id}`)}
                    onDelete={() => setDeleteTarget(project)}
                    onRename={(name) => void handleRename(project, name)}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-foreground/10 bg-background p-6 shadow-2xl">
            <h2 className="mb-2 text-base font-semibold text-foreground">
              {t('dashboard.deleteProject')}
            </h2>
            <p className="mb-6 text-sm text-foreground/60">
              {t('dashboard.deleteConfirm', { name: deleteTarget.name })}
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="rounded-lg border border-foreground/15 px-4 py-2 text-sm text-foreground/70 hover:bg-foreground/5"
                onClick={() => setDeleteTarget(null)}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
                onClick={() => void handleDelete(deleteTarget)}
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
