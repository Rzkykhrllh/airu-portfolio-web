'use client';

import { useState, KeyboardEvent } from 'react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export default function TagInput({ tags, onChange, placeholder = 'Add tag...' }: TagInputProps) {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && input === '' && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
      setInput('');
    }
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-1.5 p-2 min-h-[2.5rem] border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus-within:border-gray-900 dark:focus-within:border-gray-300 focus-within:ring-2 focus-within:ring-gray-900/10 transition-colors">
        {tags.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 pl-2.5 pr-1.5 h-7 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs rounded-md"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="hover:text-red-600"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] px-1 outline-none bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400"
        />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        Press Enter or comma to add tag
      </p>
    </div>
  );
}
