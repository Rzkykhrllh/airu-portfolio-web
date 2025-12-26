'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import AdminLayout from '@/components/admin/AdminLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import TagInput from '@/components/admin/TagInput';
import { uploadPhoto } from '@/lib/api';
import { PhotoFormData } from '@/types';

export default function UploadPhotoPage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  // Form state
  const [formData, setFormData] = useState<PhotoFormData>({
    title: '',
    description: '',
    location: '',
    tags: [],
    collections: [],
    featured: false,
    capturedAt: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
    exif: {
      camera: '',
      lens: '',
      aperture: '',
      shutter: '',
      iso: '',
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));

    // Auto-fill title from filename (without extension)
    if (!formData.title) {
      setFormData(prev => ({
        ...prev,
        title: file.name.replace(/\.[^/.]+$/, ''),
      }));
    }
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
      alert('Please select a file');
      return;
    }

    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }

    setIsUploading(true);

    try {
      await uploadPhoto(selectedFile, formData);
      alert('Photo uploaded successfully!');
      router.push('/admin/photos');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
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
                <div className="space-y-2">
                  {['tokyo-streets', 'portraits', 'landscapes', 'architecture'].map((collection) => (
                    <div key={collection} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={collection}
                        checked={formData.collections.includes(collection)}
                        onChange={() => toggleCollection(collection)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <label htmlFor={collection} className="text-sm text-gray-900 dark:text-white capitalize">
                        {collection.replace('-', ' ')}
                      </label>
                    </div>
                  ))}
                </div>
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
