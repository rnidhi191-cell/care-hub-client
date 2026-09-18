import { useEffect, useState } from 'react';
import api from '../api';

const readableSize = (size) => size < 1024 * 1024 ? `${Math.ceil(size / 1024)} KB` : `${(size / (1024 * 1024)).toFixed(1)} MB`;
const canPreview = (type) => type === 'application/pdf' || type.startsWith('image/');

// Files are fetched with the user's token; no private upload URL is exposed in the UI.
export default function AttachmentPanel({ endpoint, title = 'Evidence & documents' }) {
  const [items, setItems] = useState([]);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const load = async () => {
    try { setItems((await api.get(endpoint)).data.data); } catch { setError('Could not load attachments.'); }
  };
  useEffect(() => { load(); }, [endpoint]);
  const upload = async () => {
    if (!file) return;
    setBusy(true); setError('');
    try {
      const body = new FormData(); body.append('file', file);
      await api.post(endpoint, body);
      setFile(null); await load();
    } catch (err) { setError(err.response?.data?.message || err.response?.data?.error?.message || 'Upload failed.'); }
    finally { setBusy(false); }
  };
  const openFile = async (item, preview) => {
    try {
      const response = await api.get(`/reviews/attachments/${item._id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      if (preview) window.open(url, '_blank', 'noopener,noreferrer');
      else { const link = document.createElement('a'); link.href = url; link.download = item.originalName; link.click(); }
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch { setError('Could not retrieve attachment.'); }
  };
  const remove = async (id) => {
    if (!window.confirm('Delete this attachment?')) return;
    try { await api.delete(`/reviews/attachments/${id}`); await load(); } catch (err) { setError(err.response?.data?.message || 'Could not delete attachment.'); }
  };
  return <section className="attachment-panel">
    <h3>{title}</h3><p className="form-hint">PDF, Office files, CSV, text, PNG or JPEG — maximum 10 MB.</p>
    <div className="button-group"><input aria-label={`${title} file`} type="file" accept=".pdf,.txt,.csv,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" onChange={(event) => setFile(event.target.files[0] || null)} /><button type="button" className="button button-secondary button-sm" onClick={upload} disabled={busy || !file}>{busy ? 'Uploading…' : 'Upload'}</button></div>
    {error && <p className="form-error">{error}</p>}
    {items.length > 0 && <ul className="attachment-list">{items.map((item) => <li key={item._id}><span>{item.originalName} <small>({readableSize(item.size)})</small></span><div className="button-group">{canPreview(item.mimeType) && <button type="button" className="button button-secondary button-sm" onClick={() => openFile(item, true)}>View</button>}<button type="button" className="button button-secondary button-sm" onClick={() => openFile(item, false)}>Download</button><button type="button" className="button-danger button-sm" onClick={() => remove(item._id)}>Delete</button></div></li>)}</ul>}
  </section>;
}
