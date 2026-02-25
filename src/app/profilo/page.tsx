'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase';
import type { Profile, Report } from '@/types';
import { ReportCard } from '@/components/reports/ReportCard';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export default function ProfiloPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/accedi');
      return;
    }

    const supabase = createClient();
    async function load() {
      const [profileRes, reportsRes] = await Promise.all([
        supabase.from('insicuri_profiles').select('*').eq('id', user!.id).single(),
        supabase
          .from('insicuri_reports')
          .select('*')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      if (profileRes.data) setProfile(profileRes.data as Profile);
      if (reportsRes.data) setReports(reportsRes.data as Report[]);
      setLoading(false);
    }

    load();
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/" className="text-gray-500 hover:text-gray-700">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-lg font-semibold text-gray-900">Profilo</h1>
      </div>

      {/* Profile card */}
      <div className="bg-white px-4 py-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-red-600 font-bold text-lg">
              {(profile?.display_name ?? user?.email ?? '?')[0].toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{profile?.display_name ?? 'Utente'}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl px-4 py-3 text-center">
          <p className="text-2xl font-bold text-gray-900">{profile?.reports_count ?? 0}</p>
          <p className="text-sm text-gray-500">segnalazioni</p>
        </div>
      </div>

      {/* Recent reports */}
      <div className="px-4 py-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Le tue segnalazioni</h2>
        {reports.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Nessuna segnalazione ancora</p>
        ) : (
          reports.map((report) => <ReportCard key={report.id} report={report} />)
        )}
      </div>

      {/* Logout */}
      <div className="px-4 pb-8">
        <Button
          variant="ghost"
          className="w-full text-red-600"
          onClick={async () => {
            await signOut();
            router.push('/');
          }}
        >
          Esci
        </Button>
      </div>
    </div>
  );
}
