'use client';

import { useAuth } from './context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const { admin, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !admin) {
      router.push('/login');
    }
  }, [admin, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Loading MailPilot...</div>
      </div>
    );
  }

  if (!admin) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6">
              <Link href="/" className="text-xl font-bold text-slate-900 hover:text-blue-600 transition-colors">MailPilot</Link>
              <nav className="hidden sm:flex items-center gap-4">
                <Link href="/" className="text-sm font-medium text-blue-600">Dashboard</Link>
                <Link href="/campaigns" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Campaigns</Link>
                <Link href="/templates" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Templates</Link>
                <Link href="/segments" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Segments</Link>
                <Link href="/contacts" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Contacts</Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500 hidden sm:inline">{admin.email}</span>
              <button
                onClick={logout}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <a href="/contacts" className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 block hover:border-blue-300 hover:shadow-md transition-all">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Manage Contacts</h3>
            <p className="text-slate-500 text-sm">Add, import, edit, and filter your mailing list subscribers.</p>
          </a>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">Welcome to MailPilot</h2>
          <p className="text-slate-500">
            Phase 4 Contacts is complete. Campaigns are coming next.
          </p>
        </div>
      </main>
    </div>
  );
}
