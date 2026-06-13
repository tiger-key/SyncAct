import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createEvent, getPresets, savePreset } from '../lib/db';
import LoadingOverlay from '../components/LoadingOverlay';

export default function CreatePage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [presets, setPresets] = useState([]);
  const [form, setForm] = useState({ title: '', roles: '', tags: '', memo: '' });
  const [saveAsPreset, setSaveAsPreset] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getPresets().then(setPresets).catch(console.error);
  }, []);

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

  const submit = async () => {
    if (!form.title) return alert('イベント名を入れてね');
    setLoading(true);
    try {
      const gid = groupId || 'default';
      const newId = await createEvent({ groupId: gid, ...form });
      if (saveAsPreset) {
        await savePreset({
          label: form.title,
          title: form.title,
          tags: form.tags,
          roles: form.roles,
        });
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
    <div className="space-y-5 px-2 animate-in">
      {loading && <LoadingOverlay />}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-gray-100 space-y-5">
        <div>
          <label className="text-[10px] font-black text-gray-400 ml-1 uppercase">プリセット</label>
          <select
            onChange={(e) => applyPreset(e.target.value)}
            className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-blue-600 border-2 border-transparent focus:border-blue-400 transition-all cursor-pointer"
          >
            <option value="">プリセットを選択 📋</option>
            {presets.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 ml-1 uppercase">イベント名</label>
          <input
            value={form.title}
            onChange={set('title')}
            type="text"
            placeholder="例：週末キャンプ"
            className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 ml-1 uppercase">役割（カンマ区切り）</label>
          <input
            value={form.roles}
            onChange={set('roles')}
            type="text"
            placeholder="ドライバー, 買い出し"
            className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 ml-1 uppercase">タグ</label>
          <input
            value={form.tags}
            onChange={set('tags')}
            type="text"
            placeholder="🚗, 🍖"
            className="w-full p-4 bg-gray-50 rounded-2xl outline-none text-xs"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 ml-1 uppercase">初期メモ</label>
          <textarea
            value={form.memo}
            onChange={set('memo')}
            placeholder="詳細や持ち物など"
            className="w-full p-4 bg-gray-50 rounded-2xl h-24 outline-none text-sm font-bold focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <label className="flex items-center gap-2 px-1 cursor-pointer">
          <input
            type="checkbox"
            checked={saveAsPreset}
            onChange={(e) => setSaveAsPreset(e.target.checked)}
            className="w-4 h-4 accent-blue-600"
          />
          <span className="text-[11px] font-black text-gray-500">この内容をプリセットとして保存</span>
        </label>
        <button
          onClick={submit}
          className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black text-lg shadow-xl hover:bg-blue-700 transition-all"
        >
          作成する 🚀
        </button>
      </div>
    </div>
  );
}
