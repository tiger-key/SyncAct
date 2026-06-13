import { useState, useRef, useEffect } from 'react';

export default function PasscodeModal({ mode, name, onSubmit, onClose, error }) {
  const [code, setCode] = useState('');
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleChange = (v) => setCode(v.replace(/\D/g, '').slice(0, 4));
  const handleSubmit = () => { if (code.length === 4) onSubmit(code); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-in"
      style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)' }}>
      <div className="glass p-8 w-full max-w-xs space-y-5">
        <div className="text-center">
          <div className="text-4xl mb-2">🔐</div>
          <h3 className="font-black text-lg" style={{ letterSpacing: '-0.5px' }}>
            {mode === 'set' ? 'パスコードを設定' : `${name} さん？`}
          </h3>
          <p className="text-[11px] text-gray-500 font-semibold mt-1">
            {mode === 'set'
              ? '回答の修正に使う4桁の数字を決めてね'
              : '設定した4桁のパスコードを入力'}
          </p>
        </div>
        <input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          value={code}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="• • • •"
          className="input-soft text-center"
          style={{ fontSize: 28, fontWeight: 900, letterSpacing: '0.5em' }}
        />
        {error && (
          <p className="text-center text-xs font-black animate-in" style={{ color: '#c0392b' }}>
            {error}
          </p>
        )}
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-soft flex-1 py-3 text-sm">やめる</button>
          <button
            onClick={handleSubmit}
            disabled={code.length !== 4}
            className="btn-dark flex-1 py-3 text-sm disabled:opacity-30"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
