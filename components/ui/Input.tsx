import React from 'react';
import { field, label as labelClass } from '@/components/admin/ui';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({
  label,
  error,
  className = '',
  ...props
}: InputProps) {
  return (
    <div className="w-full">
      {label && <label className={labelClass}>{label}</label>}
      <input
        className={`${field} ${error ? '!border-red-500 focus:!ring-red-500/20' : ''} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
