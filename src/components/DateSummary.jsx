import { formatDateJa } from '../lib/utils';

// 日付ごとの集計＋ベスト日ハイライト＋日程確定
export default function DateSummary({ responses, fixedDate, onFix, onUnfix }) {
  const available = responses.filter((r) => r.status === 'available');
  const counts = {};
  available.forEach((r) => {
    (r.dates || []).forEach((d) => {
      counts[d] = (counts[d] || 0) + 1;
    });
  });

  const sorted = Object.entries(counts).sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
  );
  const max = sorted.length ? sorted[0][1] : 0;
  const total = available.length;

  if (!sorted.length && !fixedDate) return null;

  return (
    <div className="bg-white p-7 rounded-[2.5rem] shadow-xl space-y-4 border border-gray-100">
      <h3 className="text-[11px] font-black text-gray-400 tracking-widest uppercase border-b pb-3">
        📊 日程候補
      </h3>

      {fixedDate && (
        <div className="bg-rose-500 text-white p-4 rounded-2xl flex justify-between items-center shadow-lg animate-in">
          <div>
            <div className="text-[9px] font-black uppercase opacity-80">確定日</div>
            <div className="text-xl font-black">{formatDateJa(fixedDate)}</div>
          </div>
          <button
            onClick={onUnfix}
            className="text-[10px] font-black bg-white/20 px-3 py-1.5 rounded-full"
          >
            解除
          </button>
        </div>
      )}

      <div className="space-y-2">
        {sorted.map(([date, count]) => {
          const isBest = count === max && max >= 2;
          const ratio = total ? (count / total) * 100 : 0;
          return (
            <div
              key={date}
              className={`p-3 rounded-2xl border transition-all ${
                isBest
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-gray-50 border-gray-100'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className={`font-black text-sm ${isBest ? 'text-emerald-700' : 'text-gray-700'}`}>
                  {formatDateJa(date)}
                  {isBest && <span className="ml-2 text-[9px] bg-emerald-500 text-white px-2 py-0.5 rounded-full">BEST</span>}
                </span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-black ${isBest ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {count}/{total}人
                  </span>
                  {fixedDate !== date && (
                    <button
                      onClick={() => onFix(date)}
                      className="text-[9px] font-black text-blue-500 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 active:scale-90 transition-transform"
                    >
                      確定
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-2 h-1.5 bg-gray-200/60 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${isBest ? 'bg-emerald-400' : 'bg-blue-300'}`}
                  style={{ width: `${ratio}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
