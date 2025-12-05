'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import Button from '@/components/ui/Button';

export default function AdminCollectionsPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Collections</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Organize photos into collections
            </p>
          </div>

          <Button variant="primary">
            + New Collection
          </Button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            Collections grid will be implemented here
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
