'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="text-center p-6">
        <p className="text-gray-600 mb-4">Devi accedere per continuare</p>
        <button
          onClick={() => router.push('/accedi')}
          className="px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition"
        >
          Accedi
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
