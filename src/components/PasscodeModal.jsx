import { useState, useRef, useEffect } from 'react';

// 4桁パスコード入力モーダル
// mode: 'set'（新規設定） | 'verify'（本人確認）
export default function PasscodeModal({ mode, name, onSubmit, onClose, error }) {
  const [code, setCode] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleChange = (v) => {
    const digits = v.replace(/\D/g, '').slice(0, 4);
    setCode(digits);
  };

  const handleSubmit = () => {
    if (code.length !== 4) return;
    onSubmit(code);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6 animate-in">
      <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-xs shadow-2xl space-y-5">
        <div className="text-center">
          <div className="text-4xl mb-2">🔐</div>
          <h3 className="font-black text-lg text-gray-900">
            {mode === 'set' ? 'パスコードを設定' : `${name} さん？`}
          </h3>
          <p className="text-[11px] text-gray-400 font-bold mt-1">
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
          className="w-full p-4 bg-gray-100 rounded-2xl outline-none font-black text-3xl text-center tracking-[0.5em] focus:ring-2 focus:ring-blue-400"
        />
        {error && (
          <p className="text-center text-rose-500 text-xs font-black animate-in">
            {error}
          </p>
        )}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-500 py-3 rounded-2xl font-black text-sm"
          >
            やめる
          </button>
          <button
            onClick={handleSubmit}
            disabled={code.length !== 4}
            className="flex-1 bg-blue-600 text-white py-3 rounded-2xl font-black text-sm disabled:opacity-30 transition-opacity"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
