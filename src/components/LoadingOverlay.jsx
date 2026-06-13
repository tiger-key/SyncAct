export default function LoadingOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: 'rgba(232,228,222,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="spinner mb-4"></div>
    </div>
  );
}
