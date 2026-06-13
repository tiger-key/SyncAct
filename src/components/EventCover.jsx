import { coverGradient, coverEmoji } from '../lib/covers';

// カバー表示：写真があれば写真、なければグラデーション＋絵文字
export default function EventCover({ ev, height = 215, className = '', children }) {
  const hasPhoto = !!ev.coverImage;
  return (
    <div
      className={`cf-cover ${className}`}
      style={{
        height,
        background: hasPhoto ? `url(${ev.coverImage}) center/cover` : coverGradient(ev),
      }}
    >
      {!hasPhoto && <span>{coverEmoji(ev)}</span>}
      {children}
    </div>
  );
}
