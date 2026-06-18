import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createEvent, getPresets, savePreset } from '../lib/db';
import { resizeImage } from '../lib/covers';
import LoadingOverlay from '../components/LoadingOverlay';

// 今月から6ヶ月分の候補月チップを生成
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

export default function CreatePage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [presets, setPresets] = useState([]);
  const [form, setForm] = useState({ title: '', roles: '', tags: '', memo: '' });
  const [targetMonth, setTargetMonth] = useState(null);
  const [eventMode, setEventMode] = useState('schedule');
  const [hostName, setHostName] = useState('');
  const [coverImage, setCoverImage] = useState(null);
  const [saveAsPreset, setSaveAsPreset] = useState(false);
  const [loading, setLoading] = useState(false);
  const months = nextMonths();

  useEffect(() => { getPresets().then(setPresets).catch(console.error); }, []);

  const applyPreset = (id) => {
    const p = presets.find((x) => x.id === id);
    if (!p) return;
    setForm((f) => ({
      ...f,
      title: p.title || '',
      tags: (p.tags || []).join(', '),
      roles: (p.roles || []).join(', '),
    }));
  };

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeImage(file);
      setCoverImage(dataUrl);
    } catch (err) {
      alert('画像の読み込みに失敗しました');
    }
  };

const submit = async () => {
    if (!form.title) return alert('イベント名を入れてね');
    setLoading(true);
    try {
      const gid = groupId || 'default';
      const newId = await createEvent({ groupId: gid, ...form, targetMonth, coverImage, eventMode, hostName });
      if (saveAsPreset) {
        await savePreset({ label: form.title, title: form.title, tags: form.tags, roles: form.roles });
      }
      navigate(`/e/${newId}`);
    } catch (e) {
      console.error(e);
      alert('作成に失敗しました');
      setLoading(false);
    }
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="space-y-5 px-1 animate-in pb-12">
      {loading && <LoadingOverlay />}
      <div className="glass p-6 space-y-5">

        {/* カバー写真 */}
        <div>
          <label className="sec-label block mb-2">カバー写真（任意）</label>
          <label className="block rounded-2xl overflow-hidden cursor-pointer"
            style={{
              height: 130,
              background: coverImage
                ? `url(${coverImage}) center/cover`
                : 'rgba(0,0,0,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            {!coverImage && (
              <span className="text-xs font-bold text-gray-400">📷 タップして写真を選択</span>
            )}
            <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
          </label>
          {coverImage && (
            <button onClick={() => setCoverImage(null)}
              className="btn-soft text-[10px] px-3 py-1 mt-2">写真を削除</button>
          )}
        </div>

        <div>
          <label className="sec-label block mb-2">モード</label>
          <div className="flex gap-2">
            <button onClick={() => setEventMode('schedule')}
              className={eventMode === 'schedule' ? 'btn-dark flex-1 py-3 text-xs' : 'btn-soft flex-1 py-3 text-xs'}>
              🗓 日程調整
            </button>
            <button onClick={() => setEventMode('invite')}
              className={eventMode === 'invite' ? 'btn-dark flex-1 py-3 text-xs' : 'btn-soft flex-1 py-3 text-xs'}>
              🎉 イベント提示
            </button>
          </div>
          <p className="text-[10px] text-gray-400 font-bold mt-1.5 px-1">
            {eventMode === 'schedule'
              ? '参加者が空いてる日を選んで日程を決める'
              : '日時確定済み。参加/不参加を募る（招待制パーティー等）'}
          </p>
        </div>

        {eventMode === 'invite' && (
          <div>
            <label className="sec-label block mb-2">合言葉</label>
            <input
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              placeholder="合言葉を設定"
              className="input-soft"
            />
            <p className="text-[10px] text-gray-400 font-bold mt-1.5 px-1">
              ゲストがこの合言葉を入力すると、ホストは秘密の伝言を見られます
            </p>
          </div>
        )}

        <div>
          <label className="sec-label block mb-1">プリセット</label>
          <select onChange={(e) => applyPreset(e.target.value)} className="input-soft cursor-pointer">
            <option value="">プリセットを選択 📋</option>
            {presets.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="sec-label block mb-1">イベント名</label>
          <input value={form.title} onChange={set('title')} type="text"
            placeholder="例：週末キャンプ" className="input-soft" />
        </div>

        {/* 候補月（日程調整モードのみ） */}
        {eventMode === 'schedule' && (
          <div>
            <label className="sec-label block mb-2">候補月（カレンダーの初期表示）</label>
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

        <div>
          <label className="sec-label block mb-1">役割（カンマ区切り）</label>
          <input value={form.roles} onChange={set('roles')} type="text"
            placeholder="ドライバー, 買い出し" className="input-soft" />
        </div>

        <div>
          <label className="sec-label block mb-1">タグ</label>
          <input value={form.tags} onChange={set('tags')} type="text"
            placeholder="🚗, 🍖" className="input-soft" />
        </div>

        <div>
          <label className="sec-label block mb-1">初期メモ</label>
          <textarea value={form.memo} onChange={set('memo')}
            placeholder="詳細や持ち物など" className="input-soft"
            style={{ height: 90, resize: 'none' }} />
        </div>

        <label className="flex items-center gap-2 px-1 cursor-pointer">
          <input type="checkbox" checked={saveAsPreset}
            onChange={(e) => setSaveAsPreset(e.target.checked)}
            className="w-4 h-4" style={{ accentColor: '#111' }} />
          <span className="text-[11px] font-bold text-gray-500">この内容をプリセットとして保存</span>
        </label>

        <button onClick={submit} className="btn-dark w-full py-5 text-lg" style={{ borderRadius: 20 }}>
          作成する 🚀
        </button>
      </div>
    </div>
  );
}
