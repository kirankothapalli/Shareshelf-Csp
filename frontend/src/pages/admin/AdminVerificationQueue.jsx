import { useEffect, useState, useCallback } from 'react';
import api from '../../api/axios.js';
import AdminLayout from '../../components/AdminLayout.jsx';
import Loader from '../../components/Loader.jsx';

const DOC_TYPE_LABELS = {
  id_card: { label: 'ID Card', icon: '🪪', color: 'bg-forest-50 text-forest' },
  fee_receipt: { label: 'Fee Receipt', icon: '🧾', color: 'bg-amber-50 text-amber-dark' },
  institution_doc: { label: 'Institution Doc', icon: '🏫', color: 'bg-sage-50 text-ink/70' },
};

export default function AdminVerificationQueue() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reasonDraft, setReasonDraft] = useState({});
  const [previewModal, setPreviewModal] = useState(null); // { userId, url, name, docType, blobUrl }
  const [previewLoading, setPreviewLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkAction, setBulkAction] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  const load = useCallback(() => {
    setLoading(true);
    api.get('/admin/verifications/pending')
      .then((res) => setUsers(res.data.users))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  async function review(userId, decision) {
    setActionLoading((prev) => ({ ...prev, [userId]: true }));
    try {
      await api.patch(`/admin/verify/${userId}`, {
        decision,
        reason: reasonDraft[userId] || '',
      });
      closePreview();
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Action failed');
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: false }));
    }
  }

  function closePreview() {
    if (previewModal?.blobUrl) {
      URL.revokeObjectURL(previewModal.blobUrl);
    }
    setPreviewModal(null);
  }

  async function handleBulkAction(decision) {
    if (selectedIds.size === 0) return;
    setBulkAction(decision);
    const promises = [...selectedIds].map((id) =>
      api.patch(`/admin/verify/${id}`, { decision, reason: '' }).catch(() => null)
    );
    await Promise.all(promises);
    setSelectedIds(new Set());
    setBulkAction(null);
    load();
  }

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === users.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(users.map((u) => u._id)));
    }
  }

  async function openPreview(user) {
    setPreviewLoading(true);
    setPreviewModal({
      userId: user._id,
      name: user.name,
      docType: user.verification.docType,
      blobUrl: null,
    });
    
    try {
      const res = await api.get(`/admin/verify/${user._id}/document`, { responseType: 'blob' });
      const blobUrl = URL.createObjectURL(res.data);
      setPreviewModal((prev) => prev ? { ...prev, blobUrl } : null);
    } catch (err) {
      console.error('Failed to load document preview', err);
    } finally {
      setPreviewLoading(false);
    }
  }

  const timeSince = (date) => {
    const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <AdminLayout title="Pending verifications">
      {/* Bulk actions bar */}
      {users.length > 0 && (
        <div className="flex items-center justify-between mb-6 p-3 bg-card border border-ink/5 rounded-xl">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.size === users.length && users.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-ink/30 accent-forest"
              />
              <span className="text-muted font-medium">
                {selectedIds.size > 0
                  ? `${selectedIds.size} selected`
                  : `${users.length} pending`}
              </span>
            </label>
          </div>

          {selectedIds.size > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction('approved')}
                disabled={!!bulkAction}
                className="bg-forest text-white text-xs font-medium px-4 py-2 rounded-full hover:bg-forest-dark transition disabled:opacity-50"
              >
                {bulkAction === 'approved' ? 'Approving…' : `Approve ${selectedIds.size}`}
              </button>
              <button
                onClick={() => handleBulkAction('rejected')}
                disabled={!!bulkAction}
                className="border border-red-300 text-red-500 text-xs font-medium px-4 py-2 rounded-full hover:bg-red-50 transition disabled:opacity-50"
              >
                {bulkAction === 'rejected' ? 'Rejecting…' : `Reject ${selectedIds.size}`}
              </button>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <Loader />
      ) : users.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-muted font-medium">No pending verifications — nice and clear.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {users.map((u) => {
            const docInfo = DOC_TYPE_LABELS[u.verification?.docType] || DOC_TYPE_LABELS.id_card;
            const isSelected = selectedIds.has(u._id);
            const isLoading = actionLoading[u._id];

            return (
              <div
                key={u._id}
                className={`border rounded-2xl p-5 bg-card transition-all ${
                  isSelected ? 'border-forest/30 shadow-glow-forest' : 'border-ink/5 hover:border-ink/10'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(u._id)}
                    className="mt-1 w-4 h-4 rounded border-ink/30 accent-forest shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="font-semibold text-base">{u.name}</p>
                        <p className="text-sm text-muted">{u.email || u.phone} · {u.role}</p>
                        <p className="text-xs text-muted mt-0.5">Submitted {timeSince(u.createdAt)}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full ${docInfo.color}`}>
                        <span>{docInfo.icon}</span>
                        {docInfo.label}
                      </span>
                    </div>

                    {/* Preview button */}
                    <button
                      onClick={() => openPreview(u)}
                      className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-forest bg-forest-50 px-4 py-2 rounded-xl hover:bg-forest-100 transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 3C4.5 3 1.5 8 1.5 8C1.5 8 4.5 13 8 13C11.5 13 14.5 8 14.5 8C14.5 8 11.5 3 8 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                        <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
                      </svg>
                      View submitted document
                    </button>

                    {/* Reason input + actions */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        placeholder="Reason (required for rejection)"
                        value={reasonDraft[u._id] || ''}
                        onChange={(e) => setReasonDraft((d) => ({ ...d, [u._id]: e.target.value }))}
                        className="flex-1 border border-ink/10 rounded-xl px-3 py-2 text-sm bg-paper focus:ring-2 focus:ring-forest/20 focus:border-forest transition-all"
                      />
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => review(u._id, 'approved')}
                          disabled={isLoading}
                          className="bg-forest text-white text-sm font-medium px-5 py-2 rounded-full hover:bg-forest-dark transition disabled:opacity-50"
                        >
                          {isLoading ? '…' : 'Approve'}
                        </button>
                        <button
                          onClick={() => review(u._id, 'rejected')}
                          disabled={isLoading}
                          className="border border-red-200 text-red-500 text-sm font-medium px-5 py-2 rounded-full hover:bg-red-50 transition disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Document Preview Modal */}
      {previewModal && (
        <div className="fixed inset-0 z-[60] modal-overlay flex items-center justify-center p-4" onClick={closePreview}>
          <div
            className="bg-card rounded-2xl shadow-elevated-lg max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-ink/5">
              <div>
                <p className="font-display font-semibold text-lg">Verification document</p>
                <p className="text-sm text-muted">{previewModal.name} — {DOC_TYPE_LABELS[previewModal.docType]?.label || 'Document'}</p>
              </div>
              <button
                onClick={closePreview}
                className="w-8 h-8 rounded-lg hover:bg-sage/50 flex items-center justify-center transition"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Document display */}
            <div className="flex-1 overflow-auto p-5 flex items-center justify-center bg-ink/[0.02] min-h-[200px]">
              {previewLoading ? (
                <Loader />
              ) : previewModal.blobUrl ? (
                <img
                  src={previewModal.blobUrl}
                  alt={`Verification document for ${previewModal.name}`}
                  className="max-w-full max-h-[55vh] object-contain rounded-lg shadow-elevated"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentNode.innerHTML = '<div class="text-center py-12"><p class="text-4xl mb-3">📄</p><p class="text-muted">Document cannot be previewed (may be a PDF).<br/>Check the uploads directory.</p></div>';
                  }}
                />
              ) : (
                <div className="text-center py-12">
                  <p className="text-4xl mb-3">📄</p>
                  <p className="text-muted">Failed to load document preview.<br/>The file might not exist.</p>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-between p-5 border-t border-ink/5 bg-paper">
              <p className="text-xs text-muted">
                ⚠️ This document will be permanently deleted upon approval.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => review(previewModal.userId, 'approved')}
                  className="bg-forest text-white text-sm font-medium px-5 py-2 rounded-full hover:bg-forest-dark transition"
                >
                  Approve & delete
                </button>
                <button
                  onClick={() => review(previewModal.userId, 'rejected')}
                  className="border border-red-200 text-red-500 text-sm font-medium px-5 py-2 rounded-full hover:bg-red-50 transition"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
