import { useState } from 'react';
import { verifyPasscode } from '../lib/db';

// コメント閲覧用：ホスト（合言葉）またはゲスト（パスコード）で認証
export default function CommentGateModal({ event, responses, onUnlock, onClose, error }) {
  const [mode, setMode] = useState(null); // 'host' | 'guest' | null
  const [input, setInput] = useState('');
  const [localError, setLocalError] = useState('');

  const handleVerify = () => {
    setLocalError('');
    if (mode === 'host') {
      if (input === event.hostName) {
        onUnlock('host');
      } else {
        setLocalError('合言葉が違うみたい 🤔');
      }
    } else if (mode === 'guest') {
      // パスコードは複数の回答のいずれかと一致すればOK
      const ok = responses.some((r) => r.passcodeHash && verifyPasscode(r, input));
      if (ok) {
        onUnlock('guest');
      } else {
        setLocalError('パスコードが違うみたい 🤔');
      }
    }
  };

  if (!mode) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-5 animate-in"
        style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)' }}>
        <div className="glass p-8 w-full max-w-sm text-center space-y-5">
          <div className="text-4xl mb-2">💬</div>
          <h3 className="font-black text-lg" style={{ letterSpacing: '-0.5px' }}>コメントを見る</h3>
          <p className="text-xs text-gray-500 font-semibold">あなたは？</p>
          <div className="flex flex-col gap-3">
            <button onClick={() => setMode('host')}
              className="btn-dark py-4 text-sm font-bold">
              👤 ホスト（合言葉で確認）
            </button>
            <button onClick={() => setMode('guest')}
              className="btn-soft py-4 text-sm font-bold">
              👥 ゲスト（パスコードで確認）
            </button>
          </div>
          <button onClick={onClose} className="btn-soft w-full py-2.5 text-xs">やめる</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5 animate-in"
      style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)' }}>
      <div className="glass p-8 w-full max-w-sm space-y-5">
        <h3 className="font-black text-lg" style={{ letterSpacing: '-0.5px' }}>
          {mode === 'host' ? '合言葉を入力' : 'パスコードを入力'}
        </h3>
        <input
          type={mode === 'host' ? 'text' : 'tel'}
          inputMode={mode === 'host' ? 'text' : 'numeric'}
          value={input}
          onChange={(e) => {
            if (mode === 'guest') setInput(e.target.value.replace(/\D/g, '').slice(0, 4));
            else setInput(e.target.value);
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
          placeholder={mode === 'host' ? '合言葉' : '••••'}
          className="input-soft text-center"
          style={mode === 'guest' ? { letterSpacing: '0.4em', fontWeight: 900 } : {}}
        />
        {(localError || error) && (
          <p className="text-xs font-black text-center" style={{ color: '#c0392b' }}>
            {localError || error}
          </p>
        )}
        <div className="flex gap-3">
          <button onClick={() => setMode(null)} className="btn-soft flex-1 py-3 text-sm">戻る</button>
          <button onClick={handleVerify} className="btn-dark flex-1 py-3 text-sm">確認</button>
        </div>
      </div>
    </div>
  );
}
