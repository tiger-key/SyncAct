import { formatDateJa } from '../lib/utils';

export default function ResponseList({ responses, onTapResponse }) {
  return (
    <div className="bg-white p-7 rounded-[2.5rem] shadow-xl space-y-5 border border-gray-100">
      <div className="flex justify-between items-center border-b pb-3">
        <h3 className="text-[11px] font-black text-gray-400 tracking-widest uppercase">回答状況</h3>
        <span className="text-[9px] font-black text-emerald-500 flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
          LIVE
        </span>
      </div>
      <div className="space-y-4">
        {!responses.length && (
          <p className="text-center py-4 text-gray-300 text-[10px] font-black uppercase">
            No responses yet
          </p>
        )}
        {responses.map((r) => {
          const isBatsu = r.status === 'unavailable';
          return (
            <div
              key={r.id}
              onClick={() => onTapResponse(r)}
              className={`${
                isBatsu ? 'bg-gray-100 opacity-60' : 'bg-blue-50/50'
              } p-4 rounded-[1.5rem] border border-blue-100/30 cursor-pointer active:scale-[0.98] transition-transform`}
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
                <span className="text-[9px] text-gray-300 font-black">タップで修正 ✏️</span>
              </div>
              <div className={`text-[10px] mt-1 font-bold ${isBatsu ? 'text-gray-400' : 'text-blue-600'}`}>
                {isBatsu ? '不参加 ❌' : (r.dates || []).map(formatDateJa).join(', ')}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
