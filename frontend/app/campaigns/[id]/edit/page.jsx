'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCampaign, updateCampaign, getEligibleContacts, getRecipients, addRecipients, removeRecipient, clearRecipients, sendCampaign } from '../../../../lib/api/campaigns';
import { fetchTemplates, getTemplate } from '../../../../lib/api/templates';
import { fetchSegments, applySegmentToCampaign } from '../../../../lib/api/segments';
import { useAuth } from '../../../context/AuthContext';

export default function EditCampaignPage() {
  const params = useParams();
  const id = params?.id;
  
  const { admin, loading } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({ name: '', subject: '', htmlContent: '', textContent: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [activeTab, setActiveTab] = useState('editor');

  const [eligibleContacts, setEligibleContacts] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedContacts, setSelectedContacts] = useState(new Set());
  const [eligiblePage, setEligiblePage] = useState(1);
  const [eligiblePagination, setEligiblePagination] = useState({ page: 1, totalPages: 1, totalItems: 0 });
  const [recipientActionLoading, setRecipientActionLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const selectAllRef = useRef(null);

  // Template integration
  const [templates, setTemplates] = useState([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // Segment integration
  const [segments, setSegments] = useState([]);
  const [showSegmentModal, setShowSegmentModal] = useState(false);
  const [segmentResult, setSegmentResult] = useState(null);

  useEffect(() => {
    if (!loading && !admin) {
      router.push('/login');
    }
  }, [admin, loading, router]);

  const loadRecipientsData = async (page = eligiblePage) => {
    try {
      const [eligRes, recRes] = await Promise.all([
        getEligibleContacts(id, page, search),
        getRecipients(id, 1)
      ]);
      setEligibleContacts(eligRes.data || []);
      if (eligRes.pagination) {
        setEligiblePagination(eligRes.pagination);
      } else {
        setEligiblePagination({ page: 1, totalPages: 1, totalItems: eligRes.data?.length || 0 });
      }
      setRecipients(recRes.data || []);
      setSelectedContacts(new Set());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (admin && id) {
      getCampaign(id).then(data => {
        const c = data.data;
        if (c.status !== 'DRAFT') {
          router.push(`/campaigns/${id}`);
          return;
        }
        setFormData({
          name: c.name,
          subject: c.subject,
          htmlContent: c.htmlContent || '',
          textContent: c.textContent || ''
        });
        setFetching(false);
        loadRecipientsData();
      }).catch(err => {
        setError(err.message);
        setFetching(false);
      });
    }
  }, [admin, id, router]);

  useEffect(() => {
    if (activeTab === 'recipients' && admin && id && !fetching) {
      loadRecipientsData(eligiblePage);
    }
  }, [search, activeTab, eligiblePage]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await updateCampaign(id, formData);
      router.push('/campaigns');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddSelected = async () => {
    if (selectedContacts.size === 0) return;
    setRecipientActionLoading(true);
    try {
      await addRecipients(id, Array.from(selectedContacts));
      await loadRecipientsData(eligiblePage);
    } catch (err) {
      setError(err.message);
    } finally {
      setRecipientActionLoading(false);
    }
  };

  const handleRemoveRecipient = async (recipientId) => {
    setRecipientActionLoading(true);
    try {
      await removeRecipient(id, recipientId);
      await loadRecipientsData(eligiblePage);
    } catch (err) {
      setError(err.message);
    } finally {
      setRecipientActionLoading(false);
    }
  };

  const handleClearRecipients = async () => {
    setRecipientActionLoading(true);
    try {
      await clearRecipients(id);
      await loadRecipientsData(eligiblePage);
    } catch (err) {
      setError(err.message);
    } finally {
      setRecipientActionLoading(false);
    }
  };

  const handleSendCampaign = async () => {
    if (!formData.subject || (!formData.htmlContent && !formData.textContent)) {
      setError('Campaign needs a subject and content to be sent.');
      return;
    }
    if (!window.confirm(`You are about to send this campaign to ${recipients.length} recipients. This cannot be undone. Are you sure?`)) {
      return;
    }
    setSending(true);
    setError('');
    try {
      await sendCampaign(id);
      router.push(`/campaigns/${id}`);
    } catch (err) {
      setError(err.message);
      setSending(false);
    }
  };

  const toggleSelectContact = (contactId) => {
    const newSet = new Set(selectedContacts);
    if (newSet.has(contactId)) newSet.delete(contactId);
    else newSet.add(contactId);
    setSelectedContacts(newSet);
  };

  const isPaginated = eligiblePagination.totalPages > 1;
  const isAllDisplayedSelected = eligibleContacts.length > 0 && eligibleContacts.every(contact => selectedContacts.has(contact.id));
  const isSomeDisplayedSelected = eligibleContacts.some(contact => selectedContacts.has(contact.id));
  const isPartiallySelected = isSomeDisplayedSelected && !isAllDisplayedSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = isPartiallySelected;
    }
  }, [isPartiallySelected]);

  const handleToggleSelectAll = () => {
    const newSet = new Set(selectedContacts);
    if (isAllDisplayedSelected) {
      eligibleContacts.forEach(contact => newSet.delete(contact.id));
    } else {
      eligibleContacts.forEach(contact => newSet.add(contact.id));
    }
    setSelectedContacts(newSet);
  };

  // Load from Template
  const handleOpenTemplateModal = async () => {
    try {
      const res = await fetchTemplates(1, 50);
      setTemplates(res.data);
      setShowTemplateModal(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLoadTemplate = async (templateId) => {
    try {
      const res = await getTemplate(templateId);
      const t = res.data;
      setFormData({
        ...formData,
        subject: t.subject || formData.subject,
        htmlContent: t.htmlContent || '',
        textContent: t.textContent || '',
      });
      setShowTemplateModal(false);
    } catch (err) {
      setError(err.message);
    }
  };

  // Add from Segment
  const handleOpenSegmentModal = async () => {
    try {
      const res = await fetchSegments(1, 50);
      setSegments(res.data);
      setShowSegmentModal(true);
      setSegmentResult(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleApplySegment = async (segmentId) => {
    setRecipientActionLoading(true);
    setSegmentResult(null);
    try {
      const res = await applySegmentToCampaign(id, segmentId);
      setSegmentResult(res.data);
      setShowSegmentModal(false);
      await loadRecipientsData();
    } catch (err) {
      setError(err.message);
    } finally {
      setRecipientActionLoading(false);
    }
  };

  if (loading || fetching) return null;
  if (!admin) return null;

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
            {recipients.length > 0 && (
              <button 
                onClick={handleSendCampaign} 
                disabled={sending || recipientActionLoading}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Send Campaign'}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-6">Edit Campaign Draft</h1>
          {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">{error}</div>}

          {segmentResult && (
            <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6">
              Added <strong>{segmentResult.added}</strong> recipients from segment.
              {segmentResult.skipped > 0 && <> Skipped <strong>{segmentResult.skipped}</strong> (duplicates).</>}
              {segmentResult.limitApplied && <> <span className="text-amber-600 font-medium">Limit of 500 recipients applied.</span></>}
            </div>
          )}

          <div className="flex gap-4 mb-6">
            <button onClick={() => setActiveTab('editor')} className={`px-4 py-2 text-sm font-medium rounded-lg ${activeTab === 'editor' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Editor</button>
            <button onClick={() => setActiveTab('preview')} className={`px-4 py-2 text-sm font-medium rounded-lg ${activeTab === 'preview' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Preview</button>
            <button onClick={() => setActiveTab('recipients')} className={`px-4 py-2 text-sm font-medium rounded-lg ${activeTab === 'recipients' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              Recipients {recipients.length > 0 && <span className="ml-2 bg-blue-100 text-blue-700 py-0.5 px-2 rounded-full text-xs">{recipients.length}</span>}
            </button>
          </div>

          {activeTab === 'editor' && (
            <form onSubmit={handleSubmit}>
              <div className="flex justify-end mb-4">
                <button type="button" onClick={handleOpenTemplateModal}
                  className="px-3 py-1.5 text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors">
                  Load from Template
                </button>
              </div>
              <div className="grid gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Campaign Name *</label>
                  <input type="text" required maxLength={100} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Subject Line *</label>
                  <input type="text" required maxLength={200} value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">HTML Content</label>
                  <textarea rows={8} value={formData.htmlContent} onChange={e => setFormData({...formData, htmlContent: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono text-sm" placeholder="<p>Hello world</p>" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Plain Text Content</label>
                  <textarea rows={6} value={formData.textContent} onChange={e => setFormData({...formData, textContent: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono text-sm" placeholder="Leave empty to auto-generate from HTML" />
                  <p className="text-xs text-slate-500 mt-1">If left empty, text content will be automatically regenerated from HTML on save.</p>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => router.push('/campaigns')} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {submitting ? 'Saving...' : 'Update Draft'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'preview' && (
            <div className="space-y-6">
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                <div className="text-sm text-slate-500 mb-1">Subject</div>
                <div className="font-medium text-slate-900">{formData.subject || 'No subject'}</div>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 text-sm font-medium text-slate-700">HTML Preview</div>
                <iframe
                  title="Campaign HTML Preview"
                  srcDoc={formData.htmlContent || '<span style="color:#94a3b8">No HTML content</span>'}
                  sandbox=""
                  className="w-full min-h-[200px] border-0 bg-white"
                />
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 text-sm font-medium text-slate-700">Plain Text Preview</div>
                <div className="p-4 bg-white min-h-[100px] whitespace-pre-wrap font-mono text-sm">
                  {formData.textContent || 'No manual text provided. Will be auto-generated on save.'}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'recipients' && (
            <div>
              <div className="flex justify-end mb-4">
                <button type="button" onClick={handleOpenSegmentModal} disabled={recipientActionLoading}
                  className="px-3 py-1.5 text-sm font-medium bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50">
                  Add from Segment
                </button>
              </div>
              <div className="grid grid-cols-2 gap-8">
                {/* Eligible Contacts Panel */}
                <div className="border border-slate-200 rounded-lg flex flex-col h-[500px]">
                  <div className="bg-slate-50 border-b border-slate-200 p-4">
                    <h3 className="font-medium text-slate-900 mb-3">Add Recipients</h3>
                    <input type="text" placeholder="Search contacts..." value={search} onChange={e => { setSearch(e.target.value); setEligiblePage(1); }}
                      className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500" />
                  </div>
                  {eligibleContacts.length > 0 && (
                    <div className="px-4 py-2.5 bg-slate-100/75 border-b border-slate-200 flex items-center justify-between text-xs">
                      <label className="flex items-center cursor-pointer select-none">
                        <input
                          ref={selectAllRef}
                          type="checkbox"
                          checked={isAllDisplayedSelected}
                          onChange={handleToggleSelectAll}
                          className="mr-2.5 h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        />
                        <span className="font-medium text-slate-800">
                          {isPaginated ? 'Select all on this page' : 'Select All'}
                        </span>
                      </label>
                      <span className="text-slate-500">
                        {eligibleContacts.filter(c => selectedContacts.has(c.id)).length} of {eligibleContacts.length} selected
                      </span>
                    </div>
                  )}
                  <div className="flex-1 overflow-y-auto p-2">
                    {eligibleContacts.length === 0 ? (
                      <div className="text-center text-sm text-slate-500 p-4">No eligible contacts found.</div>
                    ) : (
                      eligibleContacts.map(contact => (
                        <label key={contact.id} className="flex items-center p-2 hover:bg-slate-50 rounded cursor-pointer">
                          <input type="checkbox" checked={selectedContacts.has(contact.id)} onChange={() => toggleSelectContact(contact.id)}
                            className="mr-3 h-4 w-4 text-blue-600 rounded border-slate-300" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-900 truncate">{contact.email}</p>
                            {contact.name && <p className="text-xs text-slate-500 truncate">{contact.name}</p>}
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                  {eligiblePagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-3 py-2 border-t border-slate-200 text-xs text-slate-500 bg-slate-50">
                      <span>Page {eligiblePagination.page} of {eligiblePagination.totalPages}</span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          disabled={eligiblePage <= 1 || recipientActionLoading}
                          onClick={() => setEligiblePage(p => Math.max(1, p - 1))}
                          className="px-2 py-0.5 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-50"
                        >
                          Prev
                        </button>
                        <button
                          type="button"
                          disabled={eligiblePage >= eligiblePagination.totalPages || recipientActionLoading}
                          onClick={() => setEligiblePage(p => p + 1)}
                          className="px-2 py-0.5 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                  {selectedContacts.size > 0 && (
                    <div className="border-t border-slate-200 p-3 bg-white">
                      <button onClick={handleAddSelected} disabled={recipientActionLoading}
                        className="w-full py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                        Add {selectedContacts.size} Selected
                      </button>
                    </div>
                  )}
                </div>

                {/* Selected Recipients Panel */}
                <div className="border border-slate-200 rounded-lg flex flex-col h-[500px]">
                  <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center h-[105px]">
                    <h3 className="font-medium text-slate-900">Selected Recipients ({recipients.length})</h3>
                    {recipients.length > 0 && (
                      <button onClick={handleClearRecipients} disabled={recipientActionLoading}
                        className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50">
                        Clear All
                      </button>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto p-2">
                    {recipients.length === 0 ? (
                      <div className="text-center text-sm text-slate-500 p-4">No recipients selected yet.</div>
                    ) : (
                      recipients.map(r => (
                        <div key={r.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-900 truncate">{r.emailAtSend}</p>
                            {r.nameAtSend && <p className="text-xs text-slate-500 truncate">{r.nameAtSend}</p>}
                          </div>
                          <button onClick={() => handleRemoveRecipient(r.id)} disabled={recipientActionLoading}
                            className="text-slate-400 hover:text-red-600 ml-2 px-2 py-1">
                            &times;
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Template Selection Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[70vh] flex flex-col">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900">Load from Template</h2>
              <button onClick={() => setShowTemplateModal(false)} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {templates.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No templates available. <Link href="/templates/new" className="text-blue-600 hover:underline">Create one</Link>.</p>
              ) : (
                <div className="space-y-2">
                  {templates.map(t => (
                    <button key={t.id} onClick={() => handleLoadTemplate(t.id)}
                      className="w-full text-left p-4 border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors">
                      <p className="font-medium text-slate-900">{t.name}</p>
                      <p className="text-sm text-slate-500 mt-1">Subject: {t.subject}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-200 text-xs text-slate-500">
              Loading a template will overwrite the current subject and content. The campaign name is preserved.
            </div>
          </div>
        </div>
      )}

      {/* Segment Selection Modal */}
      {showSegmentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[70vh] flex flex-col">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900">Add Recipients from Segment</h2>
              <button onClick={() => setShowSegmentModal(false)} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {segments.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No segments available. <Link href="/segments/new" className="text-blue-600 hover:underline">Create one</Link>.</p>
              ) : (
                <div className="space-y-2">
                  {segments.map(s => (
                    <button key={s.id} onClick={() => handleApplySegment(s.id)} disabled={recipientActionLoading}
                      className="w-full text-left p-4 border border-slate-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors disabled:opacity-50">
                      <p className="font-medium text-slate-900">{s.name}</p>
                      {s.description && <p className="text-sm text-slate-500 mt-1">{s.description}</p>}
                      <p className="text-xs text-slate-400 mt-1">{s.filters?.length || 0} filter rule(s)</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-200 text-xs text-slate-500">
              This adds matching eligible contacts as campaign recipients. Duplicates are automatically skipped. Limited to 500 per batch.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
