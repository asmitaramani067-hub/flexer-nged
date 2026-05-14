export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center space-x-2">
      <div className="w-3 h-3 bg-gold-400 rounded-full animate-heartbeat-ping"></div>
      <div className="w-3 h-3 bg-atlantis-400 rounded-full animate-heartbeat-ping" style={{ animationDelay: '0.2s' }}></div>
      <div className="w-3 h-3 bg-orient-400 rounded-full animate-heartbeat-ping" style={{ animationDelay: '0.4s' }}></div>
    </div>
  );
}
