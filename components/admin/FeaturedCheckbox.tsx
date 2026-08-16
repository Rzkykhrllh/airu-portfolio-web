'use client';

interface FeaturedCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/** "Featured (Photographer's Pick)" checkbox shared by the Add/Edit photo forms. */
export default function FeaturedCheckbox({ checked, onChange }: FeaturedCheckboxProps) {
  return (
    <div>
      <label className="flex items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
        />
        <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Featured (Photographer&apos;s Pick)
        </span>
      </label>
    </div>
  );
}
