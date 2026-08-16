'use client';

import Input from '@/components/ui/Input';

export interface ExifValue {
  camera: string;
  lens: string;
  aperture: string;
  shutter: string;
  iso: string;
}

interface ExifFieldsProps {
  value: ExifValue;
  onChange: (field: keyof ExifValue, value: string) => void;
}

/** Camera/lens/aperture/shutter/ISO fields shared by the Add/Edit photo forms. */
export default function ExifFields({ value, onChange }: ExifFieldsProps) {
  return (
    <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">EXIF Data</h3>
      <div className="space-y-4">
        <Input
          label="Camera"
          value={value.camera}
          onChange={(e) => onChange('camera', e.target.value)}
          placeholder="e.g. Sony A7IV"
        />

        <Input
          label="Lens"
          value={value.lens}
          onChange={(e) => onChange('lens', e.target.value)}
          placeholder="e.g. 24-70mm f/2.8"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <Input
            label="Aperture"
            value={value.aperture}
            onChange={(e) => onChange('aperture', e.target.value)}
            placeholder="f/2.8"
          />

          <Input
            label="Shutter"
            value={value.shutter}
            onChange={(e) => onChange('shutter', e.target.value)}
            placeholder="1/250s"
          />

          <Input
            label="ISO"
            value={value.iso}
            onChange={(e) => onChange('iso', e.target.value)}
            placeholder="400"
          />
        </div>
      </div>
    </div>
  );
}
