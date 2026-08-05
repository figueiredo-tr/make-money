'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import Sidebar from '@/components/Sidebar';

export default function AppLayout({ children }) {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login');
    }
  }, [loading, session, router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="eyebrow">Carregando…</p>
      </main>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 relative z-[1]">{children}</main>
    </div>
  );
}
