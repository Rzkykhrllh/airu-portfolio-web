'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import AdminLayout from '@/components/admin/AdminLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { uploadPhoto } from '@/lib/api';
import { PhotoFormData } from '@/types';

export default function UploadPhotoPage() {
  const router = useRouter();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [defaultCollection, setDefaultCollection] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);

    // Create previews
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(newPreviews);
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);

    // Revoke object URL
    URL.revokeObjectURL(previews[index]);

    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
  };

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();

    if (selectedFiles.length === 0) {
      alert('Please select at least one file');
      return;
    }

    setIsUploading(true);

    try {
      // Upload each file
      for (const file of selectedFiles) {
        const formData: PhotoFormData = {
          title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
          description: '',
          location: '',
          tags: [],
          collections: defaultCollection ? [defaultCollection] : [],
          featured: false,
          capturedAt: new Date().toISOString(),
          exif: {
            camera: '',
            lens: '',
            aperture: '',
            shutter: '',
            iso: '',
          },
        };

        await uploadPhoto(file, formData);
      }

      alert(`Successfully uploaded ${selectedFiles.length} photo(s)`);
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Upload Photos</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Add new photos to your portfolio
          </p>
        </div>

        <form onSubmit={handleUpload} className="space-y-6">
          {/* File Input */}
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
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                  or drag and drop photos here
                </p>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                PNG, JPG, GIF up to 10MB
              </p>
            </div>
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
                Selected files ({selectedFiles.length})
              </h2>
              <div className="space-y-3">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                  >
                    {previews[index] && (
                      <div className="relative w-16 h-16 flex-shrink-0 bg-gray-200 dark:bg-gray-800 rounded overflow-hidden">
                        <Image
                          src={previews[index]}
                          alt={file.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => removeFile(index)}
                      className="text-sm"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Default Collection */}
          {selectedFiles.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Default collection (optional)
              </label>
              <select
                value={defaultCollection}
                onChange={(e) => setDefaultCollection(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">None</option>
                <option value="tokyo-streets">Tokyo Streets</option>
                <option value="portraits">Portraits</option>
                <option value="landscapes">Landscapes</option>
                <option value="architecture">Architecture</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                You can edit metadata and add to more collections after upload
              </p>
            </div>
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
              disabled={selectedFiles.length === 0 || isUploading}
            >
              {isUploading
                ? `Uploading ${selectedFiles.length} photo(s)...`
                : `Upload ${selectedFiles.length} photo(s)`}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
