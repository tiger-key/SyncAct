// KAREN ロゴ（インラインSVG）
// Know All Responses, Easy & Neat.
export function LogoMark({ size = 28, className = '' }) {
  return (
    <svg width={size} height={size * 0.88} viewBox="0 0 500 440"
      className={className} xmlns="http://www.w3.org/2000/svg"
      role="img" aria-label="KAREN">
      <g fill="#163f5d">
        <rect x="8" y="8" width="112" height="112" rx="12" />
        <rect x="144" y="8" width="112" height="112" rx="12" />
        <rect x="8" y="164" width="112" height="112" rx="12" />
        <rect x="144" y="164" width="112" height="112" rx="12" />
        <rect x="8" y="320" width="112" height="112" rx="12" />
        <rect x="144" y="320" width="112" height="112" rx="12" />
      </g>
      <g stroke="#208070" strokeWidth="46" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M328 220 L450 90" />
        <path d="M328 220 L450 350" />
      </g>
      <g fill="#208070">
        <path d="M470 70 L410 96 L444 130 Z" />
        <path d="M470 370 L410 344 L444 310 Z" />
      </g>
    </svg>
  );
}

export function LogoLockup({ iconSize = 26, showTagline = false }) {
  return (
    <div className="flex items-center gap-2">
      <LogoMark size={iconSize} />
      <div className="leading-none">
        <div className="font-black tracking-tight" style={{ fontSize: iconSize * 0.72, color: '#163f5d', letterSpacing: '-0.5px' }}>
          KAREN
        </div>
        {showTagline && (
          <div className="font-bold uppercase" style={{ fontSize: 7, color: '#208070', letterSpacing: '0.06em', marginTop: 2 }}>
            Know All Responses, Easy &amp; Neat
          </div>
        )}
      </div>
    </div>
  );
}
