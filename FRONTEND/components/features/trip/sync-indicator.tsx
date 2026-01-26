"use client"

export function SyncIndicator() {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-600">
      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
      <span className="hidden sm:inline">Synced</span>
    </div>
  )
}


