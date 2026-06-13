// ===== ユーティリティ =====

// 【祝日ズレバグの修正ポイント】
// 旧コード: dayElem.dateObj.toISOString().split('T')[0]
// toISOString() はUTC変換するため、日本時間の0時は前日の15時(UTC)になり
// 日付が1日ずれていた。ローカルタイムのままフォーマットすることで解決。
export function fmtDateLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function genId() {
  return Math.random().toString(36).slice(2, 10);
}

// "🚗, 🍖" → ["🚗","🍖"] / 配列ならそのまま（DB齟齬の吸収）
export function toArray(v) {
  if (Array.isArray(v)) return v.filter(Boolean);
  if (typeof v === 'string')
    return v.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
}

export function formatDateJa(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const youbi = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
  return `${m}/${d}(${youbi})`;
}
