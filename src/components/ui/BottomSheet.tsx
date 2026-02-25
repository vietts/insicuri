'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

export function BottomSheet({ open, onClose, children, title }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/40 z-40 transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      />
      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 max-h-[85vh] overflow-y-auto',
          open ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
        {title && (
          <div className="px-5 pb-3 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
        )}
        <div className="px-5 py-4">
          {children}
        </div>
      </div>
    </>
  );
}
