'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Button from '@/components/ui/Button';
import { CoverCrop, Photo } from '@/types';
import { cropImageStyle, maxCropSize } from '@/lib/coverCrop';
import { iconButton } from './ui';

interface CoverCropEditorProps {
  photo: Photo;
  /** Existing crop for this photo, if any. */
  initial: CoverCrop | null;
  onCancel: () => void;
  /** Save the crop (null = back to the default centre crop). */
  onSave: (crop: CoverCrop | null) => Promise<void>;
}

type Rect = { x: number; y: number; w: number; h: number };

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const MAX_ZOOM = 4;

/**
 * Crop the collection cover to the 3:2 card frame: drag the box to move it,
 * slider (or wheel) to zoom, live preview of the card on the right. The crop
 * is stored as a rectangle in % of the original image, so it renders the same
 * at every size.
 */
export default function CoverCropEditor({ photo, initial, onCancel, onSave }: CoverCropEditorProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [max, setMax] = useState<{ w: number; h: number } | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const [saving, setSaving] = useState(false);
  const drag = useRef<{ startX: number; startY: number; rect: Rect } | null>(null);

  const zoom = rect && max ? max.w / rect.w : 1;

  const centred = useCallback((m: { w: number; h: number }, z = 1): Rect => {
    const w = m.w / z;
    const h = m.h / z;
    return { x: (100 - w) / 2, y: (100 - h) / 2, w, h };
  }, []);

  const handleLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    const m = maxCropSize(img.naturalWidth, img.naturalHeight);
    setMax(m);
    if (initial && initial.photoId === photo.id) {
      setRect({ x: initial.x, y: initial.y, w: initial.w, h: initial.h });
    } else {
      setRect(centred(m));
    }
  };

  // Zoom around the current centre of the box.
  const setZoom = (z: number) => {
    if (!rect || !max) return;
    const nz = clamp(z, 1, MAX_ZOOM);
    const w = max.w / nz;
    const h = max.h / nz;
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h / 2;
    setRect({ w, h, x: clamp(cx - w / 2, 0, 100 - w), y: clamp(cy - h / 2, 0, 100 - h) });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!rect) return;
    e.preventDefault();
    drag.current = { startX: e.clientX, startY: e.clientY, rect };
    // Keep receiving moves when the pointer leaves the box mid-drag.
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // capture is a nicety; dragging still works without it
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    const img = imgRef.current;
    if (!d || !img) return;
    const box = img.getBoundingClientRect();
    const dx = ((e.clientX - d.startX) / box.width) * 100;
    const dy = ((e.clientY - d.startY) / box.height) * 100;
    setRect({
      ...d.rect,
      x: clamp(d.rect.x + dx, 0, 100 - d.rect.w),
      y: clamp(d.rect.y + dy, 0, 100 - d.rect.h),
    });
  };

  const onPointerUp = () => {
    drag.current = null;
  };

  // Esc cancels.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const handleSave = async () => {
    if (!rect) return;
    setSaving(true);
    try {
      const round = (n: number) => Math.round(n * 100) / 100;
      await onSave({ photoId: photo.id, x: round(rect.x), y: round(rect.y), w: round(rect.w), h: round(rect.h) });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (max) setRect(centred(max));
  };

  const previewStyle = rect ? cropImageStyle({ photoId: photo.id, ...rect }) : undefined;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onCancel}>
      <div
        className="w-full max-w-6xl max-h-[94vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/80 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">Adjust cover</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Drag the frame to choose what shows on the collection card. Zoom to crop tighter.
            </p>
          </div>
          <button type="button" onClick={onCancel} className={iconButton} aria-label="Close">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6 p-6">
          {/* Editor */}
          <div className="flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-950 p-4 min-h-[300px]">
            <div
              className="relative inline-block overflow-hidden select-none touch-none"
              onWheel={(e) => setZoom(zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08))}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={photo.src.medium}
                alt={photo.title || 'Cover photo'}
                onLoad={handleLoad}
                draggable={false}
                className="block max-h-[60vh] w-auto max-w-full"
              />
              {rect && (
                <div
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  className="absolute cursor-move ring-2 ring-white shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]"
                  style={{ left: `${rect.x}%`, top: `${rect.y}%`, width: `${rect.w}%`, height: `${rect.h}%` }}
                >
                  {/* rule-of-thirds guides */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute left-1/3 inset-y-0 w-px bg-white/40" />
                    <div className="absolute left-2/3 inset-y-0 w-px bg-white/40" />
                    <div className="absolute top-1/3 inset-x-0 h-px bg-white/40" />
                    <div className="absolute top-2/3 inset-x-0 h-px bg-white/40" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Controls + preview */}
          <div className="space-y-6">
            <div>
              <p className="text-[0.6875rem] uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400 mb-2">Preview</p>
              <div className="relative aspect-[3/2] overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {previewStyle && <img src={photo.src.medium} alt="" style={previewStyle} draggable={false} />}
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">How the card looks on /collections.</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[0.6875rem] uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">Zoom</p>
                <span className="text-xs tabular-nums text-gray-500">{zoom.toFixed(1)}×</span>
              </div>
              <input
                type="range"
                min={1}
                max={MAX_ZOOM}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                disabled={!rect}
                className="w-full accent-gray-900 dark:accent-white"
                aria-label="Zoom"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <Button type="button" variant="ghost" size="sm" onClick={handleReset} disabled={!rect || saving}>
                Reset to centre
              </Button>
              {initial && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={saving}
                  onClick={async () => {
                    setSaving(true);
                    try {
                      await onSave(null);
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  Remove custom crop
                </Button>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSave} disabled={!rect || saving}>
                {saving ? 'Saving…' : 'Save cover'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
