// イベント提示モード用：参加/不参加の集計表示＋一覧
export default function InviteResponseList({ responses, onTapResponse, onViewComments }) {
  const going = responses.filter((r) => r.status === 'available');
  const notGoing = responses.filter((r) => r.status === 'unavailable');

  return (
    <div className="glass p-6 space-y-4">
      <div className="flex justify-between items-center pb-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <h3 className="sec-label">参加状況</h3>
        <span className="text-[9px] font-black flex items-center gap-1" style={{ color: '#1d9e75' }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#1d9e75' }}></span>
          LIVE
        </span>
      </div>

      {/* サマリー */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <div className="flex-1 rounded-2xl p-4 text-center" style={{ background: '#111', color: '#fff' }}>
            <div className="text-3xl font-black">{going.length}</div>
            <div className="text-[10px] font-black uppercase tracking-widest opacity-60 mt-1">参加 ✅</div>
          </div>
          <div className="flex-1 rounded-2xl p-4 text-center" style={{ background: 'rgba(0,0,0,0.05)' }}>
            <div className="text-3xl font-black text-gray-400">{notGoing.length}</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">不参加 ✕</div>
          </div>
        </div>
        {responses.some((r) => r.comment) && (
          <button onClick={onViewComments}
            className="btn-dark w-full py-3 text-sm" style={{ borderRadius: 14 }}>
            💬 コメントを読む
          </button>
        )}
      </div>

      {/* 一覧 */}
      <div className="space-y-2">
        {!responses.length && (
          <p className="text-center py-4 text-gray-400 text-[10px] font-black uppercase">No responses yet</p>
        )}
        {responses.map((r) => {
          const isGoing = r.status === 'available';
          return (
            <div key={r.id} onClick={() => onTapResponse(r)}
              className="rounded-2xl p-4 cursor-pointer active:scale-[0.98] transition-transform"
              style={{ background: 'rgba(0,0,0,0.04)', opacity: isGoing ? 1 : 0.5 }}>
              <div className="flex justify-between items-center">
                <span className="font-black text-sm">
                  {isGoing ? '✅' : '✕'} {r.name}
                </span>
                <span className="text-[9px] text-gray-400 font-bold">✏️</span>
              </div>
              <div className="text-[10px] mt-1.5 font-semibold text-gray-600 space-y-0.5">
                {r.invitedBy && (
                  <div>👤 {r.invitedBy}</div>
                )}
                {r.comment && (
                  <div className="text-gray-400">💬 🔒</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
