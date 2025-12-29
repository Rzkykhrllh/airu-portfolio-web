'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import AdminLayout from '@/components/admin/AdminLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import TagInput from '@/components/admin/TagInput';
import { uploadPhoto, getCollections } from '@/lib/api';
import { PhotoFormData, Collection } from '@/types';
import { useToast } from '@/components/providers/ToastProvider';
import exifr from 'exifr';

export default function UploadPhotoPage() {
  const router = useRouter();
  const toast = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoadingCollections, setIsLoadingCollections] = useState(true);

  // Form state
  const [formData, setFormData] = useState<PhotoFormData>({
    title: '',
    description: '',
    location: '',
    tags: [],
    collections: [],
    featured: false,
    visibility: 'PUBLIC',
    capturedAt: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
    exif: {
      camera: 'Fujifilm X-S20', // Default camera
      lens: '',
      aperture: '',
      shutter: '',
      iso: '',
    },
  });

  // Fetch collections on mount
  useEffect(() => {
    const loadCollections = async () => {
      try {
        const data = await getCollections();
        setCollections(data);
      } catch (error) {
        console.error('Failed to load collections:', error);
        toast.error('Failed to load collections');
      } finally {
        setIsLoadingCollections(false);
      }
    };

    loadCollections();
  }, [toast]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    // Extract image dimensions (always works)
    const img = new window.Image();
    img.onload = async () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      const aspectRatio = height / width;

      try {
        // Try to extract EXIF data
        const exifData = await exifr.parse(file);

        console.log('Raw EXIF data:', exifData);

        // Format capture date
        let capturedDate = '';
        if (exifData?.DateTimeOriginal) {
          capturedDate = new Date(exifData.DateTimeOriginal).toISOString().split('T')[0];
        } else if (exifData?.CreateDate) {
          capturedDate = new Date(exifData.CreateDate).toISOString().split('T')[0];
        } else if (exifData?.DateTime) {
          capturedDate = new Date(exifData.DateTime).toISOString().split('T')[0];
        }

        // Format camera name
        let camera = exifData?.Model || exifData?.Make || 'Fujifilm X-S20';

        // If camera is just the model (e.g., "X-S20"), prepend "Fujifilm"
        if (camera && /^X-[ST]\d+$/i.test(camera)) {
          camera = `Fujifilm ${camera.toUpperCase()}`;
        } else if (camera === 'X-S20') {
          camera = 'Fujifilm X-S20';
        }

        // Format lens name
        const lens = exifData?.LensModel || exifData?.Lens || '';

        // Format aperture (f/number)
        const aperture = exifData?.FNumber ? `f/${exifData.FNumber}` : '';

        // Format shutter speed
        let shutter = '';
        if (exifData?.ExposureTime) {
          const exp = exifData.ExposureTime;
          shutter = exp < 1 ? `1/${Math.round(1/exp)}s` : `${exp}s`;
        }

        // Format ISO
        const iso = exifData?.ISO?.toString() || exifData?.ISOSpeedRatings?.toString() || '';

        // Auto-fill form data
        setFormData(prev => ({
          ...prev,
          title: prev.title || file.name.replace(/\.[^/.]+$/, ''),
          capturedAt: capturedDate || prev.capturedAt,
          exif: {
            camera: camera,
            lens: lens,
            aperture: aperture,
            shutter: shutter,
            iso: iso,
          },
        }));

        // Log extracted info
        console.log('Image info extracted:', {
          dimensions: `${width}x${height}`,
          aspectRatio: aspectRatio.toFixed(2),
          fileSize: (file.size / 1024 / 1024).toFixed(2) + ' MB',
          exif: {
            camera,
            lens,
            aperture,
            shutter,
            iso,
            capturedDate
          }
        });

        if (exifData && Object.keys(exifData).length > 0) {
          toast.success('Image info extracted successfully!');
        } else {
          toast.info('Image loaded (no EXIF data found)');
          // Still set defaults
          setFormData(prev => ({
            ...prev,
            title: prev.title || file.name.replace(/\.[^/.]+$/, ''),
          }));
        }
      } catch (error) {
        console.error('Failed to extract EXIF data:', error);
        toast.info('Image loaded (EXIF extraction failed)');

        // Fallback: still set preview and default values
        setFormData(prev => ({
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
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setSelectedFile(null);
    setPreview('');
  };

  const handleInputChange = (
    field: keyof PhotoFormData,
    value: string | boolean | string[]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleExifChange = (field: keyof PhotoFormData['exif'], value: string) => {
    setFormData(prev => ({
      ...prev,
      exif: { ...prev.exif, [field]: value },
    }));
  };

  const toggleCollection = (collection: string) => {
    setFormData(prev => ({
      ...prev,
      collections: prev.collections.includes(collection)
        ? prev.collections.filter(c => c !== collection)
        : [...prev.collections, collection],
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
      await uploadPhoto(selectedFile, formData);
      toast.success('Photo uploaded successfully!');
      router.push('/admin/photos');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Upload Photo</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Add a new photo to your portfolio
          </p>
        </div>

        <form onSubmit={handleUpload} className="space-y-6">
          {/* File Input */}
          {!selectedFile ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-12">
              <div className="text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <div className="mt-4">
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Click to browse
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                    or drag and drop a photo here
                  </p>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  PNG, JPG, GIF up to 10MB
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Image Preview */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-start gap-4">
                  <div className="relative w-32 h-32 flex-shrink-0 bg-gray-200 dark:bg-gray-800 rounded overflow-hidden">
                    <Image
                      src={preview}
                      alt="Preview"
                      fill
                      className="object-cover"
                      sizes="128px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={removeFile}
                      className="text-sm mt-3"
                    >
                      Change Photo
                    </Button>
                  </div>
                </div>
              </div>

              {/* Basic Information */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Basic Information
                </h2>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter photo title"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
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

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Location
                  </label>
                  <Input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="e.g., Tokyo, Japan"
                  />
                </div>

                {/* Captured Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Captured Date
                  </label>
                  <Input
                    type="date"
                    value={formData.capturedAt}
                    onChange={(e) => handleInputChange('capturedAt', e.target.value)}
                  />
                </div>

                {/* Featured */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={formData.featured}
                    onChange={(e) => handleInputChange('featured', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="featured" className="text-sm font-medium text-gray-900 dark:text-white">
                    Mark as featured photo
                  </label>
                </div>

                {/* Visibility */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Visibility
                  </label>
                  <select
                    value={formData.visibility}
                    onChange={(e) => handleInputChange('visibility', e.target.value as 'PUBLIC' | 'COLLECTION_ONLY' | 'PRIVATE')}
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
              </div>

              {/* Tags */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Tags
                </label>
                <TagInput
                  tags={formData.tags}
                  onChange={(tags) => handleInputChange('tags', tags)}
                  placeholder="Add tag (e.g., street, portrait, landscape)"
                />
              </div>

              {/* Collections */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Collections
                </label>
                {isLoadingCollections ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400">Loading collections...</div>
                ) : collections.length === 0 ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400">No collections available</div>
                ) : (
                  <div className="space-y-2">
                    {collections.map((collection) => (
                      <div key={collection.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={collection.id}
                          checked={formData.collections.includes(collection.id)}
                          onChange={() => toggleCollection(collection.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <label htmlFor={collection.id} className="text-sm text-gray-900 dark:text-white">
                          {collection.title}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* EXIF Data */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  EXIF Data (Optional)
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Camera */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Camera
                    </label>
                    <Input
                      type="text"
                      value={formData.exif.camera}
                      onChange={(e) => handleExifChange('camera', e.target.value)}
                      placeholder="e.g., Sony A7III"
                    />
                  </div>

                  {/* Lens */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Lens
                    </label>
                    <Input
                      type="text"
                      value={formData.exif.lens}
                      onChange={(e) => handleExifChange('lens', e.target.value)}
                      placeholder="e.g., 50mm f/1.8"
                    />
                  </div>

                  {/* Aperture */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Aperture
                    </label>
                    <Input
                      type="text"
                      value={formData.exif.aperture}
                      onChange={(e) => handleExifChange('aperture', e.target.value)}
                      placeholder="e.g., f/2.8"
                    />
                  </div>

                  {/* Shutter Speed */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Shutter Speed
                    </label>
                    <Input
                      type="text"
                      value={formData.exif.shutter}
                      onChange={(e) => handleExifChange('shutter', e.target.value)}
                      placeholder="e.g., 1/250s"
                    />
                  </div>

                  {/* ISO */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      ISO
                    </label>
                    <Input
                      type="text"
                      value={formData.exif.iso}
                      onChange={(e) => handleExifChange('iso', e.target.value)}
                      placeholder="e.g., 400"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/admin/photos')}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload Photo'}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
