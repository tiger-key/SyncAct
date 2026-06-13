export default function LoadingOverlay() {
  return (
    <div className="fixed inset-0 bg-white/60 z-50 flex flex-col items-center justify-center">
      <div className="spinner mb-4"></div>
    </div>
  );
}
