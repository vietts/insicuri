import { cn } from '@/lib/utils';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className, id, ...props }: InputProps) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          'w-full px-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition',
          className
        )}
        {...props}
      />
    </div>
  );
}
