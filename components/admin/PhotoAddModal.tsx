'use client';

import { useState, useEffect, FormEvent } from 'react';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import TagInput from '@/components/admin/TagInput';
import { uploadPhoto, getCollections } from '@/lib/api';
import { ApiError } from '@/lib/fetch';
import { PhotoFormData, Collection, Photo } from '@/types';
import { useToast } from '@/components/providers/ToastProvider';
import exifr from 'exifr';

interface PhotoAddModalProps {
  onClose: () => void;
  onUploaded: (photo: Photo) => void;
}

// Matches the backend's multer limit (upload.middleware.ts: fileSize: 50 * 1024 * 1024).
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
const MAX_FILE_SIZE_LABEL = '50MB';

export default function PhotoAddModal({ onClose, onUploaded }: PhotoAddModalProps) {
  const toast = useToast();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [availableCollections, setAvailableCollections] = useState<Collection[]>([]);
  const [isLoadingCollections, setIsLoadingCollections] = useState(true);

  const [formData, setFormData] = useState<PhotoFormData>({
    title: '',
    description: '',
    location: '',
    tags: [],
    collections: [],
    featured: false,
    visibility: 'PUBLIC',
    capturedAt: new Date().toISOString().split('T')[0],
    exif: {
      camera: 'Fujifilm X-S20',
      lens: '',
      aperture: '',
      shutter: '',
      iso: '',
    },
  });

  useEffect(() => {
    let cancelled = false;

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
  }, []);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleFile(file);
    // Allow re-selecting the same file after "Change Photo".
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingOver) setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please drop an image file.');
      return;
    }

    await handleFile(file);
  };

  const handleFile = async (file: File) => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(`"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)}MB, which is over the ${MAX_FILE_SIZE_LABEL} limit.`);
      return;
    }

    setSelectedFile(file);
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    const img = new window.Image();
    img.onload = async () => {
      try {
        const exifData = await exifr.parse(file);

        let capturedDate = '';
        if (exifData?.DateTimeOriginal) {
          capturedDate = new Date(exifData.DateTimeOriginal).toISOString().split('T')[0];
        } else if (exifData?.CreateDate) {
          capturedDate = new Date(exifData.CreateDate).toISOString().split('T')[0];
        } else if (exifData?.DateTime) {
          capturedDate = new Date(exifData.DateTime).toISOString().split('T')[0];
        }

        let camera = exifData?.Model || exifData?.Make || 'Fujifilm X-S20';
        if (camera && /^X-[ST]\d+$/i.test(camera)) {
          camera = `Fujifilm ${camera.toUpperCase()}`;
        } else if (camera === 'X-S20') {
          camera = 'Fujifilm X-S20';
        }

        const lens = exifData?.LensModel || exifData?.Lens || '';
        const aperture = exifData?.FNumber ? `f/${exifData.FNumber}` : '';

        let shutter = '';
        if (exifData?.ExposureTime) {
          const exp = exifData.ExposureTime;
          shutter = exp < 1 ? `1/${Math.round(1 / exp)}s` : `${exp}s`;
        }

        const iso = exifData?.ISO?.toString() || exifData?.ISOSpeedRatings?.toString() || '';

        setFormData((prev) => ({
          ...prev,
          title: prev.title || file.name.replace(/\.[^/.]+$/, ''),
          capturedAt: capturedDate || prev.capturedAt,
          exif: { camera, lens, aperture, shutter, iso },
        }));

        if (exifData && Object.keys(exifData).length > 0) {
          toast.success('Image info extracted successfully!');
        } else {
          toast.info('Image loaded (no EXIF data found)');
          setFormData((prev) => ({
            ...prev,
            title: prev.title || file.name.replace(/\.[^/.]+$/, ''),
          }));
        }
      } catch (error) {
        console.error('Failed to extract EXIF data:', error);
        toast.info('Image loaded (EXIF extraction failed)');
        setFormData((prev) => ({
          ...prev,
          title: prev.title || file.name.replace(/\.[^/.]+$/, ''),
        }));
      }
    };

    img.onerror = () => {
      toast.error('Failed to load image');
    };

    img.src = previewUrl;
  };

  const removeFile = () => {
    if (preview) URL.revokeObjectURL(preview);
    setSelectedFile(null);
    setPreview('');
  };

  const handleInputChange = (
    field: keyof PhotoFormData,
    value: string | boolean | string[]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleExifChange = (field: keyof PhotoFormData['exif'], value: string) => {
    setFormData((prev) => ({
      ...prev,
      exif: { ...prev.exif, [field]: value },
    }));
  };

  const toggleCollection = (collectionId: string) => {
    setFormData((prev) => ({
      ...prev,
      collections: prev.collections.includes(collectionId)
        ? prev.collections.filter((c) => c !== collectionId)
        : [...prev.collections, collectionId],
    }));
  };

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setIsUploading(true);

    try {
      const photo = await uploadPhoto(selectedFile, formData);
      toast.success('Photo uploaded successfully!');
      onUploaded(photo);
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(error instanceof ApiError ? error.message : 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Upload Photo</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form id="photo-add-form" onSubmit={handleUpload} className="p-6">
          {!selectedFile ? (
            <div
              onDragOver={handleDragOver}
              onDragEnter={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-12 transition-colors ${
                isDraggingOver
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              <div className="text-center pointer-events-none">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <div className="mt-4">
                  <label
                    htmlFor="add-modal-file-upload"
                    className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium pointer-events-auto"
                  >
                    Click to browse
                  </label>
                  <input
                    id="add-modal-file-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden pointer-events-auto"
                  />
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                    {isDraggingOver ? 'Drop to upload' : 'or drag and drop a photo here'}
                  </p>
                </div>
                <p className="text-xs text-gray-400 mt-2">PNG, JPG, GIF up to {MAX_FILE_SIZE_LABEL}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Photo Preview */}
              <div>
                <div className="sticky top-20 space-y-4">
                  <div className="relative w-full aspect-square bg-gray-200 dark:bg-gray-900 rounded-lg overflow-hidden">
                    <Image
                      src={preview}
                      alt="Preview"
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <Button type="button" variant="secondary" onClick={removeFile} className="text-sm mt-3">
                      Change Photo
                    </Button>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-6">
                <Input
                  label="Title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter photo title"
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Enter photo description"
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="e.g. Tokyo, Japan"
                  />

                  <Input
                    label="Date Captured"
                    type="date"
                    value={formData.capturedAt}
                    onChange={(e) => handleInputChange('capturedAt', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tags
                  </label>
                  <TagInput
                    tags={formData.tags}
                    onChange={(tags) => handleInputChange('tags', tags)}
                    placeholder="Add tag (e.g., street, portrait, landscape)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Collections
                  </label>
                  {isLoadingCollections ? (
                    <div className="text-sm text-gray-500 dark:text-gray-400">Loading collections...</div>
                  ) : availableCollections.length === 0 ? (
                    <div className="text-sm text-gray-500 dark:text-gray-400">No collections available</div>
                  ) : (
                    <div className="space-y-2">
                      {availableCollections.map((col) => (
                        <label key={col.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.collections.includes(col.id)}
                            onChange={() => toggleCollection(col.id)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{col.title}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => handleInputChange('featured', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Featured (Photographer's Pick)
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Visibility
                  </label>
                  <select
                    value={formData.visibility}
                    onChange={(e) =>
                      handleInputChange('visibility', e.target.value as 'PUBLIC' | 'COLLECTION_ONLY' | 'PRIVATE')
                    }
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PUBLIC">Public (Show everywhere)</option>
                    <option value="COLLECTION_ONLY">Collection Only (Not in gallery)</option>
                    <option value="PRIVATE">Private (Admin only)</option>
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formData.visibility === 'PUBLIC' && 'Visible in gallery, collections, and admin'}
                    {formData.visibility === 'COLLECTION_ONLY' && 'Visible in collections and admin only, not in main gallery'}
                    {formData.visibility === 'PRIVATE' && 'Only visible to admins, hidden from public'}
                  </p>
                </div>

                {/* EXIF Data */}
                <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">EXIF Data</h3>
                  <div className="space-y-4">
                    <Input
                      label="Camera"
                      value={formData.exif.camera}
                      onChange={(e) => handleExifChange('camera', e.target.value)}
                      placeholder="e.g. Sony A7IV"
                    />

                    <Input
                      label="Lens"
                      value={formData.exif.lens}
                      onChange={(e) => handleExifChange('lens', e.target.value)}
                      placeholder="e.g. 24-70mm f/2.8"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      <Input
                        label="Aperture"
                        value={formData.exif.aperture}
                        onChange={(e) => handleExifChange('aperture', e.target.value)}
                        placeholder="f/2.8"
                      />

                      <Input
                        label="Shutter"
                        value={formData.exif.shutter}
                        onChange={(e) => handleExifChange('shutter', e.target.value)}
                        placeholder="1/250s"
                      />

                      <Input
                        label="ISO"
                        value={formData.exif.iso}
                        onChange={(e) => handleExifChange('iso', e.target.value)}
                        placeholder="400"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>

        <div className="sticky bottom-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button type="submit" form="photo-add-form" variant="primary" disabled={!selectedFile || isUploading}>
            {isUploading ? 'Uploading...' : 'Upload Photo'}
          </Button>
        </div>
      </div>
    </div>
  );
}
