import { WifiOff } from 'lucide-react'

export function OfflineBanner() {
  return (
    <div className="w-full bg-brand-500 text-white px-4 py-2.5 flex items-center justify-center gap-2.5 z-40 flex-shrink-0">
      <WifiOff className="w-4 h-4 animate-pulse-subtle flex-shrink-0" />
      <p className="text-sm font-medium">
        You're offline. Some features may be limited.
      </p>
    </div>
  )
}

export default OfflineBanner
