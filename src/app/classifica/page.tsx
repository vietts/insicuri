'use client';

import Link from 'next/link';
import { ClassificaClient } from '@/components/classifica/ClassificaClient';

export default function ClassificaPage() {
  return (
    <div className="min-h-dvh bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/" className="text-gray-500 hover:text-gray-700">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-lg font-semibold text-gray-900">Classifica Quartieri</h1>
      </div>

      {/* Content */}
      <div className="pt-4">
        <ClassificaClient />
      </div>
    </div>
  );
}
