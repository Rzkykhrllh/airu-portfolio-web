import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

// Neutral, near-black primary (matches the public site) instead of stock blue.
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', children, className = '', ...props },
  ref
) {
  const baseStyles =
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/20 dark:focus-visible:ring-white/20 disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeStyles = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
  };

  const variantStyles = {
    primary:
      'bg-gray-900 hover:bg-gray-700 text-white dark:bg-white dark:hover:bg-gray-200 dark:text-gray-900',
    secondary:
      'bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 dark:bg-gray-900 dark:hover:bg-gray-800 dark:text-gray-100 dark:border-gray-700',
    ghost:
      'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };

  return (
    <button
      ref={ref}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});

export default Button;
