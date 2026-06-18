import { useState } from 'react';

// イベント情報（タイトル・タグ・役割・候補月）の後編集モーダル
function nextMonths(n = 6) {
  const out = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    out.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: `${d.getMonth() + 1}月`,
    });
  }
  return out;
}

export default function EditEventModal({ event, onSave, onClose }) {
  const [title, setTitle] = useState(event.title || '');
  const [tags, setTags] = useState((event.tags || []).join(', '));
  const [roles, setRoles] = useState((event.roles || []).join(', '));
  const [targetMonth, setTargetMonth] = useState(event.targetMonth || null);
  const [hostName, setHostName] = useState(event.hostName || '');
  const [saving, setSaving] = useState(false);
  const months = nextMonths();
  const isSchedule = (event.eventMode || 'schedule') === 'schedule';

const save = async () => {
    if (!title.trim()) return alert('タイトルを入れてね');
    setSaving(true);
    try {
      await onSave({ title: title.trim(), tags, roles, targetMonth, hostName });
      onClose();
    } catch (e) {
      alert('保存に失敗しました');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5 animate-in"
      style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)' }}>
      <div className="glass p-6 w-full max-w-sm space-y-4" style={{ maxHeight: '85vh', overflowY: 'auto' }}>
        <h3 className="font-black text-lg" style={{ letterSpacing: '-0.5px' }}>イベントを編集</h3>

        <div>
          <label className="sec-label block mb-1">イベント名</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-soft" />
        </div>

        <div>
          <label className="sec-label block mb-1">タグ（カンマ区切り）</label>
          <input value={tags} onChange={(e) => setTags(e.target.value)} className="input-soft" placeholder="🚗, 🍖" />
        </div>

        {isSchedule && (
          <div>
            <label className="sec-label block mb-1">役割（カンマ区切り）</label>
            <input value={roles} onChange={(e) => setRoles(e.target.value)} className="input-soft" placeholder="ドライバー, 買い出し" />
          </div>
        )}

        {isSchedule && (
          <div>
            <label className="sec-label block mb-2">候補月</label>
            <div className="flex flex-wrap gap-2">
              {months.map((m) => (
                <button key={m.value}
                  onClick={() => setTargetMonth(targetMonth === m.value ? null : m.value)}
                  className={targetMonth === m.value ? 'btn-dark px-4 py-2 text-xs' : 'btn-soft px-4 py-2 text-xs'}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {!isSchedule && (
          <div>
            <label className="sec-label block mb-2">合言葉</label>
            <input value={hostName} onChange={(e) => setHostName(e.target.value)}
              placeholder="合言葉を設定" className="input-soft" />
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="btn-soft flex-1 py-3 text-sm">やめる</button>
          <button onClick={save} disabled={saving} className="btn-dark flex-1 py-3 text-sm disabled:opacity-40">
            {saving ? '...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
