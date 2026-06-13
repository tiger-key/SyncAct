import { formatDateJa } from '../lib/utils';

export default function DateSummary({ responses, fixedDate, onFix, onUnfix }) {
  const available = responses.filter((r) => r.status === 'available');
  const counts = {};
  available.forEach((r) => {
    (r.dates || []).forEach((d) => { counts[d] = (counts[d] || 0) + 1; });
  });

  const sorted = Object.entries(counts).sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
  );
  const max = sorted.length ? sorted[0][1] : 0;
  const total = available.length;

  if (!sorted.length && !fixedDate) return null;

  return (
    <div className="glass p-6 space-y-3">
      <div className="sec-label mb-1">📊 日程候補</div>

      {fixedDate && (
        <div className="rounded-2xl p-4 flex justify-between items-center animate-in"
          style={{ background: '#111', color: '#fff' }}>
          <div>
            <div className="text-[9px] font-black uppercase tracking-widest opacity-60">確定日</div>
            <div className="text-xl font-black" style={{ letterSpacing: '-0.5px' }}>
              {fixedDate.includes('-') && fixedDate.length === 10 ? formatDateJa(fixedDate) : fixedDate}
            </div>
          </div>
          <button onClick={onUnfix}
            className="text-[10px] font-black px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', cursor: 'pointer' }}>
            解除
          </button>
        </div>
      )}

      {sorted.map(([date, count]) => {
        const isBest = count === max && max >= 2;
        const ratio = total ? (count / total) * 100 : 0;
        return (
          <div key={date} className="rounded-2xl p-3.5"
            style={isBest
              ? { background: '#111', color: '#fff' }
              : { background: 'rgba(0,0,0,0.05)' }}>
            {isBest && (
              <div className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-0.5">BEST</div>
            )}
            <div className="flex justify-between items-center">
              <span className="font-black" style={{ fontSize: isBest ? 18 : 15, letterSpacing: '-0.5px' }}>
                {formatDateJa(date)}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold" style={{ opacity: 0.6 }}>
                  {count}/{total}人
                </span>
                {fixedDate !== date && (
                  <button onClick={() => onFix(date)}
                    className="text-[9px] font-black uppercase px-3 py-1 rounded-full"
                    style={isBest
                      ? { background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', cursor: 'pointer' }
                      : { background: 'rgba(0,0,0,0.08)', color: '#444', border: 'none', cursor: 'pointer' }}>
                    確定
                  </button>
                )}
              </div>
            </div>
            <div className="mt-2 rounded-full overflow-hidden" style={{ height: 3, background: isBest ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)' }}>
              <div className="h-full rounded-full"
                style={{ width: `${ratio}%`, background: isBest ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.22)', transition: 'width 0.3s' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
