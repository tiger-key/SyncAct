import { formatDateJa } from '../lib/utils';

export default function ResponseList({ responses, onTapResponse }) {
  return (
    <div className="glass p-6 space-y-4">
      <div className="flex justify-between items-center pb-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <h3 className="sec-label">回答状況</h3>
        <span className="text-[9px] font-black flex items-center gap-1" style={{ color: '#1d9e75' }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#1d9e75' }}></span>
          LIVE
        </span>
      </div>
      <div className="space-y-3">
        {!responses.length && (
          <p className="text-center py-4 text-gray-400 text-[10px] font-black uppercase">No responses yet</p>
        )}
        {responses.map((r) => {
          const isBatsu = r.status === 'unavailable';
          return (
            <div
              key={r.id}
              onClick={() => onTapResponse(r)}
              className="rounded-2xl p-4 cursor-pointer active:scale-[0.98] transition-transform"
              style={{ background: 'rgba(0,0,0,0.04)', opacity: isBatsu ? 0.45 : 1 }}
            >
              <div className="flex justify-between items-center">
                <span className="font-black text-sm">
                  {r.name}
                  {r.roles?.length > 0 && (
                    <span className="text-[10px] text-gray-400 ml-1.5 font-bold">
                      ({r.roles.join('/')})
                    </span>
                  )}
                </span>
                <span className="text-[9px] text-gray-400 font-bold">✏️</span>
              </div>
              <div className="text-[10px] mt-1 font-bold text-gray-500">
                {isBatsu ? '不参加 ✕' : (r.dates || []).map(formatDateJa).join(', ')}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
