import { useState } from 'react';

// イベント提示モード：伝言は作成者（ホスト）専用
export default function InviteInfo({ event, currentName }) {
  const [unlocked, setUnlocked] = useState(false);
  const [hostInput, setHostInput] = useState('');
  const [err, setErr] = useState('');

  const hostName = event.hostName || '';
  const message = event.message || '';
  const showMessage = message && (unlocked || currentName === hostName);

  const tryUnlock = () => {
    if (hostInput === hostName) {
      setUnlocked(true);
      setErr('');
    } else {
      setErr('ホスト名が違うみたい 🤔');
    }
  };

  if (!message) return null;

  return (
    <div className="glass p-6 space-y-4">
      <div className="sec-label mb-2">📢 ホストからの伝言</div>
      {showMessage ? (
        <div className="rounded-2xl p-4 text-sm font-semibold whitespace-pre-wrap"
          style={{ background: 'rgba(0,0,0,0.05)', color: '#333' }}>
          {message}
        </div>
      ) : (
        <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(0,0,0,0.05)' }}>
          <p className="text-xs font-bold text-gray-500">🔒 この伝言はホストのみ閲覧可能です。</p>
          <div className="flex gap-2">
            <input
              value={hostInput}
              onChange={(e) => setHostInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && tryUnlock()}
              placeholder="ホスト名を入力"
              className="input-soft flex-1"
            />
            <button onClick={tryUnlock} className="btn-dark px-5 text-sm">確認</button>
          </div>
          {err && <p className="text-xs font-black" style={{ color: '#c0392b' }}>{err}</p>}
        </div>
      )}
    </div>
  );
}
