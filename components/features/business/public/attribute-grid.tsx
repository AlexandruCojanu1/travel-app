"use client"

interface AttributeGridProps {
  business?: any
  attributes: Record<string, any>
}

export function AttributeGrid({ business, attributes }: AttributeGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {attributes && Object.entries(attributes).map(([key, value]) => (
        <div key={key} className="p-4 bg-slate-50 rounded-lg">
          <div className="text-sm text-slate-600">{key}</div>
          <div className="font-semibold text-slate-900">{String(value)}</div>
        </div>
      ))}
    </div>
  )
}

