import { useState } from 'react';

export default function MemoCard({ memo, onSave, compact = false }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const startEdit = () => { setDraft(memo || ''); setEditing(true); };

  const save = async () => {
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
    } catch (e) {
      alert('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const inner = (
    <>
      <div className="flex justify-between items-center mb-2">
        <span className="sec-label">📝 Memo</span>
        {!editing && (
          <button onClick={startEdit} className="btn-soft text-[10px] px-3 py-1">編集</button>
        )}
      </div>
      {!editing ? (
        <p className={`${compact ? 'text-xs' : 'text-sm'} text-gray-600 font-semibold whitespace-pre-wrap min-h-[1em]`}>
          {memo || 'メモなし'}
        </p>
      ) : (
        <div className="space-y-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="input-soft"
            style={{ height: compact ? 80 : 120, resize: 'none', fontSize: 13 }}
          />
          <button onClick={save} disabled={saving} className="btn-dark w-full py-2.5 text-xs">
            {saving ? '...' : '更新'}
          </button>
        </div>
      )}
    </>
  );

  if (compact) {
    return <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>{inner}</div>;
  }
  return <div className="glass p-6">{inner}</div>;
}
