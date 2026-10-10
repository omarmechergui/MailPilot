'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCampaign, getCampaignStatus } from '../../../lib/api/campaigns';
import { useAuth } from '../../context/AuthContext';

export default function CampaignStatusPage() {
  const params = useParams();
  const id = params?.id;
  
  const { admin, loading } = useAuth();
  const router = useRouter();

  const [campaign, setCampaign] = useState(null);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !admin) {
      router.push('/login');
    }
  }, [admin, loading, router]);

  const loadData = async () => {
    try {
      const [campRes, statRes] = await Promise.all([
        getCampaign(id),
        getCampaignStatus(id)
      ]);
      setCampaign(campRes.data);
      setStatus(statRes.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (admin && id) {
      loadData();
    }
  }, [admin, id]);

  // Poll for status updates if campaign is sending
  useEffect(() => {
    if (status?.status === 'SENDING' && !fetching) {
      const interval = setInterval(() => {
        getCampaignStatus(id)
          .then(res => setStatus(res.data))
          .catch(console.error);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [status?.status, fetching, id]);

  if (loading || fetching) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="text-slate-500">Loading...</div></div>;
  if (!admin || !campaign || !status) return null;

  const total = status.totalRecipients || 1;
  const processed = status.accepted + status.failed + status.skipped + status.unknown;
  const percent = Math.round((processed / total) * 100) || 0;

  const renderStatusBadge = (s) => {
    let colors = 'bg-slate-100 text-slate-700';
    if (s === 'SENDING') colors = 'bg-blue-100 text-blue-700';
    else if (s === 'COMPLETED') colors = 'bg-green-100 text-green-700';
    else if (s === 'COMPLETED_WITH_FAILURES') colors = 'bg-amber-100 text-amber-700';
    else if (s === 'FAILED') colors = 'bg-red-100 text-red-700';
    
    return <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${colors}`}>{s}</span>;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6">
              <Link href="/" className="text-xl font-bold text-slate-900">MailPilot</Link>
              <nav className="hidden sm:flex items-center gap-4">
                <Link href="/" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Dashboard</Link>
                <Link href="/campaigns" className="text-sm font-medium text-blue-600">Campaigns</Link>
                <Link href="/templates" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Templates</Link>
                <Link href="/segments" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Segments</Link>
                <Link href="/contacts" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Contacts</Link>
              </nav>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">{error}</div>}
          
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">{campaign.name}</h1>
              <p className="text-sm text-slate-500 mb-4">Subject: {campaign.subject}</p>
            </div>
            <div>
              {renderStatusBadge(status.status)}
            </div>
          </div>

          <div className="mb-8">
            <div className="flex justify-between text-sm font-medium text-slate-700 mb-2">
              <span>Sending Progress</span>
              <span>{percent}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div 
                className={`h-full ${status.status === 'FAILED' ? 'bg-red-500' : 'bg-blue-600'} transition-all duration-500`} 
                style={{ width: `${percent}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-2">
              <span>{processed} of {total} processed</span>
              {status.startedAt && <span>Started: {new Date(status.startedAt).toLocaleString()}</span>}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <div className="text-sm text-slate-500 mb-1">Pending</div>
              <div className="text-2xl font-bold text-slate-900">{status.pending}</div>
            </div>
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <div className="text-sm text-slate-500 mb-1">Accepted by SMTP</div>
              <div className="text-2xl font-bold text-green-600">{status.accepted}</div>
            </div>
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <div className="text-sm text-slate-500 mb-1">Failed</div>
              <div className="text-2xl font-bold text-red-600">{status.failed}</div>
            </div>
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <div className="text-sm text-slate-500 mb-1">Skipped</div>
              <div className="text-2xl font-bold text-amber-600">{status.skipped}</div>
            </div>
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <div className="text-sm text-slate-500 mb-1">Unknown / Timeout</div>
              <div className="text-2xl font-bold text-slate-600">{status.unknown}</div>
            </div>
          </div>
          
          <div className="mt-8 border-t border-slate-200 pt-6">
             <h3 className="text-lg font-medium text-slate-900 mb-4">Note on Delivery</h3>
             <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-200">
               "Accepted by SMTP" means the mail server successfully accepted the message for delivery. It does not guarantee that the message reached the recipient's inbox. Hard bounces and spam filter rejections may occur after acceptance.
             </p>
          </div>
        </div>
      </main>
    </div>
  );
}
