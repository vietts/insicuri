'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ToastMessage {
  id: number;
  text: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextType {
  toast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType>({
  toast: () => {},
});

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const toast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = nextId++;
    setMessages((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 left-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'px-4 py-3 rounded-xl text-sm font-medium shadow-lg pointer-events-auto animate-slide-down',
              msg.type === 'success' && 'bg-green-600 text-white',
              msg.type === 'error' && 'bg-red-600 text-white',
              msg.type === 'info' && 'bg-gray-800 text-white'
            )}
          >
            {msg.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
