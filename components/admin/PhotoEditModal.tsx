'use client';

import { useState, useEffect, FormEvent } from 'react';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import TagInput from '@/components/admin/TagInput';
import VisibilitySelect from '@/components/admin/VisibilitySelect';
import CollectionsChecklist from '@/components/admin/CollectionsChecklist';
import FeaturedCheckbox from '@/components/admin/FeaturedCheckbox';
import ExifFields, { ExifValue } from '@/components/admin/ExifFields';
import { getPhoto, updatePhoto, deletePhoto, getCollections } from '@/lib/api';
import { ApiError } from '@/lib/fetch';
import { Photo, Collection, PhotoVisibility } from '@/types';
import { useToast } from '@/components/providers/ToastProvider';
import { useConfirmDialog } from '@/components/providers/ConfirmDialogProvider';
import { useUndoDelete } from '@/components/providers/UndoDeleteProvider';

interface PhotoEditModalProps {
  photoId: string;
  onClose: () => void;
  onUpdated: (photo: Photo) => void;
  onDeleted: (photoId: string) => void;
}

export default function PhotoEditModal({ photoId, onClose, onUpdated, onDeleted }: PhotoEditModalProps) {
  const toast = useToast();
  const confirmDialog = useConfirmDialog();
  const undoDelete = useUndoDelete();

  const [photo, setPhoto] = useState<Photo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [availableCollections, setAvailableCollections] = useState<Collection[]>([]);
  const [isLoadingCollections, setIsLoadingCollections] = useState(true);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [collections, setCollections] = useState<string[]>([]);
  const [featured, setFeatured] = useState(false);
  const [visibility, setVisibility] = useState<PhotoVisibility>('PUBLIC');
  const [capturedAt, setCapturedAt] = useState('');
  const [exif, setExif] = useState<ExifValue>({ camera: '', lens: '', aperture: '', shutter: '', iso: '' });

  const handleExifChange = (field: keyof ExifValue, value: string) => {
    setExif((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      try {
        const data = await getPhoto(photoId);
        if (cancelled) return;
        if (data) {
          setPhoto(data);
          setTitle(data.title || '');
          setDescription(data.description || '');
          setLocation(data.location || '');
          setTags(data.tags || []);
          setCollections(data.collections.map((c) => c.id) || []);
          setFeatured(data.featured || false);
          setVisibility(data.visibility || 'PUBLIC');
          setCapturedAt(data.capturedAt || '');
          setExif({
            camera: data.exif?.camera || '',
            lens: data.exif?.lens || '',
            aperture: data.exif?.aperture || '',
            shutter: data.exif?.shutter || '',
            iso: data.exif?.iso?.toString() || '',
          });
        }
      } catch (error) {
        console.error('Failed to load photo:', error);
        if (!cancelled) toast.error(error instanceof ApiError ? error.message : 'Failed to load photo.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    (async () => {
      try {
        const data = await getCollections();
        if (!cancelled) setAvailableCollections(data);
      } catch (error) {
        console.error('Failed to load collections:', error);
        if (!cancelled) toast.error(error instanceof ApiError ? error.message : 'Failed to load collections');
      } finally {
        if (!cancelled) setIsLoadingCollections(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // `toast` (from context) is intentionally omitted — see the same note
    // in PhotoAddModal.tsx.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const updated = await updatePhoto(photoId, {
        title,
        description,
        location,
        tags,
        collections,
        featured,
        visibility,
        capturedAt,
        exif,
      });

      toast.success('Photo updated successfully!');
      onUpdated(updated);
    } catch (error) {
      console.error('Failed to update photo:', error);
      toast.error(error instanceof ApiError ? error.message : 'Failed to update photo. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirmDialog({
      title: 'Delete photo?',
      message: 'Are you sure you want to delete this photo? This action cannot be undone.',
      confirmLabel: 'Delete',
    });
    if (!ok) return;

    // Close right away — the modal doesn't need to stay open for the grace
    // period, the Undo toast (from UndoDeleteProvider, mounted above this
    // modal in the admin layout) survives the unmount just fine.
    onClose();
    undoDelete.requestDelete({
      key: photoId,
      message: `"${photo?.title || 'Untitled'}" deleted.`,
      commit: async () => {
        try {
          await deletePhoto(photoId);
          onDeleted(photoId);
        } catch (error) {
          console.error('Failed to delete photo:', error);
          toast.error(error instanceof ApiError ? error.message : 'Failed to delete photo. Please try again.');
        }
      },
      undo: () => toast.info('Delete cancelled.'),
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-7xl w-full max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200/80 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur">
          <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">Edit Photo</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isLoading || !photo ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Loading photo...</p>
          </div>
        ) : (
          <>
            <form id="photo-edit-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8 p-6">
              {/* Photo Preview */}
              <div>
                <div className="sticky top-20">
                  <div className="relative w-full h-[70vh] bg-gray-100 dark:bg-gray-950 rounded-xl overflow-hidden">
                    <Image
                      src={photo.src.full}
                      alt={photo.title || 'Photo'}
                      fill
                      className="object-contain"
                      sizes="(max-width: 1024px) 100vw, 60vw"
                    />
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-6">
                <Input
                  label="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter photo title"
                />

                <VisibilitySelect value={visibility} onChange={setVisibility} />

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter photo description"
                    rows={3}
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-gray-900 dark:focus:border-gray-300 focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Tokyo, Japan"
                  />

                  <Input
                    label="Date Captured"
                    type="date"
                    value={capturedAt ? capturedAt.split('T')[0] : ''}
                    onChange={(e) => setCapturedAt(e.target.value ? `${e.target.value}T00:00:00Z` : '')}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    Tags
                  </label>
                  <TagInput tags={tags} onChange={setTags} />
                </div>

                <CollectionsChecklist
                  collections={availableCollections}
                  isLoading={isLoadingCollections}
                  selectedIds={collections}
                  onChange={setCollections}
                />

                <FeaturedCheckbox checked={featured} onChange={setFeatured} />

                <ExifFields value={exif} onChange={handleExifChange} />
              </div>
            </form>

            <div className="sticky bottom-0 flex items-center justify-between px-6 py-4 border-t border-gray-200/80 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur">
              <Button type="button" variant="ghost" onClick={handleDelete} className="!text-red-600 hover:!bg-red-50 dark:hover:!bg-red-900/20">
                Delete photo
              </Button>
              <div className="flex items-center gap-3">
                <Button type="button" variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" form="photo-edit-form" variant="primary" disabled={isSaving}>
                  {isSaving ? 'Saving…' : 'Save changes'}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
