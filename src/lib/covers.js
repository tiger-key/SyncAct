// カバー画像ユーティリティ
// 写真なしイベント用：タイトル＋タグからグラデーションと絵文字を自動生成

const GRADIENTS = [
  'linear-gradient(140deg, #1a1a1a, #4a4a4a)',
  'linear-gradient(140deg, #1a1a2e, #0f3460)',
  'linear-gradient(140deg, #3d1a78, #6b2fa0)',
  'linear-gradient(140deg, #2c3e50, #4a6741)',
  'linear-gradient(140deg, #7b3f00, #c0392b)',
  'linear-gradient(140deg, #0b3d2e, #1d9e75)',
  'linear-gradient(140deg, #4a1942, #93305c)',
  'linear-gradient(140deg, #1f3a5f, #2e8b8b)',
  'linear-gradient(140deg, #3e2723, #8d6e63)',
  'linear-gradient(140deg, #263238, #546e7a)',
];

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function coverGradient(ev) {
  const key = (ev.title || '') + (ev.tags || []).join('');
  return GRADIENTS[hashStr(key) % GRADIENTS.length];
}

// タグ・タイトルから絵文字を抽出（なければデフォルト）
export function coverEmoji(ev) {
  const emojiRegex = /\p{Extended_Pictographic}/u;
  for (const t of ev.tags || []) {
    const m = t.match(emojiRegex);
    if (m) return m[0];
  }
  const m = (ev.title || '').match(emojiRegex);
  if (m) return m[0];
  return '📅';
}

// 画像ファイルをリサイズしてdataURLに変換（Firestore保存用）
// Firebase Storageは新規プロジェクトで有料プランが必要なため、
// 縮小画像をFirestoreドキュメントに直接保存する（1MB制限内に収める）
export function resizeImage(file, maxWidth = 900) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      let quality = 0.8;
      let dataUrl = canvas.toDataURL('image/jpeg', quality);
      // 700KB超なら品質を下げて再圧縮（Firestoreの1MB制限対策）
      while (dataUrl.length > 700 * 1024 && quality > 0.3) {
        quality -= 0.15;
        dataUrl = canvas.toDataURL('image/jpeg', quality);
      }
      resolve(dataUrl);
    };
    img.onerror = reject;
    img.src = url;
  });
}
