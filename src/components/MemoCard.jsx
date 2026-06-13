import { useState } from 'react';

export default function MemoCard({ memo, onSave, compact = false }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setDraft(memo || '');
    setEditing(true);
  };

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

  if (compact) {
    return (
      <div className="mt-4 pt-4 border-t border-dashed border-gray-100">
        <div className="flex justify-between items-center mb-2 px-1">
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">📝 Memo</span>
          {!editing && (
            <button onClick={startEdit} className="text-[9px] font-black text-blue-500 hover:underline">編集</button>
          )}
        </div>
        {!editing ? (
          <p className="text-xs text-gray-500 font-bold whitespace-pre-wrap px-1 min-h-[1em]">
            {memo || 'メモなし'}
          </p>
        ) : (
          <div className="space-y-2 mt-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full p-3 bg-gray-50 rounded-xl border border-blue-100 text-xs font-bold h-20 outline-none focus:ring-1 focus:ring-blue-400"
            />
            <button
              onClick={save}
              disabled={saving}
              className="w-full bg-blue-600 text-white py-2 rounded-xl font-black text-[10px] shadow-sm active:scale-95 transition-all"
            >
              {saving ? '...' : '更新'}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 p-6 rounded-[2.5rem] border border-yellow-200 shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-[10px] font-black text-yellow-700 tracking-widest uppercase">共有メモ</h3>
        {!editing && (
          <button
            onClick={startEdit}
            className="text-[9px] font-black text-blue-500 bg-white/60 px-3 py-1 rounded-full border border-blue-100"
          >
            編集
          </button>
        )}
      </div>
      {!editing ? (
        <p className="text-sm text-yellow-900 font-bold leading-relaxed whitespace-pre-wrap">
          {memo || 'メモなし'}
        </p>
      ) : (
        <div className="space-y-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full p-4 bg-white rounded-2xl border border-yellow-300 text-sm font-bold h-32 outline-none focus:ring-2 focus:ring-yellow-400"
          />
          <button
            onClick={save}
            disabled={saving}
            className="w-full bg-yellow-400 text-yellow-900 py-3 rounded-2xl font-black text-xs shadow-sm"
          >
            {saving ? '...' : '更新 🚀'}
          </button>
        </div>
      )}
    </div>
  );
}
