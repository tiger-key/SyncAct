// 祝日データ: holidays-jp の公開APIから取得（GAS不要に）
// 形式: { "2026-01-01": "元日", ... }
const CACHE_KEY = 'cache_holidays_v2';
const CACHE_TTL = 1000 * 60 * 60 * 24 * 7; // 1週間

export async function getHolidays() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
    if (cached && Date.now() - cached.at < CACHE_TTL) return cached.data;
  } catch (e) { /* キャッシュ破損は無視 */ }

  try {
    const res = await fetch('https://holidays-jp.github.io/api/v1/date.json');
    const data = await res.json();
    localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data }));
    return data;
  } catch (e) {
    console.error('祝日データ取得失敗:', e);
    return {};
  }
}
