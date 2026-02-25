import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-xl transition-colors disabled:opacity-50 disabled:pointer-events-none',
        variant === 'primary' && 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
        variant === 'secondary' && 'bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300',
        variant === 'ghost' && 'text-gray-700 hover:bg-gray-100',
        size === 'sm' && 'px-3 py-1.5 text-sm',
        size === 'md' && 'px-4 py-2.5 text-sm',
        size === 'lg' && 'px-6 py-3 text-base',
        className
      )}
      {...props}
    />
  );
}
